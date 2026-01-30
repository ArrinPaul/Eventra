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
import { ToastAction } from '@/components/ui/toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
  CalendarPlus,
  HelpCircle,
  ChevronDown,
  Bot
} from 'lucide-react';
import { cn, getErrorMessage } from '@/core/utils/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { eventService, ticketService, userProfileService } from '@/core/services/firestore-services';
import type { Event, AgendaItem, SpeakerInfo, UserProfile } from '@/types';

// Import AI Chatbot
import { EventChatbot } from '@/components/ai/event-chatbot';

// Import user action processing for gamification
import { processUserAction } from '@/app/actions/user-actions';

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
  const [attendeeProfiles, setAttendeeProfiles] = useState<UserProfile[]>([]);

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
        
        // Fetch attendee profiles for social proof
        if (fetchedEvent?.attendees && fetchedEvent.attendees.length > 0) {
          const attendeeIds = fetchedEvent.attendees.slice(0, 10); // Fetch up to 10 for display
          const profiles = await Promise.all(
            attendeeIds.map(id => userProfileService.getUserProfile(id))
          );
          setAttendeeProfiles(profiles.filter((p): p is UserProfile => p !== null));
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
    if (!user?.uid) {
      setShowLoginPrompt(true);
      return;
    }

    if (!event) return;

    setRegistering(true);
    try {
      // Register using the ticket service
      await ticketService.registerForEvent(
        eventId,
        user.uid,
        { 
          name: user.name || user.email || 'Guest',
          email: user.email || ''
        }
      );
      
      setIsRegistered(true);

      // Process user action for gamification (badges, XP, challenges)
      try {
        const gamificationResult = await processUserAction(user.uid, 'event_registration', {
          eventId: eventId,
          eventCategory: event.category,
        });
        
        // Show badge notifications if any were earned
        if (gamificationResult.badgesEarned.length > 0) {
          const badges = gamificationResult.badgesEarned;
          toast({
            title: `Badge Earned! ${badges[0].icon}`,
            description: `You earned "${badges[0].name}" and +${gamificationResult.xpAwarded} XP!`,
          });
        }
      } catch (gamificationError) {
        console.error('Gamification processing error:', gamificationError);
        // Don't fail registration if gamification fails
      }
      
      toast({ 
        title: 'Registered! ðŸŽ‰', 
        description: 'Check your tickets page to view your QR code.',
        action: (
          <ToastAction altText="View Ticket" onClick={() => router.push('/tickets')}>
            View Ticket
          </ToastAction>
        )
      });
    } catch (error: unknown) {
      toast({ 
        title: 'Registration Failed', 
        description: getErrorMessage(error), 
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
                    <TabsTrigger value="faq">FAQ</TabsTrigger>
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
                        <div className="space-y-4">
                          <div className="h-48 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center relative overflow-hidden">
                            {/* Mini Map Preview */}
                            <svg viewBox="0 0 400 200" className="w-full h-full opacity-50">
                              <rect width="400" height="200" fill="currentColor" className="text-slate-200 dark:text-slate-700" />
                              <rect x="50" y="30" width="80" height="50" rx="4" fill="#f59e0b" opacity="0.6" />
                              <rect x="160" y="50" width="100" height="60" rx="4" fill="#22c55e" opacity="0.6" />
                              <rect x="290" y="40" width="70" height="45" rx="4" fill="#8b5cf6" opacity="0.6" />
                              <rect x="80" y="120" width="90" height="50" rx="4" fill="#06b6d4" opacity="0.6" />
                              <rect x="200" y="130" width="120" height="40" rx="4" fill="#ec4899" opacity="0.6" />
                              {/* Animated pin */}
                              <circle cx="210" cy="80" r="8" fill="#ef4444" className="animate-pulse" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                              <Link href="/map">
                                <Button size="lg" className="gap-2 shadow-lg">
                                  <MapPin className="h-5 w-5" />
                                  View on Campus Map
                                </Button>
                              </Link>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground text-center">
                            Click to view the interactive campus map with directions
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="faq" className="space-y-4">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="registration">
                        <AccordionTrigger>How do I register for this event?</AccordionTrigger>
                        <AccordionContent>
                          Click the "Register Now" button on this page. If the event is free, you'll be registered immediately. 
                          For paid events, you'll be redirected to complete payment. You'll receive a confirmation email with 
                          your ticket and QR code.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="cancel">
                        <AccordionTrigger>Can I cancel my registration?</AccordionTrigger>
                        <AccordionContent>
                          Yes, you can cancel your registration up to 24 hours before the event starts. 
                          Go to "My Events" in your profile, find this event, and click "Cancel Registration". 
                          Refunds for paid events are processed within 5-7 business days.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="checkin">
                        <AccordionTrigger>How do I check in at the event?</AccordionTrigger>
                        <AccordionContent>
                          When you arrive, show your QR code ticket (found in "My Tickets" or your confirmation email) 
                          to the event staff. They'll scan it to confirm your registration. Make sure you have your 
                          phone charged or bring a printed copy.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="certificate">
                        <AccordionTrigger>Will I receive a certificate?</AccordionTrigger>
                        <AccordionContent>
                          Yes! After the event ends and you've checked in, you'll be eligible to receive a certificate 
                          of participation. You can download it from the "Past Events" section in "My Events".
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="contact">
                        <AccordionTrigger>How can I contact the organizers?</AccordionTrigger>
                        <AccordionContent>
                          You can reach out to the event organizers through the chat feature on this page 
                          (if enabled) or by emailing them directly. Their contact information may be available 
                          in the event description.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Social Proof - Attendees Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Who's Attending
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Attendee Avatars */}
                <div className="flex -space-x-2 mb-3">
                  {attendeeProfiles.length > 0 ? (
                    <>
                      {attendeeProfiles.slice(0, 6).map((profile, i) => (
                        <Avatar key={profile.id} className="h-10 w-10 border-2 border-background">
                          <AvatarImage src={profile.photoURL || profile.avatar} />
                          <AvatarFallback>
                            {(profile.displayName || profile.name || 'U')
                              .split(' ')
                              .map((n: string) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {(event.registeredCount || 0) > 6 && (
                        <div className="h-10 w-10 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">+{(event.registeredCount || 0) - 6}</span>
                        </div>
                      )}
                    </>
                  ) : (event.registeredCount || 0) > 0 ? (
                    // Fallback: Show placeholder avatars when we have registrations but no profiles loaded
                    <>
                      {Array.from({ length: Math.min(6, event.registeredCount || 0) }).map((_, i) => (
                        <Avatar key={i} className="h-10 w-10 border-2 border-background">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <Users className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {(event.registeredCount || 0) > 6 && (
                        <div className="h-10 w-10 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">+{(event.registeredCount || 0) - 6}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Be the first to register!</p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {event.registeredCount || 0} people are going
                </p>

                {/* Attendee Names (if we have profiles) */}
                {attendeeProfiles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">
                      Including{' '}
                      <span className="font-medium text-foreground">
                        {attendeeProfiles.slice(0, 2).map(p => p.displayName || p.name || 'Someone').join(', ')}
                      </span>
                      {attendeeProfiles.length > 2 && (
                        <span> and {attendeeProfiles.length - 2} others</span>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

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
                      <span>Â·</span>
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

            {/* AI Event Assistant */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  Event Assistant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EventChatbot 
                  event={{
                    id: eventId,
                    title: event.title,
                    description: event.description || '',
                    date: event.date,
                    location: typeof event.location === 'string' ? event.location : event.location?.venue?.name || 'TBD',
                    agenda: event.agenda?.map((item: any) => ({
                      time: item.time || '',
                      title: item.title || item.topic || '',
                      description: item.description || '',
                      speaker: item.speaker || ''
                    })),
                    speakers: event.speakers?.map((s: any) => s.name || s),
                  }}
                />
              </CardContent>
            </Card>
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
