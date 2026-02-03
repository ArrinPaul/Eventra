'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogOut, Moon, Sun, Bell, User, Sparkles, Search } from 'lucide-react';
import { cn } from '@/core/utils/utils';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { NotificationBell } from '@/components/notifications/notification-center';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
      className="rounded-full w-9 h-9 text-gray-400 hover:text-white hover:bg-white/10"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/explore', label: 'Explore' },
    { href: '/tickets', label: 'My Tickets', requireAuth: true },
    { href: '/my-events', label: 'My Events', requireAuth: true },
    { href: '/admin', label: 'Dashboard', roles: ['organizer', 'admin'] },
  ].filter(link => {
    if (link.href === '/' || link.href === '/explore') return true;
    if (link.requireAuth && !user) return false;
    return !link.roles || (user && link.roles.includes(user.role));
  });

  return (
    <motion.header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled 
          ? "bg-black/80 backdrop-blur-xl border-b border-white/10" 
          : "bg-transparent"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 100 }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-red-500 to-red-600 rounded-xl blur opacity-40" />
            </div>
            <span className="text-2xl font-bold text-red-400">
              Eventra
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300",
                    isActive 
                      ? "text-white bg-white/10" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-500"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Search Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden md:flex rounded-full w-9 h-9 text-gray-400 hover:text-white hover:bg-white/10"
            >
              <Search className="w-5 h-5" />
            </Button>

            <ThemeToggle />
            
            {user ? (
              <>
                <NotificationBell />
                
                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-white/20 hover:border-white/40">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                        <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                          {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-black/90 backdrop-blur-xl border-white/10" align="end">
                    <div className="flex items-center gap-3 p-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.photoURL || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                          {user.displayName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{user.displayName || 'User'}</span>
                        <span className="text-xs text-gray-400">{user.email}</span>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem asChild className="text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer">
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer">
                      <Link href="/tickets">
                        My Tickets
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer">
                      <Link href="/settings">
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem 
                      onClick={logout}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Button asChild variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 rounded-full">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild className="bg-red-500 hover:bg-red-400 text-white font-semibold border-0 rounded-full">
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className={cn("h-0.5 w-full bg-white transition-all duration-300", mobileMenuOpen && "rotate-45 translate-y-2")} />
                <span className={cn("h-0.5 w-full bg-white transition-all duration-300", mobileMenuOpen && "opacity-0")} />
                <span className={cn("h-0.5 w-full bg-white transition-all duration-300", mobileMenuOpen && "-rotate-45 -translate-y-2")} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10"
          >
            <div className="px-6 py-6 space-y-2">
              {navLinks.map(link => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block text-lg font-medium p-3 rounded-xl transition-colors",
                    pathname === link.href 
                      ? "bg-white/10 text-white" 
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              
              {!user && (
                <div className="pt-4 flex flex-col gap-3">
                  <Button asChild variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 rounded-full">
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button asChild className="w-full bg-red-500 hover:bg-red-400 text-white font-semibold rounded-full">
                    <Link href="/register">Get Started</Link>
                  </Button>
                </div>
              )}
              
              {user && (
                <div className="pt-4">
                  <Button 
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    variant="outline" 
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-full"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
