'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  Ticket, 
  DollarSign, 
  CreditCard, 
  QrCode,
  CheckCircle2,
  AlertCircle,
  Info,
  Star,
  Heart,
  Share2,
  Download,
  Plus,
  Minus,
  ShoppingCart,
  Gift
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { EventTicketing, TicketType, EventTicket, BookingRequest, DiscountCode } from '@/types';
import { cn } from '@/core/utils/utils';
import { useToast } from '@/hooks/use-toast';

interface TicketSelection {
  ticketTypeId: string;
  quantity: number;
}

export function TicketingClient() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventTicketing[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventTicketing | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<TicketSelection[]>([]);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [myTickets, setMyTickets] = useState<EventTicket[]>([]);
  const [activeTab, setActiveTab] = useState('explore');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (user) {
      loadMyTickets();
    }
  }, [user]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const { ticketingServiceReal } = await import('@/features/ticketing/services/ticketing-service');
      const ticketableEvents = await ticketingServiceReal.getTicketableEvents();
      // Cast local event type to EventTicketing - structures are compatible
      setEvents(ticketableEvents as unknown as EventTicketing[]);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMyTickets = async () => {
    if (!user) return;
    try {
      const { ticketingServiceReal } = await import('@/features/ticketing/services/ticketing-service');
      const tickets = await ticketingServiceReal.getUserTickets(user.id);
      // Cast local ticket type to EventTicket - structures are compatible
      setMyTickets(tickets as unknown as EventTicket[]);
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  };

  const handleTicketQuantityChange = (ticketTypeId: string, quantity: number) => {
    setSelectedTickets(prev => {
      const existing = prev.find(t => t.ticketTypeId === ticketTypeId);
      if (quantity === 0) {
        return prev.filter(t => t.ticketTypeId !== ticketTypeId);
      }
      if (existing) {
        return prev.map(t => 
          t.ticketTypeId === ticketTypeId 
            ? { ...t, quantity }
            : t
        );
      }
      return [...prev, { ticketTypeId, quantity }];
    });
  };

  const getTotalAmount = () => {
    if (!selectedEvent) return 0;
    
    let total = selectedTickets.reduce((sum, selection) => {
      const ticketType = selectedEvent.ticketTypes.find(t => t.id === selection.ticketTypeId);
      return sum + (ticketType ? ticketType.price * selection.quantity : 0);
    }, 0);

    if (appliedDiscount) {
      if (appliedDiscount.type === 'percentage') {
        total = total * (1 - appliedDiscount.value / 100);
      } else {
        total = Math.max(0, total - appliedDiscount.value);
      }
    }

    return total;
  };

  const getTotalTickets = () => {
    return selectedTickets.reduce((sum, selection) => sum + selection.quantity, 0);
  };

  const applyDiscountCode = () => {
    if (!selectedEvent || !discountCode) return;
    
    const discount = selectedEvent.discountCodes.find(
      (d: DiscountCode) => d.code.toLowerCase() === discountCode.toLowerCase() && d.isActive
    );
    
    if (discount && discount.currentUses < discount.maxUses) {
      setAppliedDiscount(discount);
    } else {
      alert('Invalid or expired discount code');
    }
  };

  const handleBookTickets = async () => {
    if (!selectedEvent || !user || selectedTickets.length === 0) return;
    
    setIsBooking(true);
    try {
      const bookingRequest: BookingRequest = {
        id: crypto.randomUUID(),
        eventId: selectedEvent.id,
        userId: user.id,
        tickets: selectedTickets,
        discountCode: appliedDiscount?.code,
        totalAmount: getTotalAmount(),
        paymentMethod: 'card'
      };

      // await ticketingService.bookTickets(bookingRequest);
      
      // Mock success
      setTimeout(() => {
        setBookingSuccess(true);
        setSelectedTickets([]);
        setAppliedDiscount(null);
        setDiscountCode('');
        setShowBookingDialog(false);
        loadMyTickets();
        setIsBooking(false);
      }, 2000);
      
    } catch (error) {
      console.error('Booking error:', error);
      setIsBooking(false);
    }
  };

  const EventCard = ({ event }: { event: EventTicketing }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <div className="relative">
        {event.coverImage && (
          <img 
            src={event.coverImage} 
            alt={event.title}
            className="w-full h-48 object-cover rounded-t-lg"
          />
        )}
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="bg-white/90">
            {event.type}
          </Badge>
        </div>
      </div>
      
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{event.title}</CardTitle>
          <Button variant="ghost" size="sm">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-sm line-clamp-2">
          {event.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarIcon className="h-4 w-4 mr-2" />
          {format(event.startDate, 'MMM dd, yyyy')}
          <Clock className="h-4 w-4 ml-4 mr-2" />
          {format(event.startDate, 'HH:mm')}
        </div>
        
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-2" />
          {event.venue.address}
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <div className="text-2xl font-bold text-primary">
              Ã¢â€šÂ¹{Math.min(...event.ticketTypes.map(t => t.price)).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">onwards</div>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium">
              {event.ticketing.availableTickets} tickets left
            </div>
            <Progress 
              value={(event.ticketing.soldTickets / (event.ticketing.soldTickets + event.ticketing.availableTickets)) * 100} 
              className="w-20 h-2 mt-1"
            />
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {event.tags.slice(0, 3).map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        <Button 
          className="w-full" 
          onClick={() => {
            setSelectedEvent(event);
            setSelectedTickets([]);
            setAppliedDiscount(null);
            setDiscountCode('');
          }}
        >
          View Details & Book
        </Button>
      </CardContent>
    </Card>
  );

  const TicketTypeCard = ({ ticketType, event }: { ticketType: TicketType; event: EventTicketing }) => {
    const selection = selectedTickets.find(t => t.ticketTypeId === ticketType.id);
    const quantity = selection?.quantity || 0;
    const isAvailable = ticketType.sold < ticketType.totalAvailable;
    const availableQuantity = ticketType.totalAvailable - ticketType.sold;
    
    return (
      <Card className={cn(
        "relative",
        quantity > 0 && "ring-2 ring-primary",
        !isAvailable && "opacity-50"
      )}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg" style={{ color: ticketType.color }}>
                {ticketType.name}
              </CardTitle>
              <CardDescription className="mt-1">
                {ticketType.description}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">Ã¢â€šÂ¹{ticketType.price.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">
                {availableQuantity} left
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Includes:</h4>
            <ul className="space-y-1">
              {ticketType.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 mr-2 text-green-500" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Max {ticketType.maxPerPerson} per person
            </div>
            
            {isAvailable ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={quantity === 0}
                  onClick={() => handleTicketQuantityChange(ticketType.id, Math.max(0, quantity - 1))}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={quantity >= Math.min(ticketType.maxPerPerson, availableQuantity)}
                  onClick={() => handleTicketQuantityChange(ticketType.id, quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Badge variant="secondary">Sold Out</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const MyTicketCard = ({ ticket, event }: { ticket: EventTicket; event?: EventTicketing }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const isPremium = ticket.ticketType.name.toLowerCase().includes('vip') || ticket.ticketType.name.toLowerCase().includes('premium');

    return (
      <div 
        className="relative h-[220px] w-full perspective-1000 cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          className="w-full h-full relative preserve-3d transition-all duration-500"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          {/* Front of Card */}
          <div className={cn(
            "absolute inset-0 backface-hidden rounded-xl border shadow-lg overflow-hidden flex flex-col bg-card",
            isPremium && "border-amber-400/50"
          )}>
            {/* Holographic overlay for premium */}
            {isPremium && (
              <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(110deg,#fff_0%,#fff_10%,#3b82f6_20%,#3b82f6_30%,#fff_40%,#fff_50%,#8b5cf6_60%,#8b5cf6_70%,#fff_80%,#fff_90%,#fff_100%)] bg-[length:200%_100%] animate-[shimmer_3s_infinite_linear]" />
            )}
            
            <div className={cn(
              "h-2 w-full",
              isPremium ? "bg-gradient-to-r from-amber-400 to-amber-600" : "bg-primary"
            )} />
            
            <div className="p-4 flex-1 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg leading-tight line-clamp-1">{event?.title || 'Event Ticket'}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] h-5">
                      {ticket.ticketType.name}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {format(ticket.purchaseDate, 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
                <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                  <Ticket className={cn("h-5 w-5", isPremium ? "text-amber-500" : "text-primary")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dashed">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</p>
                  <p className={cn(
                    "text-xs font-bold capitalize",
                    ticket.ticketStatus === 'confirmed' ? "text-green-600" : "text-muted-foreground"
                  )}>{ticket.ticketStatus}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ticket ID</p>
                  <p className="text-xs font-mono truncate">{ticket.id.substring(0, 8)}...</p>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-3 flex justify-between items-center text-[10px]">
              <span className="flex items-center gap-1">
                <Info className="h-3 w-3" /> Tap to reveal QR
              </span>
              <span className="font-bold">Eventra Pass</span>
            </div>
          </div>

          {/* Back of Card (QR Code) */}
          <div className={cn(
            "absolute inset-0 backface-hidden rounded-xl border shadow-lg flex flex-col items-center justify-center bg-white dark:bg-slate-900 rotate-y-180",
            isPremium && "border-amber-400"
          )}>
            <div className="p-4 bg-white rounded-lg shadow-inner mb-3">
              <QrCode className="h-24 w-24 text-black" />
            </div>
            <p className="font-mono text-[10px] text-muted-foreground mb-4">{ticket.id}</p>
            <div className="flex gap-2 w-full px-4">
              <Button size="sm" variant="outline" className="flex-1 h-8 text-[10px]">
                <Download className="h-3 w-3 mr-1" /> Save
              </Button>
              <Button size="sm" variant="outline" className="flex-1 h-8 text-[10px]">
                <Share2 className="h-3 w-3 mr-1" /> Share
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  const TicketSkeleton = () => (
    <Card className="animate-pulse overflow-hidden">
      <div className="h-48 bg-muted" />
      <CardHeader>
        <div className="h-6 bg-muted rounded w-3/4 mb-2" />
        <div className="h-4 bg-muted rounded w-full" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-8 bg-muted rounded w-20" />
          <div className="h-8 bg-muted rounded w-32" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Event Tickets</h1>
          <p className="text-muted-foreground">Discover and book tickets for amazing events</p>
        </div>
        <Button variant="outline">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="explore">Explore Events</TabsTrigger>
          <TabsTrigger value="my-tickets">My Tickets ({myTickets.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="explore" className="space-y-6">
          {!selectedEvent ? (
            <>
              <div className="flex gap-4 items-center">
                <Input placeholder="Search events..." className="max-w-sm" />
                <Select>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <TicketSkeleton key={i} />)
                ) : (
                  events.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => setSelectedEvent(null)}>
                  Ã¢â€ Â Back to Events
                </Button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <div className="relative">
                      {selectedEvent.coverImage && (
                        <img 
                          src={selectedEvent.coverImage} 
                          alt={selectedEvent.title}
                          className="w-full h-64 object-cover rounded-t-lg"
                        />
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="text-2xl">{selectedEvent.title}</CardTitle>
                      <CardDescription className="text-base">
                        {selectedEvent.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center text-sm">
                            <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                            {format(selectedEvent.startDate, 'EEEE, MMMM dd, yyyy')}
                          </div>
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                            {format(selectedEvent.startDate, 'HH:mm')} - {format(selectedEvent.endDate, 'HH:mm')}
                          </div>
                          <div className="flex items-center text-sm">
                            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                            {selectedEvent.venue.address}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center text-sm">
                            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                            {selectedEvent.currentAttendees} attending
                          </div>
                          <div className="flex items-center text-sm">
                            <Ticket className="h-4 w-4 mr-2 text-muted-foreground" />
                            {selectedEvent.ticketing.availableTickets} tickets available
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Choose Your Tickets</h3>
                    <div className="grid gap-4">
                      {selectedEvent.ticketTypes.map(ticketType => (
                        <TicketTypeCard 
                          key={ticketType.id} 
                          ticketType={ticketType} 
                          event={selectedEvent}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Card className="sticky top-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedTickets.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Ticket className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No tickets selected</p>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            {selectedTickets.map(selection => {
                              const ticketType = selectedEvent.ticketTypes.find(t => t.id === selection.ticketTypeId)!;
                              return (
                                <div key={selection.ticketTypeId} className="flex justify-between text-sm">
                                  <span>{ticketType.name} Ãƒâ€” {selection.quantity}</span>
                                  <span>Ã¢â€šÂ¹{(ticketType.price * selection.quantity).toLocaleString()}</span>
                                </div>
                              );
                            })}
                          </div>
                          
                          <Separator />
                          
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Discount code"
                                value={discountCode}
                                onChange={(e) => setDiscountCode(e.target.value)}
                              />
                              <Button variant="outline" size="sm" onClick={applyDiscountCode}>
                                Apply
                              </Button>
                            </div>
                            
                            {appliedDiscount && (
                              <Alert className="bg-green-50 border-green-200">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">
                                  Discount &quot;{appliedDiscount.code}&quot; applied!
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                          
                          <Separator />
                          
                          <div className="space-y-2">
                            <div className="flex justify-between font-medium">
                              <span>Total ({getTotalTickets()} tickets)</span>
                              <span>Ã¢â€šÂ¹{getTotalAmount().toLocaleString()}</span>
                            </div>
                            {appliedDiscount && (
                              <div className="text-sm text-green-600">
                                You saved Ã¢â€šÂ¹{(selectedTickets.reduce((sum, selection) => {
                                  const ticketType = selectedEvent.ticketTypes.find(t => t.id === selection.ticketTypeId)!;
                                  return sum + (ticketType.price * selection.quantity);
                                }, 0) - getTotalAmount()).toLocaleString()}!
                              </div>
                            )}
                          </div>
                          
                          <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
                            <DialogTrigger asChild>
                              <Button className="w-full" size="lg">
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Book Now - Ã¢â€šÂ¹{getTotalAmount().toLocaleString()}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Confirm Booking</DialogTitle>
                                <DialogDescription>
                                  You&apos;re about to book {getTotalTickets()} tickets for {selectedEvent.title}
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div className="bg-muted p-4 rounded-lg space-y-2">
                                  {selectedTickets.map(selection => {
                                    const ticketType = selectedEvent.ticketTypes.find(t => t.id === selection.ticketTypeId)!;
                                    return (
                                      <div key={selection.ticketTypeId} className="flex justify-between text-sm">
                                        <span>{ticketType.name} Ãƒâ€” {selection.quantity}</span>
                                        <span>Ã¢â€šÂ¹{(ticketType.price * selection.quantity).toLocaleString()}</span>
                                      </div>
                                    );
                                  })}
                                  <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                                    <span>Total</span>
                                    <span>Ã¢â€šÂ¹{getTotalAmount().toLocaleString()}</span>
                                  </div>
                                </div>
                                
                                <Alert>
                                  <Info className="h-4 w-4" />
                                  <AlertDescription className="text-sm">
                                    You&apos;ll receive booking confirmation and tickets via email.
                                  </AlertDescription>
                                </Alert>
                              </div>
                              
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleBookTickets} disabled={isBooking}>
                                  {isBooking ? (
                                    <>Processing...</>
                                  ) : (
                                    <>
                                      <CreditCard className="h-4 w-4 mr-2" />
                                      Pay & Confirm
                                    </>
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="my-tickets" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => <TicketSkeleton key={i} />)}
            </div>
          ) : myTickets.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No tickets yet</h3>
                <p className="text-muted-foreground mb-4">
                  Book your first event ticket to get started
                </p>
                <Button onClick={() => setActiveTab('explore')}>
                  Explore Events
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTickets.map(ticket => {
                const event = events.find(e => e.id === ticket.eventId);
                return (
                  <MyTicketCard 
                    key={ticket.id} 
                    ticket={ticket} 
                    event={event}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {bookingSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="fixed bottom-6 right-6 z-50 max-w-md"
        >
          <Alert className="border-green-200 bg-green-50 shadow-2xl">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div className="ml-2">
              <AlertDescription className="text-green-800 font-bold text-base">
                Booking Confirmed! 🎉
              </AlertDescription>
              <AlertDescription className="text-green-700 text-sm">
                Your digital tickets are now available in your wallet.
              </AlertDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto text-green-800 hover:bg-green-100"
              onClick={() => setBookingSuccess(false)}
            >
              Dismiss
            </Button>
          </Alert>
        </motion.div>
      )}
    </div>
  );
}