'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DOCUMENT_TYPE_LABELS, DocumentType } from '@/types/database';

export default function OnboardPage({ params }: { params: { token: string } }) {
  const [vendor, setVendor] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const requiredDocs: DocumentType[] = ['w9', 'coi', 'banking', 'license'];

  useEffect(() => {
    loadVendor();
  }, [params.token]);

  async function loadVendor() {
    try {
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('invite_token', params.token)
        .single();

      if (vendorError) throw vendorError;
      setVendor(vendorData);

      const { data: docsData } = await supabase
        .from('documents')
        .select('*')
        .eq('vendor_id', vendorData.id);

      setDocuments(docsData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(docType: DocumentType, file: File) {
    if (!vendor) return;

    setUploading(docType);
    setError('');

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${vendor.id}/${docType}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vendor-documents')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Save document record
      const { error: docError } = await supabase
        .from('documents')
        .upsert({
          vendor_id: vendor.id,
          document_type: docType,
          file_url: uploadData.path,
          file_name: file.name,
        }, { onConflict: 'vendor_id,document_type' });

      if (docError) throw docError;

      // Update vendor status to in_progress
      if (vendor.status === 'invited') {
        await supabase
          .from('vendors')
          .update({ status: 'in_progress' })
          .eq('id', vendor.id);
      }

      // Reload vendor and documents
      await loadVendor();
    } catch (err: any) {
      setError(`Failed to upload ${docType}: ${err.message}`);
    } finally {
      setUploading(null);
    }
  }

  async function handleComplete() {
    if (!vendor) return;

    try {
      await supabase
        .from('vendors')
        .update({ 
          status: 'complete',
          completed_at: new Date().toISOString()
        })
        .eq('id', vendor.id);

      window.location.href = '/onboard/complete';
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!vendor) {
    return <div className="min-h-screen flex items-center justify-center">Invalid invite link.</div>;
  }

  const uploadedTypes = new Set(documents.map(d => d.document_type));
  const allUploaded = requiredDocs.every(type => uploadedTypes.has(type));

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to VendorOnboard</h1>
          <p className="mt-2 text-lg text-gray-600">
            Please upload the required documents for {vendor.company_name}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white shadow sm:rounded-lg p-6 space-y-6">
          {requiredDocs.map((docType) => {
            const uploaded = uploadedTypes.has(docType);
            const isUploading = uploading === docType;

            return (
              <div key={docType} className="border-b border-gray-200 pb-6 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {DOCUMENT_TYPE_LABELS[docType]}
                  </h3>
                  {uploaded && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Uploaded
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <label className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-500 cursor-pointer">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="text-sm text-gray-600">
                        {isUploading ? (
                          <span className="text-indigo-600">Uploading...</span>
                        ) : (
                          <>
                            <span className="text-indigo-600 hover:text-indigo-500">Upload a file</span>
                            <span> or drag and drop</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
                    </div>
                    <input
                      type="file"
                      className="sr-only"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(docType, file);
                      }}
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </div>
            );
          })}

          {allUploaded && vendor.status !== 'complete' && (
            <div className="pt-4">
              <button
                onClick={handleComplete}
                className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Submit All Documents
              </button>
            </div>
          )}

          {!allUploaded && (
            <div className="text-center text-sm text-gray-500">
              Upload all {requiredDocs.length} documents to submit for review
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
