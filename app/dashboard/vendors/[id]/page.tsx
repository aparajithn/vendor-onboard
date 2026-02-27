import { createSupabaseServerClient } from '@/lib/supabase-server';
import { DOCUMENT_TYPE_LABELS } from '@/types/database';
import StatusBadge from '@/components/StatusBadge';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function VendorDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get vendor details
  const { data: vendor } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!vendor) {
    return <div className="text-center py-12">Vendor not found.</div>;
  }

  // Get documents
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('vendor_id', params.id);

  // Required document types
  const requiredTypes = ['w9', 'coi', 'banking', 'license'];
  const uploadedTypes = new Set(documents?.map(d => d.document_type) || []);

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/dashboard/vendors" className="text-sm text-indigo-600 hover:text-indigo-900">
          ← Back to Vendors
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {vendor.company_name}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">{vendor.email}</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <StatusBadge status={vendor.status} />
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Invited</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(vendor.invited_at).toLocaleString()}
              </dd>
            </div>
            {vendor.completed_at && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Completed</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(vendor.completed_at).toLocaleString()}
                </dd>
              </div>
            )}
            {vendor.approved_at && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Approved</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(vendor.approved_at).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Documents</h3>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {requiredTypes.map((type) => {
              const doc = documents?.find(d => d.document_type === type);
              return (
                <li key={type} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {DOCUMENT_TYPE_LABELS[type as keyof typeof DOCUMENT_TYPE_LABELS]}
                      </p>
                      {doc && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Uploaded
                        </span>
                      )}
                    </div>
                    {doc && (
                      <a
                        href={`/api/documents/${doc.id}/download`}
                        className="text-sm text-indigo-600 hover:text-indigo-900"
                      >
                        Download
                      </a>
                    )}
                  </div>
                  {doc && (
                    <p className="mt-1 text-sm text-gray-500">
                      {doc.file_name} • Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {vendor.status === 'complete' && (
        <div className="mt-6">
          <form action={`/api/vendors/${vendor.id}/approve`} method="POST">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Approve Vendor
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
