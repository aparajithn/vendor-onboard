-- VendorOnboard Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('invited', 'in_progress', 'complete', 'approved')) DEFAULT 'invited',
  invite_token TEXT UNIQUE,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(business_id, email)
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('w9', 'coi', 'banking', 'license')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vendor_id, document_type)
);

-- Required documents table
CREATE TABLE IF NOT EXISTS required_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('w9', 'coi', 'banking', 'license')),
  is_required BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(business_id, document_type)
);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-documents', 'vendor-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vendor-documents');

-- Storage policy: Allow users to read their own business documents
CREATE POLICY "Allow business owners to read documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'vendor-documents');

-- Row Level Security Policies

-- Enable RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE required_documents ENABLE ROW LEVEL SECURITY;

-- Businesses: Users can only see their own business
CREATE POLICY "Users can view their own business"
ON businesses FOR SELECT
TO authenticated
USING (owner_email = auth.jwt()->>'email');

CREATE POLICY "Users can insert their own business"
ON businesses FOR INSERT
TO authenticated
WITH CHECK (owner_email = auth.jwt()->>'email');

-- Vendors: Users can see vendors for their business
CREATE POLICY "Business owners can view their vendors"
ON vendors FOR SELECT
TO authenticated
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_email = auth.jwt()->>'email'
  )
);

CREATE POLICY "Business owners can insert vendors"
ON vendors FOR INSERT
TO authenticated
WITH CHECK (
  business_id IN (
    SELECT id FROM businesses WHERE owner_email = auth.jwt()->>'email'
  )
);

CREATE POLICY "Business owners can update their vendors"
ON vendors FOR UPDATE
TO authenticated
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_email = auth.jwt()->>'email'
  )
);

-- Vendors can view themselves via invite token (no auth required)
CREATE POLICY "Vendors can view via invite token"
ON vendors FOR SELECT
TO anon
USING (true);

CREATE POLICY "Vendors can update via invite token"
ON vendors FOR UPDATE
TO anon
USING (true);

-- Documents: Business owners and vendors can view/upload
CREATE POLICY "Business owners can view documents"
ON documents FOR SELECT
TO authenticated
USING (
  vendor_id IN (
    SELECT v.id FROM vendors v
    JOIN businesses b ON v.business_id = b.id
    WHERE b.owner_email = auth.jwt()->>'email'
  )
);

CREATE POLICY "Vendors can view their documents"
ON documents FOR SELECT
TO anon
USING (true);

CREATE POLICY "Vendors can insert their documents"
ON documents FOR INSERT
TO anon
WITH CHECK (true);

-- Required documents policies
CREATE POLICY "Business owners can manage required docs"
ON required_documents FOR ALL
TO authenticated
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_email = auth.jwt()->>'email'
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendors_business_id ON vendors(business_id);
CREATE INDEX IF NOT EXISTS idx_vendors_invite_token ON vendors(invite_token);
CREATE INDEX IF NOT EXISTS idx_documents_vendor_id ON documents(vendor_id);
CREATE INDEX IF NOT EXISTS idx_required_documents_business_id ON required_documents(business_id);
