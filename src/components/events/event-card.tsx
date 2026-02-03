'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Heart, 
  Clock, 
  Bookmark,
  Share2,
  Ticket,
  ChevronRight,
  Zap
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { eventService } from '@/core/services/firestore-services';
import type { Event } from '@/types';

interface EventCardProps {
  event: Event;
  variant?: 'default' | 'compact' | 'featured';
  showOrganizer?: boolean;
  onWishlist?: (eventId: string) => void;
  isWishlisted?: boolean;
}

// Default avatar colors for generating initials
const avatarColors = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'
];

export function EventCard({ 
  event, 
  variant = 'default', 
  showOrganizer = true,
  onWishlist,
  isWishlisted = false 
}: EventCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(isWishlisted);
  const [likeCount, setLikeCount] = useState(event.registeredCount || event.registeredUsers?.length || 0);
  const [isRegistering, setIsRegistering] = useState(false);

  const displayDate = event.startDate 
    ? new Date(event.startDate) 
    : (event.date ? new Date(event.date) : new Date());

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    });
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount((prev: number) => isLiked ? prev - 1 : prev + 1);
    onWishlist?.(event.id);
  };

  const getStatusBadge = () => {
    const now = new Date();
    const eventDate = displayDate;
    const registeredCount = event.registeredCount || event.registeredUsers?.length || 0;
    
    if (event.status === 'cancelled') {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    if (eventDate < now) {
      return <Badge variant="secondary">Past</Badge>;
    }
    if (registeredCount && event.capacity && registeredCount >= event.capacity) {
      return <Badge variant="secondary">Sold Out</Badge>;
    }
    
    // Check if event is soon (within 3 days)
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    if (eventDate.getTime() - now.getTime() < threeDays) {
      return <Badge className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)] text-white">Soon</Badge>;
    }
    
    return null;
  };

  const getLocationString = () => {
    if (event.location?.venue?.name) return event.location.venue.name;
    if (event.location?.isVirtual || event.location?.type === 'virtual') return 'Virtual Event';
    return 'Location TBD';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Tech': 'bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]',
      'Workshop': 'bg-[hsl(var(--secondary)/0.15)] text-[hsl(var(--secondary))]',
      'Networking': 'bg-[hsl(var(--accent)/0.15)] text-[hsl(var(--accent))]',
      'Social': 'bg-emerald-500/10 text-emerald-500',
      'Career': 'bg-amber-500/10 text-amber-500',
      'Academic': 'bg-sky-500/10 text-sky-500',
    };
    return colors[category] || 'bg-primary/10 text-primary';
  };

  // Quick register handler
  const handleQuickRegister = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user?.uid) {
      router.push('/auth/login');
      return;
    }

    const registeredCount = event.registeredCount || event.registeredUsers?.length || 0;
    if (event.capacity && registeredCount >= event.capacity) {
      toast({
        title: 'Event Full',
        description: 'This event has reached its capacity.',
        variant: 'destructive'
      });
      return;
    }

    setIsRegistering(true);
    try {
      await eventService.registerForEvent(event.id, user.uid);
      toast({
        title: 'Registered! ðŸŽ‰',
        description: `You're now registered for ${event.title}`,
      });
      setLikeCount(prev => prev + 1);
    } catch (error) {
      toast({
        title: 'Registration Failed',
        description: 'Could not register. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsRegistering(false);
    }
  };

  // Attendee avatar stack component
  const AttendeeAvatars = ({ count, max = 4 }: { count: number; max?: number }) => {
    // registeredUsers is typically an array of user IDs (strings)
    // For display, we just show colored initials
    const displayCount = Math.min(count, max);
    const remaining = count - max;
    
    return (
      <div className="flex items-center">
        <div className="flex -space-x-2">
          {Array.from({ length: displayCount }, (_, index) => {
            const colorClass = avatarColors[index % avatarColors.length];
            
            return (
              <Avatar key={index} className="h-6 w-6 border-2 border-background">
                <AvatarFallback className={cn("text-[10px] text-white", colorClass)}>
                  A{index + 1}
                </AvatarFallback>
              </Avatar>
            );
          })}
          {remaining > 0 && (
            <div className="h-6 w-6 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center">
              <span className="text-[10px] font-medium text-primary">+{remaining}</span>
            </div>
          )}
        </div>
        {count > 0 && (
          <span className="ml-2 text-xs text-muted-foreground">{count} going</span>
        )}
      </div>
    );
  };

  // Featured variant (large horizontal card)
  if (variant === 'featured') {
    const eventImage = event.imageUrl || event.image;
    const registeredCount = event.registeredCount || event.registeredUsers?.length || 0;
    
    return (
      <Link href={`/events/${event.id}`}>
        <Card className="group relative overflow-hidden border-0 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-500 rounded-3xl">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image Side */}
            <div className="relative h-64 md:h-full min-h-[300px] overflow-hidden rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ 
                  backgroundImage: eventImage 
                    ? `url(${eventImage})` 
                    : 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' 
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              
              {/* Top badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-0">
                  {event.category}
                </Badge>
                {getStatusBadge()}
              </div>
              
              {/* Like button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full"
                onClick={handleLike}
              >
                <Heart className={cn("w-5 h-5", isLiked ? "fill-red-500 text-red-500" : "text-white")} />
              </Button>
            </div>

            {/* Content Side */}
            <CardContent className="p-8 flex flex-col justify-center">
              <Badge className="w-fit mb-4 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 text-cyan-300 border border-cyan-500/30">
                ⭐ Featured Event
              </Badge>
              
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white group-hover:text-cyan-300 transition-colors">
                {event.title}
              </h2>
              
              <p className="text-gray-400 mb-6 line-clamp-2">
                {event.description}
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>{formatDate(displayDate)}</span>
                  <Clock className="w-4 h-4 text-cyan-400 ml-2" />
                  <span>{formatTime(displayDate)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>{getLocationString()}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>{likeCount} interested</span>
                  {event.capacity && (
                    <span className="text-gray-500">
                      · {event.capacity - registeredCount} spots left
                    </span>
                  )}
                </div>
              </div>

              <Button className="w-fit group/btn bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-gray-900 font-semibold rounded-full border-0">
                View Event
                <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </div>
        </Card>
      </Link>
    );
  }

  // Compact variant (small list item)
  if (variant === 'compact') {
    return (
      <Link href={`/events/${event.id}`}>
        <Card className="group hover:bg-white/10 transition-colors border-0 bg-white/5 backdrop-blur-sm rounded-xl">
          <CardContent className="p-4 flex items-center gap-4">
            {/* Date Badge */}
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 flex flex-col items-center justify-center">
              <span className="text-xs text-purple-400 font-medium uppercase">
                {displayDate.toLocaleDateString('en-US', { month: 'short' })}
              </span>
              <span className="text-xl font-bold text-white">
                {displayDate.getDate()}
              </span>
            </div>

            {/* Content */}
            <div className="flex-grow min-w-0">
              <h3 className="font-semibold truncate text-white group-hover:text-purple-300 transition-colors">
                {event.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                <Clock className="w-3 h-3 text-purple-400" />
                <span>{formatTime(displayDate)}</span>
                <span>·</span>
                <MapPin className="w-3 h-3 text-purple-400" />
                <span className="truncate">{getLocationString()}</span>
              </div>
            </div>

            {/* Actions */}
            <Button 
              variant="ghost" 
              size="icon"
              className="flex-shrink-0 hover:bg-white/10 rounded-full"
              onClick={handleLike}
            >
              <Heart className={cn("w-4 h-4", isLiked ? "fill-red-500 text-red-500" : "text-gray-400")} />
            </Button>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Default variant (grid card)
  return (
    <Link href={`/events/${event.id}`}>
      <Card className="group relative overflow-hidden border-0 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-2 h-full rounded-2xl">
        {/* Image */}
        <div className="relative h-48 overflow-hidden rounded-t-2xl">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
            style={{ 
              backgroundImage: (event.imageUrl || event.image)
                ? `url(${event.imageUrl || event.image})` 
                : 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' 
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Top badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className="bg-white/20 backdrop-blur-sm text-white text-xs border-0">
              {event.category}
            </Badge>
            {getStatusBadge()}
          </div>
          
          {/* Like button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-3 right-3 h-9 w-9 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full"
            onClick={handleLike}
          >
            <Heart className={cn("w-4 h-4", isLiked ? "fill-red-500 text-red-500" : "text-white")} />
          </Button>

          {/* Date badge on image */}
          <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm rounded-xl px-3 py-2 flex flex-col items-center border border-white/10">
            <span className="text-xs text-cyan-400 font-medium uppercase">
              {displayDate.toLocaleDateString('en-US', { month: 'short' })}
            </span>
            <span className="text-xl font-bold leading-none text-white">
              {displayDate.getDate()}
            </span>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-5">
          <h3 className="font-bold text-lg line-clamp-2 mb-2 text-white group-hover:text-cyan-300 transition-colors">
            {event.title}
          </h3>
          
          <p className="text-sm text-gray-400 line-clamp-2 mb-4">
            {event.description}
          </p>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>{formatTime(displayDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span className="truncate">{getLocationString()}</span>
            </div>
          </div>

          {/* Attendee Avatar Stack */}
          {likeCount > 0 && (
            <div className="mb-4">
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {Array.from({ length: Math.min(likeCount, 3) }, (_, index) => (
                    <div 
                      key={index} 
                      className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-400 border-2 border-black"
                    />
                  ))}
                </div>
                <span className="ml-2 text-xs text-gray-400">+{likeCount} going</span>
              </div>
            </div>
          )}

          {/* Footer with Quick Register */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              {(event.pricing?.isFree || event.pricing?.type === 'free') ? (
                <span className="text-green-400 font-bold">Free</span>
              ) : event.pricing?.basePrice ? (
                <span className="text-white font-bold">${event.pricing.basePrice}</span>
              ) : (
                <span className="text-green-400 font-bold">Free</span>
              )}
            </div>
            
            {/* Quick Register Button */}
            <Button 
              size="sm" 
              className="h-9 px-4 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-gray-900 font-semibold rounded-full border-0"
              onClick={handleQuickRegister}
              disabled={isRegistering || (event.capacity ? likeCount >= event.capacity : false)}
            >
              {isRegistering ? (
                <>
                  <Zap className="w-3 h-3 mr-1 animate-pulse" />
                  ...
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3 mr-1" />
                  Register
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default EventCard;
