import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, description, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-card rounded-xl p-4 sm:p-6 shadow-card border border-border/50 animate-fade-in',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5 sm:space-y-2">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl sm:text-3xl font-display font-bold text-foreground">{value}</p>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  'text-xs sm:text-sm font-medium',
                  trend.isPositive ? 'text-success' : 'text-destructive'
                )}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>
        <div className="p-2 sm:p-3 rounded-lg bg-accent/10">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
        </div>
      </div>
    </div>
  );
}
