import { VendorStatus } from '@/types/database';

interface StatusBadgeProps {
  status: VendorStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    invited: { label: 'Invited', className: 'bg-gray-100 text-gray-800' },
    in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
    complete: { label: 'Complete', className: 'bg-green-100 text-green-800' },
    approved: { label: 'Approved', className: 'bg-purple-100 text-purple-800' },
  };

  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
