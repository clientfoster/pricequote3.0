import { ReactNode } from 'react';
import { AppMobileNav, AppSidebar } from './AppSidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex min-h-screen flex-1 min-w-0 flex-col">
        <AppMobileNav />
        <main className="flex-1 min-w-0 overflow-auto pt-14 md:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
