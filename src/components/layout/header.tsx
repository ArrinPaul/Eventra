'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Menu, Moon, Sun, Search, X } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { cn } from '@/core/utils/utils';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { NotificationBell } from '@/features/notifications/notification-center';
import { motion, AnimatePresence } from 'framer-motion';
import { UserButton } from "@clerk/nextjs";
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { useTranslations } from 'next-intl';

function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-9 w-9" />;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="rounded-md w-9 h-9 text-notion-ink-muted hover:bg-notion-canvas-soft"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const t = useTranslations('Common');
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/explore', label: t('explore') },
    { href: '/tickets', label: t('tickets'), requireAuth: true },
    { href: '/my-events', label: 'My Events', requireAuth: true },
    { href: '/admin', label: t('dashboard'), roles: ['organizer', 'admin'] },
  ].filter(link => {
    if (link.href === '/' || link.href === '/explore') return true;
    if (link.requireAuth && !isAuthenticated) return false;
    return !link.roles || (user && link.roles.includes(user.role));
  });

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-notion-surface/80 backdrop-blur-md border-b border-notion-hairline">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-12">
          {/* Logo & Desktop Nav */}
          <div className="flex items-center gap-6">
            <Link href="/" className="shrink-0 active:scale-95">
              <Logo showText />
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "px-2.5 py-1 text-[14px] font-medium rounded-sm transition-colors",
                      isActive
                        ? "text-notion-ink bg-notion-canvas-soft font-semibold"
                        : "text-notion-ink-secondary hover:bg-notion-canvas-soft hover:text-notion-ink"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            <div className="hidden sm:flex items-center gap-0.5 mr-1 pr-1 border-r border-notion-hairline">
              <Button variant="ghost" size="icon" className="w-8 h-8 text-notion-ink-muted hover:bg-notion-canvas-soft" asChild>
                <Link href="/search">
                  <Search className="w-4 h-4" />
                </Link>
              </Button>
              <ThemeToggle />
            </div>

            {isAuthenticated && (
              <div className="mr-1">
                <NotificationBell />
              </div>
            )}

            {isAuthenticated ? (
              <UserButton 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-7 w-7 rounded-sm border border-notion-hairline shadow-notion-soft",
                    userButtonTrigger: "focus:shadow-none focus:ring-0",
                  }
                }}
              />
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Button variant="ghost" size="sm" asChild className="h-8 text-[14px] text-notion-ink-secondary">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button size="sm" variant="utility" asChild className="h-8 text-[14px]">
                  <Link href="/register">Get Eventra free</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden w-9 h-9"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5 text-notion-ink" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-notion-surface shadow-notion-elevated z-50 md:hidden flex flex-col"
            >
              <div className="p-4 flex items-center justify-between border-b border-notion-hairline">
                <Logo showText />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="w-5 h-5 text-notion-ink" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <nav className="flex flex-col gap-1">
                  {navLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "px-4 py-3 rounded-md text-body-md font-medium transition-colors",
                        pathname === link.href
                          ? "bg-notion-canvas-soft text-notion-ink"
                          : "text-notion-ink-secondary hover:bg-notion-canvas-soft"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>

                <div className="pt-6 border-t border-notion-hairline space-y-4">
                  {isAuthenticated ? (
                    <div className="px-4 py-3 rounded-md bg-notion-canvas-soft flex items-center gap-3">
                       <UserButton />
                       <div className="flex flex-col overflow-hidden">
                          <span className="text-body-sm font-semibold truncate">{user?.name}</span>
                          <span className="text-caption text-notion-ink-muted capitalize">{user?.role}</span>
                       </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button asChild variant="primary" className="w-full">
                        <Link href="/register">Get Eventra free</Link>
                      </Button>
                      <Button asChild variant="secondary" className="w-full">
                        <Link href="/login">Log in</Link>
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between px-4">
                    <span className="text-body-sm text-notion-ink-secondary">Theme</span>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
