'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Event } from '@/types';

interface EventCardProps {
  event: Event;
  variant?: 'default' | 'compact' | 'featured';
  showOrganizer?: boolean;
  onWishlist?: (eventId: string) => void;
  isWishlisted?: boolean;
}

export function EventCard({ 
  event, 
  variant = 'default', 
  showOrganizer = true,
  onWishlist,
  isWishlisted = false 
}: EventCardProps) {
  const [isLiked, setIsLiked] = useState(isWishlisted);
  const [likeCount, setLikeCount] = useState(event.registeredCount || event.registeredUsers?.length || 0);

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

  // Featured variant (large horizontal card)
  if (variant === 'featured') {
    const eventImage = event.imageUrl || event.image;
    const registeredCount = event.registeredCount || event.registeredUsers?.length || 0;
    
    return (
      <Link href={`/events/${event.id}`}>
        <Card className="group relative overflow-hidden border-0 bg-card hover:shadow-2xl transition-all duration-500">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image Side */}
            <div className="relative h-64 md:h-full min-h-[300px] overflow-hidden">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ 
                  backgroundImage: eventImage 
                    ? `url(${eventImage})` 
                    : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)' 
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              
              {/* Top badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge className={cn("backdrop-blur-sm", getCategoryColor(event.category))}>
                  {event.category}
                </Badge>
                {getStatusBadge()}
              </div>
              
              {/* Like button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm hover:bg-white/30"
                onClick={handleLike}
              >
                <Heart className={cn("w-5 h-5", isLiked ? "fill-red-500 text-red-500" : "text-white")} />
              </Button>
            </div>

            {/* Content Side */}
            <CardContent className="p-8 flex flex-col justify-center">
              <Badge variant="outline" className="w-fit mb-4">
                Featured Event
              </Badge>
              
              <h2 className="text-2xl md:text-3xl font-bold font-headline mb-3 group-hover:text-primary transition-colors">
                {event.title}
              </h2>
              
              <p className="text-muted-foreground mb-6 line-clamp-2">
                {event.description}
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{formatDate(displayDate)}</span>
                  <Clock className="w-4 h-4 text-primary ml-2" />
                  <span>{formatTime(displayDate)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{getLocationString()}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Users className="w-4 h-4 text-primary" />
                  <span>{likeCount} interested</span>
                  {event.capacity && (
                    <span className="text-muted-foreground">
                      · {event.capacity - registeredCount} spots left
                    </span>
                  )}
                </div>
              </div>

              <Button className="w-fit group/btn">
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
        <Card className="group hover:bg-muted/50 transition-colors border-0 bg-transparent">
          <CardContent className="p-4 flex items-center gap-4">
            {/* Date Badge */}
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
              <span className="text-xs text-primary font-medium uppercase">
                {displayDate.toLocaleDateString('en-US', { month: 'short' })}
              </span>
              <span className="text-xl font-bold text-primary">
                {displayDate.getDate()}
              </span>
            </div>

            {/* Content */}
            <div className="flex-grow min-w-0">
              <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                {event.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Clock className="w-3 h-3" />
                <span>{formatTime(displayDate)}</span>
                <span>·</span>
                <MapPin className="w-3 h-3" />
                <span className="truncate">{getLocationString()}</span>
              </div>
            </div>

            {/* Actions */}
            <Button 
              variant="ghost" 
              size="icon"
              className="flex-shrink-0"
              onClick={handleLike}
            >
              <Heart className={cn("w-4 h-4", isLiked ? "fill-red-500 text-red-500" : "")} />
            </Button>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Default variant (grid card)
  return (
    <Link href={`/events/${event.id}`}>
      <Card className="group relative overflow-hidden border-0 bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ 
              backgroundImage: (event.imageUrl || event.image)
                ? `url(${event.imageUrl || event.image})` 
                : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)' 
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Top badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={cn("backdrop-blur-sm text-xs", getCategoryColor(event.category))}>
              {event.category}
            </Badge>
            {getStatusBadge()}
          </div>
          
          {/* Like button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-3 right-3 h-8 w-8 bg-white/20 backdrop-blur-sm hover:bg-white/30"
            onClick={handleLike}
          >
            <Heart className={cn("w-4 h-4", isLiked ? "fill-red-500 text-red-500" : "text-white")} />
          </Button>

          {/* Date badge on image */}
          <div className="absolute bottom-3 left-3 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 flex flex-col items-center shadow-lg">
            <span className="text-xs text-primary font-medium uppercase">
              {displayDate.toLocaleDateString('en-US', { month: 'short' })}
            </span>
            <span className="text-xl font-bold leading-none">
              {displayDate.getDate()}
            </span>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {event.description}
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 text-primary/70" />
              <span>{formatTime(displayDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary/70" />
              <span className="truncate">{getLocationString()}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {likeCount} interested
              </span>
            </div>
            
            {(event.pricing?.isFree || event.pricing?.type === 'free') ? (
              <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                Free
              </Badge>
            ) : event.pricing?.basePrice ? (
              <Badge variant="secondary">
                ${event.pricing.basePrice}
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default EventCard;
