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
  UserCircle,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

function useNavData() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isActive = (path: string) => {
    // For employee dashboard strict match
    if (path.includes('/dashboard') && location.pathname === path) return true;
    return location.pathname.startsWith(path);
  };

  const mainItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: user?.role === 'Employee' ? `/employee/${user?._id}/dashboard` : '/dashboard',
      icon: LayoutDashboard
    },
    { title: 'Quotations', href: '/quotations', icon: FileText },
    { title: 'New Quotation', href: '/quotations/new', icon: PlusCircle },
    { title: 'Clients', href: '/clients', icon: Users },
  ];

  const bottomItems: NavItem[] = [];

  if (user?.role === 'SuperAdmin') {
    bottomItems.push({ title: 'User Management', href: '/users', icon: Users });
    bottomItems.push({ title: 'Settings', href: '/settings', icon: Settings });
  } else {
    bottomItems.push({ title: 'My Profile', href: `/employee/${user?._id}/profile`, icon: UserCircle });
  }

  return { mainItems, bottomItems, isActive, logout };
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { mainItems, bottomItems, isActive, logout } = useNavData();

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out h-screen sticky top-0',
        collapsed ? 'md:w-16' : 'md:w-64'
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
        {mainItems.map((item) => (
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
        {bottomItems.map((item) => (
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

export function AppMobileNav() {
  const { mainItems, bottomItems, isActive, logout } = useNavData();

  return (
    <div className="md:hidden sticky top-0 z-30 bg-background border-b border-border">
      <div className="h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold text-sm">S</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display font-semibold text-foreground text-sm">Semixon</span>
            <span className="text-[10px] text-muted-foreground">Quote Pro</span>
          </div>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <div className="h-full flex flex-col bg-sidebar">
              <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
                <div className="flex items-center gap-3">
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
              </div>

              <nav className="flex-1 py-4 px-2 space-y-1">
                {mainItems.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <NavLink
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                        isActive(item.href)
                          ? 'bg-sidebar-accent text-sidebar-primary'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SheetClose>
                ))}
              </nav>

              <div className="py-4 px-2 border-t border-sidebar-border space-y-1">
                {bottomItems.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <NavLink
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                        isActive(item.href)
                          ? 'bg-sidebar-accent text-sidebar-primary'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SheetClose>
                ))}

                <SheetClose asChild>
                  <button
                    onClick={logout}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all duration-200',
                      'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <LogOut className="w-5 h-5 shrink-0" />
                    <span>Log out</span>
                  </button>
                </SheetClose>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
