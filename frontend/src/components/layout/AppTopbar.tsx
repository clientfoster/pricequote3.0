import { Badge } from '@/components/ui/badge';

export function AppTopbar() {
  return (
    <div className="hidden md:flex sticky top-0 z-20 h-14 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-foreground">Quick Actions</span>
        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-100">
          Live
        </Badge>
      </div>
    </div>
  );
}
