'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  Ticket, 
  DollarSign, 
  TrendingUp, 
  Eye, 
  Download,
  Plus,
  Edit,
  Trash2,
  Settings,
  Mail,
  QrCode,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  PieChart,
  Filter,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { EventTicketing, TicketType, EventTicket, WaitlistEntry } from '@/types';

export function OrganizerDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventTicketing[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventTicketing | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTicketTypeDialog, setShowTicketTypeDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Event form state
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(),
    location: '',
    category: '',
    capacity: 100,
    isPublic: true,
    tags: ''
  });

  // Ticket type form state
  const [ticketTypeForm, setTicketTypeForm] = useState({
    name: '',
    description: '',
    price: 0,
    totalAvailable: 50,
    maxPerPerson: 4,
    saleStartDate: new Date(),
    saleEndDate: new Date(),
    benefits: '',
    color: '#3B82F6'
  });

  const [attendeesSearch, setAttendeesSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadEvents();
  }, [user]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Mock data for organizer events
      const mockEvents: EventTicketing[] = [
        {
          id: 'event1',
          title: 'Tech Summit 2024',
          description: 'Annual technology conference featuring industry leaders and innovations',
          startDate: new Date('2024-03-15T09:00:00'),
          endDate: new Date('2024-03-15T18:00:00'),
          location: 'Convention Center, Tech City',
          type: 'conference',
          organizerId: user?.id || 'org1',
          timezone: 'UTC+5:30',
          venue: {
            name: 'Convention Center',
            address: 'Tech City, India',
            capacity: 500
          },
          ticketTypes: [
            {
              id: '1',
              name: 'Early Bird',
              description: 'Limited time special pricing',
              price: 1999,
              totalAvailable: 50,
              sold: 45,
              maxPerPerson: 2,
              saleStartDate: new Date('2024-02-01'),
              saleEndDate: new Date('2024-02-29'),
              benefits: ['Event access', 'Welcome kit', 'Networking lunch'],
              color: '#10B981'
            },
            {
              id: '2',
              name: 'General Admission',
              description: 'Standard event access',
              price: 2999,
              totalAvailable: 300,
              sold: 120,
              maxPerPerson: 4,
              saleStartDate: new Date('2024-02-15'),
              saleEndDate: new Date('2024-03-14'),
              benefits: ['Event access', 'Welcome kit'],
              color: '#3B82F6'
            }
          ],
          totalCapacity: 350,
          currentAttendees: 165,
          waitlistEntries: [
            {
              id: 'w1',
              userId: 'user1',
              eventId: 'event1',
              position: 1,
              joinedAt: new Date(),
              notified: false
            }
          ],
          ticketingAnalytics: {
            totalRevenue: 420000,
            ticketsSold: 165,
            conversionRate: 0.68,
            refundRequests: 3,
            checkInRate: 0.92,
            popularTicketTypes: [
              { typeId: '2', sold: 120 },
              { typeId: '1', sold: 45 }
            ],
            salesOverTime: [],
            demographics: {
              ageGroups: [
                { range: '18-25', count: 45 },
                { range: '26-35', count: 78 },
                { range: '36-45', count: 32 },
                { range: '46+', count: 10 }
              ],
              roles: [
                { role: 'student', count: 55 },
                { role: 'professional', count: 100 },
                { role: 'organizer', count: 10 }
              ],
              companies: [
                { company: 'TechCorp', count: 15 },
                { company: 'StartupXYZ', count: 12 },
                { company: 'BigTech Inc', count: 8 }
              ]
            }
          },
          discountCodes: [],
          checkInSettings: {
            enableQrCode: true,
            enableManualCheckIn: true,
            checkInWindow: { startMinutes: 60, endMinutes: 180 },
            requireConfirmation: true,
            sendConfirmationEmail: true
          },
          refundPolicy: {
            allowRefunds: true,
            refundDeadline: new Date('2024-03-10'),
            refundPercentage: 85,
            processingFee: 50,
            refundableTicketTypes: ['1', '2']
          },
          eventOrganizer: {
            id: user?.id || 'org1',
            name: user?.name || 'Event Organizer',
            email: user?.email || 'organizer@example.com',
            verificationStatus: 'verified'
          },
          attendees: [],
          tags: ['technology', 'networking', 'innovation'],
          category: 'Technology',
          isPublic: true,
          isPublished: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-02-20')
        }
      ];
      setEvents(mockEvents);
      if (mockEvents.length > 0) {
        setSelectedEvent(mockEvents[0]);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    setLoading(true);
    try {
      // Mock implementation - would create event in Firebase
      const newEvent: EventTicketing = {
        id: `event_${Date.now()}`,
        ...eventForm,
        type: 'conference',
        organizerId: user?.id || 'org1',
        timezone: 'UTC+5:30',
        venue: {
          name: eventForm.location,
          address: eventForm.location,
          capacity: eventForm.capacity
        },
        ticketTypes: [],
        totalCapacity: eventForm.capacity,
        currentAttendees: 0,
        waitlistEntries: [],
        ticketingAnalytics: {
          totalRevenue: 0,
          ticketsSold: 0,
          conversionRate: 0,
          refundRequests: 0,
          checkInRate: 0,
          popularTicketTypes: [],
          salesOverTime: [],
          demographics: {
            ageGroups: [],
            roles: [],
            companies: []
          }
        },
        discountCodes: [],
        checkInSettings: {
          enableQrCode: true,
          enableManualCheckIn: true,
          checkInWindow: { startMinutes: 60, endMinutes: 180 },
          requireConfirmation: true,
          sendConfirmationEmail: true
        },
        refundPolicy: {
          allowRefunds: true,
          refundDeadline: new Date(eventForm.startDate.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days before
          refundPercentage: 85,
          processingFee: 50,
          refundableTicketTypes: []
        },
        eventOrganizer: {
          id: user?.id || 'org1',
          name: user?.name || 'Event Organizer',
          email: user?.email || 'organizer@example.com',
          verificationStatus: 'verified'
        },
        attendees: [],
        tags: eventForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setEvents(prev => [...prev, newEvent]);
      setShowCreateDialog(false);
      setEventForm({
        title: '',
        description: '',
        startDate: new Date(),
        endDate: new Date(),
        location: '',
        category: '',
        capacity: 100,
        isPublic: true,
        tags: ''
      });
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTicketType = () => {
    if (!selectedEvent) return;

    const newTicketType: TicketType = {
      id: `ticket_${Date.now()}`,
      name: ticketTypeForm.name,
      description: ticketTypeForm.description,
      price: ticketTypeForm.price,
      totalAvailable: ticketTypeForm.totalAvailable,
      sold: 0,
      maxPerPerson: ticketTypeForm.maxPerPerson,
      saleStartDate: ticketTypeForm.saleStartDate,
      saleEndDate: ticketTypeForm.saleEndDate,
      benefits: ticketTypeForm.benefits.split(',').map(b => b.trim()).filter(Boolean),
      color: ticketTypeForm.color
    };

    const updatedEvent = {
      ...selectedEvent,
      ticketTypes: [...selectedEvent.ticketTypes, newTicketType],
      totalCapacity: selectedEvent.totalCapacity + ticketTypeForm.totalAvailable
    };

    setSelectedEvent(updatedEvent);
    setEvents(prev => prev.map(e => e.id === selectedEvent.id ? updatedEvent : e));
    setShowTicketTypeDialog(false);
    setTicketTypeForm({
      name: '',
      description: '',
      price: 0,
      totalAvailable: 50,
      maxPerPerson: 4,
      saleStartDate: new Date(),
      saleEndDate: new Date(),
      benefits: '',
      color: '#3B82F6'
    });
  };

  const mockAttendees = [
    { id: '1', name: 'Alice Johnson', email: 'alice@example.com', ticketType: 'General Admission', status: 'confirmed', checkedIn: true },
    { id: '2', name: 'Bob Smith', email: 'bob@example.com', ticketType: 'VIP Pass', status: 'confirmed', checkedIn: false },
    { id: '3', name: 'Carol Davis', email: 'carol@example.com', ticketType: 'Early Bird', status: 'pending', checkedIn: false },
    { id: '4', name: 'David Wilson', email: 'david@example.com', ticketType: 'General Admission', status: 'confirmed', checkedIn: true },
  ];

  const filteredAttendees = mockAttendees.filter(attendee => {
    const matchesSearch = attendee.name.toLowerCase().includes(attendeesSearch.toLowerCase()) ||
                         attendee.email.toLowerCase().includes(attendeesSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || attendee.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Organizer Dashboard</h1>
          <p className="text-gray-600">Manage your events and track performance</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Ticket className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{events.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{events.reduce((sum, event) => sum + event.ticketingAnalytics.totalRevenue, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Attendees</p>
                <p className="text-2xl font-bold text-gray-900">
                  {events.reduce((sum, event) => sum + event.currentAttendees, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Conversion</p>
                <p className="text-2xl font-bold text-gray-900">
                  {events.length > 0 
                    ? ((events.reduce((sum, event) => sum + event.ticketingAnalytics.conversionRate, 0) / events.length) * 100).toFixed(1)
                    : '0'
                  }%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedEvent && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tickets">Ticket Types</TabsTrigger>
            <TabsTrigger value="attendees">Attendees</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedEvent.title}</CardTitle>
                    <CardDescription>{selectedEvent.description}</CardDescription>
                  </div>
                  <Badge variant={selectedEvent.isPublished ? 'default' : 'secondary'}>
                    {selectedEvent.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Date</span>
                    </div>
                    <p className="font-medium">
                      {selectedEvent.startDate.toLocaleDateString()} at {selectedEvent.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>Location</span>
                    </div>
                    <p className="font-medium">{selectedEvent.location}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>Capacity</span>
                    </div>
                    <p className="font-medium">
                      {selectedEvent.currentAttendees} / {selectedEvent.totalCapacity}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Event Capacity</span>
                    <span className="text-sm text-gray-600">
                      {Math.round((selectedEvent.currentAttendees / selectedEvent.totalCapacity) * 100)}% full
                    </span>
                  </div>
                  <Progress 
                    value={(selectedEvent.currentAttendees / selectedEvent.totalCapacity) * 100} 
                    className="h-3"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Revenue</p>
                          <p className="text-2xl font-bold">
                            ₹{selectedEvent.ticketingAnalytics.totalRevenue.toLocaleString()}
                          </p>
                        </div>
                        <div className="p-2 bg-green-100 rounded-lg">
                          <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Tickets Sold</p>
                          <p className="text-2xl font-bold">{selectedEvent.ticketingAnalytics.ticketsSold}</p>
                        </div>
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Ticket className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {selectedEvent.waitlistEntries.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Waitlist</CardTitle>
                      <CardDescription>
                        {selectedEvent.waitlistEntries.length} people waiting for tickets
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" size="sm">
                        <Mail className="w-4 h-4 mr-2" />
                        Notify Waitlist
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Ticket Types</h3>
              <Button onClick={() => setShowTicketTypeDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Ticket Type
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {selectedEvent.ticketTypes.map((ticketType) => (
                <Card key={ticketType.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: ticketType.color }}
                        />
                        <CardTitle className="text-lg">{ticketType.name}</CardTitle>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardDescription>{ticketType.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Price</span>
                      <span className="font-medium">₹{ticketType.price}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Sold</span>
                        <span>{ticketType.sold} / {ticketType.totalAvailable}</span>
                      </div>
                      <Progress 
                        value={(ticketType.sold / ticketType.totalAvailable) * 100} 
                        className="h-2"
                      />
                    </div>

                    <div className="text-sm">
                      <p className="font-medium mb-1">Benefits:</p>
                      <ul className="text-gray-600 space-y-1">
                        {ticketType.benefits.slice(0, 3).map((benefit, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            {benefit}
                          </li>
                        ))}
                        {ticketType.benefits.length > 3 && (
                          <li className="text-xs text-gray-500">
                            +{ticketType.benefits.length - 3} more benefits
                          </li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="attendees" className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search attendees..."
                    value={attendeesSearch}
                    onChange={(e) => setAttendeesSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Ticket Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendees.map((attendee) => (
                    <TableRow key={attendee.id}>
                      <TableCell className="font-medium">{attendee.name}</TableCell>
                      <TableCell>{attendee.email}</TableCell>
                      <TableCell>{attendee.ticketType}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            attendee.status === 'confirmed' ? 'default' :
                            attendee.status === 'pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {attendee.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {attendee.checkedIn ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Checked In
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Not Checked In
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!attendee.checkedIn && (
                            <Button size="sm" variant="outline">
                              <UserCheck className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Mail className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Demographics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Age Groups</h4>
                    {selectedEvent.ticketingAnalytics.demographics.ageGroups.map((group, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{group.range}</span>
                        <span className="font-medium">{group.count}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">Roles</h4>
                    {selectedEvent.ticketingAnalytics.demographics.roles.map((role, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{role.role}</span>
                        <span className="font-medium">{role.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Ticket Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedEvent.ticketingAnalytics.popularTicketTypes.map((typeData) => {
                      const ticketType = selectedEvent.ticketTypes.find(t => t.id === typeData.typeId);
                      if (!ticketType) return null;
                      
                      const percentage = (typeData.sold / ticketType.totalAvailable) * 100;
                      
                      return (
                        <div key={typeData.typeId} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: ticketType.color }}
                              />
                              {ticketType.name}
                            </span>
                            <span className="font-medium">
                              {typeData.sold} / {ticketType.totalAvailable}
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {(selectedEvent.ticketingAnalytics.conversionRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Conversion Rate</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {(selectedEvent.ticketingAnalytics.checkInRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Check-in Rate</div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      ₹{Math.round(selectedEvent.ticketingAnalytics.totalRevenue / selectedEvent.ticketingAnalytics.ticketsSold || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Avg. Ticket Value</div>
                  </div>
                  
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {selectedEvent.ticketingAnalytics.refundRequests}
                    </div>
                    <div className="text-sm text-gray-600">Refund Requests</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Settings</CardTitle>
                <CardDescription>Configure your event preferences and policies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Event Visibility</Label>
                    <p className="text-sm text-gray-600">Make this event discoverable by the public</p>
                  </div>
                  <Switch checked={selectedEvent.isPublic} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Published Status</Label>
                    <p className="text-sm text-gray-600">Publish event to accept registrations</p>
                  </div>
                  <Switch checked={selectedEvent.isPublished} />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Check-in Settings</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">QR Code Check-in</Label>
                      <p className="text-sm text-gray-600">Allow attendees to check in with QR codes</p>
                    </div>
                    <Switch checked={selectedEvent.checkInSettings.enableQrCode} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Manual Check-in</Label>
                      <p className="text-sm text-gray-600">Allow manual check-in by organizers</p>
                    </div>
                    <Switch checked={selectedEvent.checkInSettings.enableManualCheckIn} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Confirmation Email</Label>
                      <p className="text-sm text-gray-600">Send email confirmation after check-in</p>
                    </div>
                    <Switch checked={selectedEvent.checkInSettings.sendConfirmationEmail} />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Refund Policy</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Allow Refunds</Label>
                      <p className="text-sm text-gray-600">Enable ticket refunds for attendees</p>
                    </div>
                    <Switch checked={selectedEvent.refundPolicy.allowRefunds} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="refundPercentage">Refund Percentage</Label>
                      <Input
                        id="refundPercentage"
                        type="number"
                        value={selectedEvent.refundPolicy.refundPercentage}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="processingFee">Processing Fee</Label>
                      <Input
                        id="processingFee"
                        type="number"
                        value={selectedEvent.refundPolicy.processingFee}
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button>Save Changes</Button>
                  <Button variant="outline">Reset</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Create Event Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              Set up a new event and configure its basic details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={eventForm.title}
                onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter event title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={eventForm.description}
                onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your event..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(eventForm.startDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={eventForm.startDate}
                      onSelect={(date) => date && setEventForm(prev => ({ ...prev, startDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(eventForm.endDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={eventForm.endDate}
                      onSelect={(date) => date && setEventForm(prev => ({ ...prev, endDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={eventForm.location}
                onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Event venue or address"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={eventForm.category} onValueChange={(value) => setEventForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Arts">Arts & Culture</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={eventForm.capacity}
                  onChange={(e) => setEventForm(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                  placeholder="Maximum attendees"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={eventForm.tags}
                onChange={(e) => setEventForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="e.g. networking, conference, workshop"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={eventForm.isPublic}
                onCheckedChange={(checked) => setEventForm(prev => ({ ...prev, isPublic: checked }))}
              />
              <Label>Make event public</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEvent} disabled={loading}>
              {loading ? 'Creating...' : 'Create Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Ticket Type Dialog */}
      <Dialog open={showTicketTypeDialog} onOpenChange={setShowTicketTypeDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Ticket Type</DialogTitle>
            <DialogDescription>
              Configure a new ticket type for your event
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ticketName">Ticket Name</Label>
              <Input
                id="ticketName"
                value={ticketTypeForm.name}
                onChange={(e) => setTicketTypeForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. General Admission, VIP Pass"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticketDescription">Description</Label>
              <Textarea
                id="ticketDescription"
                value={ticketTypeForm.description}
                onChange={(e) => setTicketTypeForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this ticket includes..."
                rows={2}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="ticketPrice">Price (₹)</Label>
                <Input
                  id="ticketPrice"
                  type="number"
                  value={ticketTypeForm.price}
                  onChange={(e) => setTicketTypeForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticketAvailable">Available</Label>
                <Input
                  id="ticketAvailable"
                  type="number"
                  value={ticketTypeForm.totalAvailable}
                  onChange={(e) => setTicketTypeForm(prev => ({ ...prev, totalAvailable: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPerPerson">Max per Person</Label>
                <Input
                  id="maxPerPerson"
                  type="number"
                  value={ticketTypeForm.maxPerPerson}
                  onChange={(e) => setTicketTypeForm(prev => ({ ...prev, maxPerPerson: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Sale Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(ticketTypeForm.saleStartDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={ticketTypeForm.saleStartDate}
                      onSelect={(date) => date && setTicketTypeForm(prev => ({ ...prev, saleStartDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Sale End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(ticketTypeForm.saleEndDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={ticketTypeForm.saleEndDate}
                      onSelect={(date) => date && setTicketTypeForm(prev => ({ ...prev, saleEndDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefits">Benefits (comma separated)</Label>
              <Input
                id="benefits"
                value={ticketTypeForm.benefits}
                onChange={(e) => setTicketTypeForm(prev => ({ ...prev, benefits: e.target.value }))}
                placeholder="e.g. Event access, Welcome kit, Meals"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Ticket Color</Label>
              <Input
                id="color"
                type="color"
                value={ticketTypeForm.color}
                onChange={(e) => setTicketTypeForm(prev => ({ ...prev, color: e.target.value }))}
                className="h-10 w-20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTicketTypeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTicketType}>
              Add Ticket Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}