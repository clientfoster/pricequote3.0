import { cn } from '@/lib/utils';
import type { QuotationStatus } from '@/types/quotation';

interface StatusBadgeProps {
  status: QuotationStatus;
  className?: string;
}

const statusConfig: Record<QuotationStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-muted text-muted-foreground',
  },
  sent: {
    label: 'Sent',
    className: 'bg-primary/10 text-primary',
  },
  accepted: {
    label: 'Accepted',
    className: 'bg-success/10 text-success',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-destructive/10 text-destructive',
  },
  expired: {
    label: 'Expired',
    className: 'bg-warning/10 text-warning',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
