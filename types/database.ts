export type VendorStatus = 'invited' | 'in_progress' | 'complete' | 'approved';
export type DocumentType = 'w9' | 'coi' | 'banking' | 'license';

export interface Business {
  id: string;
  name: string;
  owner_email: string;
  created_at: string;
}

export interface Vendor {
  id: string;
  business_id: string;
  company_name: string;
  email: string;
  status: VendorStatus;
  invite_token: string | null;
  invited_at: string;
  completed_at: string | null;
  approved_at: string | null;
}

export interface Document {
  id: string;
  vendor_id: string;
  document_type: DocumentType;
  file_url: string;
  file_name: string;
  uploaded_at: string;
}

export interface RequiredDocument {
  id: string;
  business_id: string;
  document_type: DocumentType;
  is_required: boolean;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  w9: 'W-9 Tax Form',
  coi: 'Certificate of Insurance',
  banking: 'Banking Details',
  license: 'Business License',
};
