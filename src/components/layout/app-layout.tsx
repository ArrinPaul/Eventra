'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/header';
import SidebarNavigation from '@/components/layout/sidebar-navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';
import { cn } from '@/core/utils/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  
  // Don't show sidebar on auth pages
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const showSidebar = !isAuthPage;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {showSidebar ? (
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:flex w-80 flex-col border-r bg-muted/30">
            <SidebarNavigation />
          </aside>

          {/* Mobile Sidebar */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden fixed top-20 left-4 z-40 shadow-lg"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Navigation</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <SidebarNavigation />
            </SheetContent>
          </Sheet>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <div className={cn(
              'container mx-auto p-4 lg:p-6',
              'lg:ml-0', // Adjust margin for sidebar
              !showSidebar && 'max-w-7xl' // Full width when no sidebar
            )}>
              {children}
            </div>
          </main>
        </div>
      ) : (
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      )}
    </div>
  );
}