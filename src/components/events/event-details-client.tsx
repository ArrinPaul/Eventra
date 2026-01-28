'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Heart,
  Share2,
  Ticket,
  CheckCircle,
  ExternalLink,
  Copy,
  Twitter,
  Linkedin,
  Mail,
  Globe,
  Video,
  MessageSquare,
  Star,
  Loader2,
  Sparkles,
  CalendarPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { eventService } from '@/lib/firestore-services';
import type { Event, AgendaItem, SpeakerInfo } from '@/types';

interface EventDetailsClientProps {
  eventId: string;
}

export default function EventDetailsClient({ eventId }: EventDetailsClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const fetchedEvent = await eventService.getEventById(eventId);
        setEvent(fetchedEvent);
        // Check if user is registered
        if (user?.uid && fetchedEvent?.attendees?.includes(user.uid)) {
          setIsRegistered(true);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        toast({ 
          title: 'Error', 
          description: 'Failed to load event details.', 
          variant: 'destructive' 
        });
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId, user, toast]);

  const handleRegister = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    setRegistering(true);
    try {
      // Registration logic here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated
      setIsRegistered(true);
      toast({ 
        title: 'Registered! 🎉', 
        description: 'You have successfully registered for this event.' 
      });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to register. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleWishlist = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    setIsWishlisted(!isWishlisted);
    toast({ 
      title: isWishlisted ? 'Removed from wishlist' : 'Added to wishlist',
      description: isWishlisted ? 'Event removed from your saved events.' : 'Event saved to your wishlist.'
    });
  };

  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const text = `Check out ${event?.title} on EventOS!`;

    switch (platform) {
      case 'copy':
        await navigator.clipboard.writeText(url);
        toast({ title: 'Link copied!' });
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(event?.title || '')}&body=${encodeURIComponent(text + '\n\n' + url)}`);
        break;
    }
    setShowShareDialog(false);
  };

  const handleAddToCalendar = () => {
    if (!event) return;
    
    const startDate = event.startDate ? new Date(event.startDate) : new Date(event.date || '');
    const endDate = event.endDate ? new Date(event.endDate) : startDate;
    
    const googleCalUrl = new URL('https://calendar.google.com/calendar/render');
    googleCalUrl.searchParams.set('action', 'TEMPLATE');
    googleCalUrl.searchParams.set('text', event.title);
    googleCalUrl.searchParams.set('details', event.description);
    googleCalUrl.searchParams.set('dates', 
      `${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`
    );
    
    window.open(googleCalUrl.toString());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
        <p className="text-muted-foreground mb-6">The event you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link href="/explore">Browse Events</Link>
        </Button>
      </div>
    );
  }

  const displayDate = event.startDate ? new Date(event.startDate) : new Date(event.date || '');
  const isVirtual = event.location?.isVirtual || event.location?.type === 'virtual';
  const locationString = event.location?.venue?.name || (isVirtual ? 'Virtual Event' : 'Location TBD');
  
  const isSoldOut = event.capacity && event.registeredCount && event.registeredCount >= event.capacity;
  const spotsLeft = event.capacity ? event.capacity - (event.registeredCount || 0) : null;
  const isPast = displayDate < new Date();

  // Helper function to get speaker info
  const getSpeakerInfo = (speaker: any): SpeakerInfo => {
    if (typeof speaker === 'string') {
      return { name: speaker };
    }
    return speaker as SpeakerInfo;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Image */}
      <div className="relative h-[40vh] min-h-[300px] bg-gradient-to-br from-primary/20 via-purple-500/10 to-secondary/20">
        {event.imageUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${event.imageUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Back Button */}
        <div className="absolute top-4 left-4">
          <Button variant="secondary" size="sm" asChild className="backdrop-blur-sm">
            <Link href="/explore">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button 
            variant="secondary" 
            size="icon" 
            className="backdrop-blur-sm"
            onClick={handleWishlist}
          >
            <Heart className={cn("h-4 w-4", isWishlisted && "fill-red-500 text-red-500")} />
          </Button>
          <Button 
            variant="secondary" 
            size="icon" 
            className="backdrop-blur-sm"
            onClick={() => setShowShareDialog(true)}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="container -mt-24 relative z-10 pb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Header */}
            <Card>
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge>{event.category}</Badge>
                  {event.pricing?.isFree && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600">Free</Badge>
                  )}
                  {isVirtual && (
                    <Badge variant="outline">
                      <Video className="h-3 w-3 mr-1" />
                      Virtual
                    </Badge>
                  )}
                  {isPast && (
                    <Badge variant="secondary">Past Event</Badge>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold font-headline mb-4">
                  {event.title}
                </h1>

                {/* Quick Info */}
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-semibold">
                        {displayDate.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-semibold">
                        {event.time || displayDate.toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      {isVirtual ? (
                        <Globe className="h-6 w-6 text-primary" />
                      ) : (
                        <MapPin className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-semibold">{locationString}</p>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Tabs */}
                <Tabs defaultValue="about">
                  <TabsList className="mb-6">
                    <TabsTrigger value="about">About</TabsTrigger>
                    <TabsTrigger value="agenda">Agenda</TabsTrigger>
                    <TabsTrigger value="speakers">Speakers</TabsTrigger>
                    <TabsTrigger value="location">Location</TabsTrigger>
                  </TabsList>

                  <TabsContent value="about" className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-3">About This Event</h3>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {event.description}
                      </p>
                    </div>

                    {event.tags && event.tags.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {event.tags.map((tag, index) => (
                            <Badge key={index} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="agenda" className="space-y-4">
                    {event.agenda && event.agenda.length > 0 ? (
                      event.agenda.map((item, index) => (
                        <div 
                          key={index} 
                          className="flex gap-4 p-4 rounded-lg bg-muted/50"
                        >
                          <div className="text-sm font-medium text-primary w-20 flex-shrink-0">
                            {typeof item.startTime === 'string' ? item.startTime : new Date(item.startTime).toLocaleTimeString()}
                          </div>
                          <div>
                            <h4 className="font-semibold">{item.title}</h4>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            )}
                            {item.speaker && (
                              <p className="text-sm text-primary mt-1">Speaker: {item.speaker}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Agenda will be announced soon.</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="speakers" className="space-y-4">
                    {event.speakers && event.speakers.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {event.speakers.map((speaker, index) => {
                          const speakerInfo = getSpeakerInfo(speaker);
                          return (
                            <Card key={index}>
                              <CardContent className="p-4 flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                  <AvatarImage src={speakerInfo.photoUrl} />
                                  <AvatarFallback className="text-lg">
                                    {speakerInfo.name.split(' ').map((n: string) => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-semibold">{speakerInfo.name}</h4>
                                  {speakerInfo.title && (
                                    <p className="text-sm text-muted-foreground">{speakerInfo.title}</p>
                                  )}
                                  {speakerInfo.company && (
                                    <p className="text-sm text-primary">{speakerInfo.company}</p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Speaker information coming soon.</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="location">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          {isVirtual ? (
                            <Globe className="h-6 w-6 text-primary" />
                          ) : (
                            <MapPin className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{locationString}</h3>
                          {typeof event.location !== 'string' && event.location?.venue?.address && (
                            <p className="text-sm text-muted-foreground">
                              {event.location.venue.address}
                            </p>
                          )}
                        </div>
                      </div>

                      {isVirtual && (event.location?.virtualLink || event.location?.virtual?.url) && isRegistered && (
                        <Button asChild>
                          <a href={event.location.virtualLink || event.location.virtual?.url} target="_blank" rel="noopener noreferrer">
                            <Video className="h-4 w-4 mr-2" />
                            Join Virtual Event
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </a>
                        </Button>
                      )}

                      {!isVirtual && (
                        <div className="h-64 rounded-lg bg-muted flex items-center justify-center">
                          <p className="text-muted-foreground">Map coming soon</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <Card className="sticky top-20">
              <CardContent className="p-6">
                {/* Price */}
                <div className="text-center mb-6">
                  {event.pricing?.isFree ? (
                    <p className="text-3xl font-bold text-green-600">Free</p>
                  ) : (
                    <p className="text-3xl font-bold">
                      ${event.pricing?.basePrice || 0}
                      <span className="text-sm font-normal text-muted-foreground"> /person</span>
                    </p>
                  )}
                </div>

                {/* Attendee Count */}
                <div className="flex items-center justify-center gap-2 mb-6 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{event.registeredCount || 0} registered</span>
                  {spotsLeft !== null && spotsLeft > 0 && (
                    <>
                      <span>·</span>
                      <span className={cn(spotsLeft < 10 && "text-orange-500 font-medium")}>
                        {spotsLeft} spots left
                      </span>
                    </>
                  )}
                </div>

                {/* Registration Button */}
                {isPast ? (
                  <Button disabled className="w-full" size="lg">
                    Event Ended
                  </Button>
                ) : isRegistered ? (
                  <div className="space-y-3">
                    <Button disabled className="w-full" size="lg">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      You're Registered!
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={handleAddToCalendar}
                    >
                      <CalendarPlus className="h-4 w-4 mr-2" />
                      Add to Calendar
                    </Button>
                  </div>
                ) : isSoldOut ? (
                  <Button disabled className="w-full" size="lg">
                    Sold Out
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleRegister}
                    disabled={registering}
                  >
                    {registering ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <Ticket className="h-4 w-4 mr-2" />
                        Register Now
                      </>
                    )}
                  </Button>
                )}

                <Separator className="my-6" />

                {/* Quick Actions */}
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleWishlist}
                  >
                    <Heart className={cn("h-4 w-4 mr-2", isWishlisted && "fill-red-500 text-red-500")} />
                    {isWishlisted ? 'Saved' : 'Save Event'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setShowShareDialog(true)}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Event
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Organizer Info */}
            {(event.organizer || event.organizers?.length) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Organized by</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={event.organizer?.photoUrl} />
                      <AvatarFallback>
                        {event.organizer?.name?.split(' ').map((n: string) => n[0]).join('') || 'O'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{event.organizer?.name || 'Event Organizer'}</p>
                      <p className="text-sm text-muted-foreground">Event Organizer</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <AlertDialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Share Event</AlertDialogTitle>
            <AlertDialogDescription>
              Share this event with your friends and colleagues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-4 gap-4 py-4">
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => handleShare('copy')}
            >
              <Copy className="h-5 w-5" />
              <span className="text-xs">Copy Link</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => handleShare('twitter')}
            >
              <Twitter className="h-5 w-5" />
              <span className="text-xs">Twitter</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => handleShare('linkedin')}
            >
              <Linkedin className="h-5 w-5" />
              <span className="text-xs">LinkedIn</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => handleShare('email')}
            >
              <Mail className="h-5 w-5" />
              <span className="text-xs">Email</span>
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Login Prompt */}
      <AlertDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign in Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to be signed in to register for events or save them to your wishlist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Link href={`/login?callbackUrl=/events/${eventId}`}>
                Sign In
              </Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
