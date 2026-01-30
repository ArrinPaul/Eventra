'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  MapPin, 
  QrCode, 
  Navigation,
  Clock,
  Star,
  X,
  Download,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import type { Event } from '@/types';
import { format, isPast, isFuture, isToday, differenceInHours, differenceInMinutes } from 'date-fns';

interface MyEventCardProps {
  event: Event;
  variant?: 'upcoming' | 'past' | 'wishlist';
  onRemoveWishlist?: (eventId: string) => void;
  onRate?: (eventId: string, rating: number) => void;
}

export function MyEventCard({ 
  event, 
  variant = 'upcoming',
  onRemoveWishlist,
  onRate
}: MyEventCardProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const displayDate = event.startDate 
    ? (typeof event.startDate === 'object' && 'toDate' in event.startDate ? (event.startDate as { toDate: () => Date }).toDate() : new Date(event.startDate))
    : (event.date ? new Date(event.date) : new Date());

  const eventImage = event.imageUrl || event.image || `https://picsum.photos/seed/${event.id}/800/600`;

  // Get live status
  const getLiveStatus = () => {
    const now = new Date();
    const eventDate = displayDate;
    const endDate = event.endDate 
      ? (typeof event.endDate === 'object' && 'toDate' in event.endDate ? (event.endDate as { toDate: () => Date }).toDate() : new Date(event.endDate))
      : new Date(eventDate.getTime() + 3 * 60 * 60 * 1000); // Default 3 hours

    // Event is live now
    if (now >= eventDate && now <= endDate) {
      return {
        label: 'Live Now',
        variant: 'default' as const,
        className: 'bg-red-500 text-white animate-pulse',
        icon: 'ðŸ”´'
      };
    }

    // Event ended
    if (isPast(endDate)) {
      return {
        label: 'Ended',
        variant: 'secondary' as const,
        className: 'bg-muted',
        icon: null
      };
    }

    // Event starts soon
    const hoursUntil = differenceInHours(eventDate, now);
    const minutesUntil = differenceInMinutes(eventDate, now);

    if (minutesUntil < 60) {
      return {
        label: `Starts in ${minutesUntil}m`,
        variant: 'default' as const,
        className: 'bg-orange-500 text-white',
        icon: 'â°'
      };
    } else if (hoursUntil < 24) {
      return {
        label: `Starts in ${hoursUntil}h`,
        variant: 'default' as const,
        className: 'bg-[hsl(var(--primary))]',
        icon: 'â°'
      };
    } else if (hoursUntil < 72) {
      const days = Math.floor(hoursUntil / 24);
      return {
        label: `In ${days} day${days > 1 ? 's' : ''}`,
        variant: 'outline' as const,
        className: '',
        icon: null
      };
    }

    return null;
  };

  const liveStatus = variant === 'upcoming' ? getLiveStatus() : null;

  const handleRating = (stars: number) => {
    setRating(stars);
    onRate?.(event.id, stars);
  };

  const getGoogleMapsUrl = () => {
    if (event.location?.venue?.name) {
      const address = event.location.venue.address || event.location.venue.name;
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    }
    return null;
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative">
        {/* Event Image */}
        <div className="aspect-video relative overflow-hidden bg-muted">
          <img 
            src={eventImage}
            alt={event.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
          {/* Live Status Badge */}
          {liveStatus && (
            <div className="absolute top-3 left-3">
              <Badge className={cn('font-semibold', liveStatus.className)}>
                {liveStatus.icon && <span className="mr-1">{liveStatus.icon}</span>}
                {liveStatus.label}
              </Badge>
            </div>
          )}
          {/* Wishlist Remove Button */}
          {variant === 'wishlist' && (
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-3 right-3 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.preventDefault();
                onRemoveWishlist?.(event.id);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {/* Category Badge */}
          {event.category && (
            <div className="absolute bottom-3 left-3">
              <Badge variant="secondary" className="backdrop-blur-sm bg-background/80">
                {event.category}
              </Badge>
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Event Title */}
        <Link href={`/events/${event.id}`} className="block group-hover:text-primary transition-colors">
          <h3 className="font-semibold text-lg line-clamp-2 mb-1">
            {event.title}
          </h3>
        </Link>

        {/* Date & Time */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span>{format(displayDate, 'EEE, MMM d, yyyy Â· h:mm a')}</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-1">
            {event.location?.venue?.name || 
             (event.location?.isVirtual ? 'Virtual Event' : 'Location TBD')}
          </span>
        </div>

        {/* Rating (Past Events Only) */}
        {variant === 'past' && (
          <div className="flex items-center gap-2 pt-2">
            <span className="text-sm text-muted-foreground">Rate:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star 
                    className={cn(
                      "h-5 w-5",
                      (hoverRating >= star || rating >= star)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          {variant === 'upcoming' && (
            <>
              <Button asChild size="sm" className="flex-1">
                <Link href={`/tickets?event=${event.id}`}>
                  <QrCode className="h-4 w-4 mr-1" />
                  View Ticket
                </Link>
              </Button>
              {getGoogleMapsUrl() && (
                <Button 
                  asChild
                  size="sm" 
                  variant="outline"
                >
                  <a 
                    href={getGoogleMapsUrl()!} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Navigation className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </>
          )}

          {variant === 'past' && (
            <>
              <Button asChild size="sm" variant="outline" className="flex-1">
                <Link href={`/certificates/${event.id}`}>
                  <Download className="h-4 w-4 mr-1" />
                  Certificate
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="flex-1">
                <Link href={`/events/${event.id}#photos`}>
                  View Photos
                </Link>
              </Button>
            </>
          )}

          {variant === 'wishlist' && (
            <>
              <Button asChild size="sm" className="flex-1">
                <Link href={`/events/${event.id}`}>
                  Register Now
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/events/${event.id}`}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
