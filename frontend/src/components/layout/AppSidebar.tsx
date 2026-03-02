import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    // For employee dashboard strict match
    if (path.includes('/dashboard') && location.pathname === path) return true;
    return location.pathname.startsWith(path);
  };

  const getMainNavItems = (): NavItem[] => {
    const items = [
      {
        title: 'Dashboard',
        href: user?.role === 'Employee' ? `/employee/${user?._id}/dashboard` : '/dashboard',
        icon: LayoutDashboard
      },
      { title: 'Quotations', href: '/quotations', icon: FileText },
      { title: 'New Quotation', href: '/quotations/new', icon: PlusCircle },
      { title: 'Clients', href: '/clients', icon: Users },
    ];
    return items;
  };

  const getBottomNavItems = (): NavItem[] => {
    const items: NavItem[] = [];

    if (user?.role === 'SuperAdmin') {
      items.push({ title: 'User Management', href: '/users', icon: Users });
      items.push({ title: 'Settings', href: '/settings', icon: Settings });
    } else {
      items.push({ title: 'My Profile', href: `/employee/${user?._id}/profile`, icon: UserCircle });
    }

    return items;
  };

  return (
    <aside
      className={cn(
        'flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out h-screen sticky top-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold text-sm">S</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-semibold text-sidebar-accent-foreground text-sm">
                Semixon
              </span>
              <span className="text-xs text-sidebar-muted">Quote Pro</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center mx-auto">
            <span className="text-sidebar-primary-foreground font-bold text-sm">S</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {getMainNavItems().map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              isActive(item.href)
                ? 'bg-sidebar-accent text-sidebar-primary'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
            )}
          >
            <item.icon className={cn('w-5 h-5 shrink-0', collapsed && 'mx-auto')} />
            {!collapsed && <span className="animate-fade-in">{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="py-4 px-2 border-t border-sidebar-border space-y-1">
        {getBottomNavItems().map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              isActive(item.href)
                ? 'bg-sidebar-accent text-sidebar-primary'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
            )}
          >
            <item.icon className={cn('w-5 h-5 shrink-0', collapsed && 'mx-auto')} />
            {!collapsed && <span className="animate-fade-in">{item.title}</span>}
          </NavLink>
        ))}

        <button
          onClick={logout}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all duration-200',
            'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
          )}
        >
          <LogOut className={cn('w-5 h-5 shrink-0', collapsed && 'mx-auto')} />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full justify-center text-sidebar-muted hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50',
            collapsed ? 'px-0' : ''
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
