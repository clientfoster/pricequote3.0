import { MoreHorizontal, PlusCircle, UserPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AppTopbar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isSuperAdmin = user?.role === 'SuperAdmin';

  return (
    <div className="hidden md:flex sticky top-0 z-20 h-14 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-foreground">Quick Actions</span>
        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-100">
          Live
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="accent" size="sm" onClick={() => navigate('/quotations/new')}>
          <PlusCircle className="w-4 h-4" />
          New Quotation
        </Button>
        {isSuperAdmin && (
          <Button variant="outline" size="sm" onClick={() => navigate('/clients')}>
            <Users className="w-4 h-4" />
            New Client
          </Button>
        )}
        {isSuperAdmin && (
          <Button variant="outline" size="sm" onClick={() => navigate('/users')}>
            <UserPlus className="w-4 h-4" />
            Invite User
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate('/quotations/new')}>
              New Quotation
            </DropdownMenuItem>
            {isSuperAdmin && (
              <DropdownMenuItem onClick={() => navigate('/clients')}>
                New Client
              </DropdownMenuItem>
            )}
            {isSuperAdmin && (
              <DropdownMenuItem onClick={() => navigate('/users')}>
                Invite User
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
