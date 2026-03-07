import { cn } from '@/lib/utils';
import type { QuotationStatus } from '@/types/quotation';

interface StatusBadgeProps {
  status: QuotationStatus;
  className?: string;
}

const statusConfig: Record<QuotationStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-muted/70 text-muted-foreground border border-muted-foreground/20',
  },
  sent: {
    label: 'Sent',
    className: 'bg-primary/10 text-primary border border-primary/30',
  },
  accepted: {
    label: 'Accepted',
    className: 'bg-success/10 text-success border border-success/30',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-destructive/10 text-destructive border border-destructive/30',
  },
  expired: {
    label: 'Expired',
    className: 'bg-warning/10 text-warning border border-warning/30',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
