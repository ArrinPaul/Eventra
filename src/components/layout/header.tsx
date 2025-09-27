'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, UserCircle, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/agenda', label: 'Agenda' },
    { href: '/events', label: 'Events' },
    { href: '/chat', label: 'Chat' },
    { href: '/check-in', label: 'Check-in' },
    { href: '/my-events', label: 'My Events' },
    { href: '/admin', label: 'Dashboard', roles: ['organizer'] },
  ].filter(link => !link.roles || (user && link.roles.includes(user.role)));

  const renderNavLinks = (isMobile = false) => (
    <nav className={cn(
      isMobile ? 'flex flex-col space-y-2' : 'hidden md:flex items-center space-x-6 text-sm font-medium'
    )}>
      {user && navLinks.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'transition-colors hover:text-primary',
            pathname === link.href ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        {renderNavLinks()}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="hidden sm:inline text-sm text-muted-foreground">Welcome, {user.name.split(' ')[0]}</span>
              <Button variant="ghost" size="icon" onClick={logout} className="interactive-element">
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Logout</span>
              </Button>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button asChild variant="ghost" className="interactive-element">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="interactive-element bg-gradient-to-r from-primary to-accent text-primary-foreground">
                <Link href="/register">Register</Link>
              </Button>
            </div>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col space-y-6 pt-10">
                <Logo />
                {user ? (
                    <>
                        {renderNavLinks(true)}
                        <Button variant="outline" onClick={logout} className="w-full">
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </>
                ) : (
                    <div className="flex flex-col space-y-2">
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/login">Login</Link>
                        </Button>
                        <Button asChild className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground">
                            <Link href="/register">Register</Link>
                        </Button>
                    </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
