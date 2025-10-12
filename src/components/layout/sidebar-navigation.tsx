'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Home, 
  Calendar, 
  Users, 
  MessageSquare, 
  Network, 
  Ticket, 
  Heart, 
  Trophy, 
  Award, 
  MessageCircle, 
  QrCode, 
  Scan, 
  Settings, 
  BarChart3,
  Sparkles,
  BookOpen,
  Target,
  TrendingUp,
  Bell,
  Search,
  ChevronDown,
  ChevronRight,
  FileText,
  Bot,
  Zap,
  Globe,
  Brain,
  Workflow
} from 'lucide-react';

interface NavigationSection {
  title: string;
  items: NavigationItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
}

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  roles?: string[];
  description?: string;
  isNew?: boolean;
}

const navigationSections: NavigationSection[] = [
  {
    title: 'Dashboard',
    items: [
      {
        href: '/',
        label: 'Home',
        icon: Home,
        description: 'Main dashboard and overview'
      }
    ]
  },
  {
    title: 'Events & Learning',
    items: [
      {
        href: '/agenda',
        label: 'Agenda',
        icon: Calendar,
        description: 'Event schedule and sessions'
      },
      {
        href: '/my-events',
        label: 'My Events',
        icon: Target,
        description: 'Your registered events'
      },
      {
        href: '/ticketing',
        label: 'Tickets',
        icon: Ticket,
        description: 'Purchase and manage tickets'
      },
      {
        href: '/calendar',
        label: 'Calendar',
        icon: Calendar,
        description: 'Google Calendar integration and sync',
        isNew: true
      }
    ]
  },
  {
    title: 'AI-Powered Features',
    collapsible: true,
    defaultOpen: true,
    items: [
      {
        href: '/matchmaking',
        label: 'Smart Connect',
        icon: Heart,
        badge: 'AI',
        description: 'AI-powered networking and matching',
        isNew: true
      },
      {
        href: '/ai-recommendations',
        label: 'Recommendations',
        icon: Sparkles,
        badge: 'AI',
        description: 'Personalized event and content suggestions',
        isNew: true
      }
    ]
  },
  {
    title: 'Community & Social',
    items: [
      {
        href: '/community',
        label: 'Communities',
        icon: Users,
        description: 'Join and participate in communities'
      },
      {
        href: '/feed',
        label: 'Social Feed',
        icon: MessageSquare,
        description: 'Latest updates and discussions'
      },
      {
        href: '/networking',
        label: 'Networking',
        icon: Network,
        description: 'Build professional connections'
      },
      {
        href: '/groups',
        label: 'Groups',
        icon: Users,
        description: 'Recurring meetings and study groups'
      },
      {
        href: '/chat',
        label: 'Messages',
        icon: MessageCircle,
        description: 'Direct and group conversations'
      }
    ]
  },
  {
    title: 'Gamification',
    items: [
      {
        href: '/gamification',
        label: 'Achievements',
        icon: Trophy,
        description: 'Track your progress and achievements'
      },
      {
        href: '/leaderboard',
        label: 'Leaderboard',
        icon: Award,
        description: 'See top performers and rankings'
      }
    ]
  },
  {
    title: 'Advanced Integrations',
    collapsible: true,
    defaultOpen: true,
    items: [
      {
        href: '/integrations',
        label: 'Integrations Hub',
        icon: Workflow,
        description: 'Access all advanced integrations',
        isNew: true
      },
      {
        href: '/integrations/google-workspace',
        label: 'Google Workspace',
        icon: FileText,
        badge: 'Pro',
        description: 'Enhanced Google Docs & Sheets integration',
        isNew: true
      },
      {
        href: '/integrations/notation-system',
        label: 'Collaborative Notation',
        icon: Users,
        badge: 'New',
        description: 'Internal documentation system',
        isNew: true
      },
      {
        href: '/integrations/ai-assistant',
        label: 'AI Assistant',
        icon: Bot,
        badge: 'AI',
        description: 'Intelligent chatbot assistance',
        isNew: true
      },
      {
        href: '/integrations/automation',
        label: 'Workflow Automation',
        icon: Zap,
        badge: 'Pro',
        description: 'n8n automation integration',
        isNew: true
      },
      {
        href: '/integrations/ai-insights',
        label: 'AI Insights',
        icon: Brain,
        badge: 'AI',
        description: 'Predictive analytics dashboard',
        isNew: true
      },
      {
        href: '/integrations/web-scraper',
        label: 'Market Intelligence',
        icon: Globe,
        badge: 'Beta',
        description: 'Web scraper & competitor analysis',
        isNew: true
      }
    ]
  },
  {
    title: 'Tools & Utilities',
    items: [
      {
        href: '/check-in',
        label: 'Check-in',
        icon: QrCode,
        description: 'Event check-in and attendance'
      },
      {
        href: '/search',
        label: 'Advanced Search',
        icon: Search,
        description: 'Find events, people, and content',
        isNew: true
      },
      {
        href: '/analytics',
        label: 'Analytics',
        icon: BarChart3,
        description: 'Platform insights and metrics',
        isNew: true
      },
      {
        href: '/export',
        label: 'Export Data',
        icon: TrendingUp,
        description: 'Download your data and reports',
        isNew: true
      },
      {
        href: '/preferences',
        label: 'Preferences',
        icon: Settings,
        description: 'Customize your experience',
        isNew: true
      }
    ]
  },
  {
    title: 'Admin & Management',
    items: [
      {
        href: '/check-in-scanner',
        label: 'QR Scanner',
        icon: Scan,
        roles: ['organizer'],
        description: 'Scan attendee QR codes'
      },
      {
        href: '/organizer',
        label: 'Event Management',
        icon: Settings,
        roles: ['organizer'],
        description: 'Manage events and content'
      },
      {
        href: '/admin',
        label: 'Analytics Dashboard',
        icon: BarChart3,
        roles: ['organizer'],
        description: 'Advanced analytics and insights'
      }
    ]
  }
];

interface SidebarNavigationProps {
  className?: string;
}

export default function SidebarNavigation({ className }: SidebarNavigationProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Initialize collapsed sections based on default states
    const initialCollapsed: { [key: string]: boolean } = {};
    navigationSections.forEach(section => {
      if (section.collapsible && !section.defaultOpen) {
        initialCollapsed[section.title] = true;
      }
    });
    setCollapsedSections(initialCollapsed);
  }, []);

  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

  const filterItems = (items: NavigationItem[]) => {
    return items.filter(item => {
      if (!user && !['/agenda', '/ticketing'].includes(item.href)) {
        return false;
      }
      return !item.roles || (user && item.roles.includes(user.role));
    });
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Navigation</h2>
      </div>
      
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-6 py-4">
          {navigationSections.map((section) => {
            const filteredItems = filterItems(section.items);
            
            if (filteredItems.length === 0) return null;

            const isCollapsed = collapsedSections[section.title];
            
            return (
              <div key={section.title} className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    {section.title}
                  </h3>
                  {section.collapsible && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection(section.title)}
                      className="h-6 w-6 p-0"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
                
                {(!section.collapsible || !isCollapsed) && (
                  <div className="space-y-1">
                    {filteredItems.map((item) => {
                      const isActive = pathname === item.href;
                      
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors relative group',
                            isActive
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          )}
                        >
                          <item.icon className={cn('h-4 w-4', isActive && 'text-primary')} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate">{item.label}</span>
                              {item.badge && (
                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                  {item.badge}
                                </Badge>
                              )}
                              {item.isNew && (
                                <div className="h-2 w-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                          
                          {isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {user && (
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.role}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}