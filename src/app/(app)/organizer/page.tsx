'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  TrendingUp,
  Settings,
  Plus,
  Edit,
  Eye,
  BarChart3,
  UserCheck,
  Mail,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
  Video,
  Star,
  Copy,
  Trash2,
  MoreHorizontal,
  Award,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

// Certificate management
import { CertificateManager } from '@/components/certificates/certificate-manager';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  venue: string;
  capacity: number;
  registrations: number;
  status: 'draft' | 'published' | 'ongoing' | 'completed';
  tracks: string[];
  sessions: number;
  speakers: number;
  rating?: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'professional' | 'speaker' | 'organizer';
  registrationDate: string;
  status: 'active' | 'inactive' | 'pending';
  checkedIn?: boolean;
}

interface Session {
  id: string;
  title: string;
  speaker: string;
  track: string;
  startTime: string;
  duration: number;
  attendees: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

export default function OrganizerPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  // Event action handlers
  const handleDuplicateEvent = (event: Event) => {
    const newEvent: Event = {
      ...event,
      id: `event_${Date.now()}`,
      title: `${event.title} (Copy)`,
      status: 'draft',
      registrations: 0,
    };
    setEvents([...events, newEvent]);
    toast({
      title: 'Event Duplicated',
      description: `"${event.title}" has been duplicated as a draft.`,
    });
  };

  const handleDeleteEvent = (eventId: string) => {
    setDeleteEventId(eventId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteEvent = () => {
    if (deleteEventId) {
      const eventToDelete = events.find(e => e.id === deleteEventId);
      setEvents(events.filter(e => e.id !== deleteEventId));
      toast({
        title: 'Event Deleted',
        description: `"${eventToDelete?.title}" has been permanently deleted.`,
        variant: 'destructive',
      });
    }
    setShowDeleteDialog(false);
    setDeleteEventId(null);
  };

  const handleViewAnalytics = (eventId: string) => {
    // Navigate to analytics page or show modal
    toast({
      title: 'Opening Analytics',
      description: 'Redirecting to event analytics...',
    });
    // In a real app: router.push(`/organizer/events/${eventId}/analytics`)
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API calls
      setEvents([
        {
          id: 'event_1',
          title: 'SAP TechEd 2024',
          description: 'Annual SAP technology conference',
          startDate: '2024-03-15',
          endDate: '2024-03-17',
          venue: 'Convention Center',
          capacity: 500,
          registrations: 387,
          status: 'published',
          tracks: ['Technical', 'Business', 'Innovation'],
          sessions: 45,
          speakers: 28,
          rating: 4.6,
        },
        {
          id: 'event_2',
          title: 'SAP Cloud Workshop',
          description: 'Hands-on workshop for SAP Cloud Platform',
          startDate: '2024-04-20',
          endDate: '2024-04-20',
          venue: 'Tech Hub',
          capacity: 100,
          registrations: 78,
          status: 'draft',
          tracks: ['Technical'],
          sessions: 8,
          speakers: 5,
        },
      ]);

      setUsers([
        {
          id: 'user_1',
          name: 'John Smith',
          email: 'john.smith@example.com',
          role: 'professional',
          registrationDate: '2024-02-15',
          status: 'active',
          checkedIn: true,
        },
        {
          id: 'user_2',
          name: 'Jane Doe',
          email: 'jane.doe@university.edu',
          role: 'student',
          registrationDate: '2024-02-20',
          status: 'active',
          checkedIn: false,
        },
        {
          id: 'user_3',
          name: 'Alex Johnson',
          email: 'alex.johnson@company.com',
          role: 'speaker',
          registrationDate: '2024-02-10',
          status: 'active',
          checkedIn: true,
        },
      ]);

      setSessions([
        {
          id: 'session_1',
          title: 'SAP Cloud Platform Overview',
          speaker: 'Alex Johnson',
          track: 'Technical',
          startTime: '10:00 AM',
          duration: 45,
          attendees: 120,
          status: 'scheduled',
        },
        {
          id: 'session_2',
          title: 'Digital Transformation with SAP',
          speaker: 'Sarah Williams',
          track: 'Business',
          startTime: '2:00 PM',
          duration: 60,
          attendees: 95,
          status: 'ongoing',
        },
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load dashboard data.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'published': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Dashboard statistics
  const totalUsers = users.length;
  const totalEvents = events.length;
  const checkedInUsers = users.filter(u => u.checkedIn).length;
  const totalSessions = sessions.length;
  const ongoingSessions = sessions.filter(s => s.status === 'ongoing').length;

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Calendar className="text-blue-500" size={24} />
              <div>
                <p className="text-2xl font-bold text-blue-600">{totalEvents}</p>
                <p className="text-sm text-gray-600">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Users className="text-green-500" size={24} />
              <div>
                <p className="text-2xl font-bold text-green-600">{totalUsers}</p>
                <p className="text-sm text-gray-600">Registered Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <UserCheck className="text-purple-500" size={24} />
              <div>
                <p className="text-2xl font-bold text-purple-600">{checkedInUsers}</p>
                <p className="text-sm text-gray-600">Checked In</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Video className="text-orange-500" size={24} />
              <div>
                <p className="text-2xl font-bold text-orange-600">{ongoingSessions}</p>
                <p className="text-sm text-gray-600">Live Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Events</CardTitle>
            <Link href="/organizer/events">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.slice(0, 3).map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold">{event.title}</h3>
                    <Badge className={getStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(event.startDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {event.venue}
                    </span>
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {event.registrations}/{event.capacity}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/events/${event.id}`}>
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/events/${event.id}/edit`}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewAnalytics(event.id)}>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Analytics
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateEvent(event)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate Event
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Event
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Live Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.filter(s => s.status === 'ongoing').map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800">{session.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-green-700 mt-1">
                    <span>Speaker: {session.speaker}</span>
                    <span>Track: {session.track}</span>
                    <span>Attendees: {session.attendees}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">LIVE</span>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    Monitor
                  </Button>
                </div>
              </div>
            ))}
            
            {sessions.filter(s => s.status === 'ongoing').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Video className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No live sessions at the moment</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const EventsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Event Management</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create New Event
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {events.map((event) => (
          <Card key={event.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <CardTitle>{event.title}</CardTitle>
                    <Badge className={getStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                  </div>
                  <CardDescription>{event.description}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Analytics
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold">
                    {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Registration</p>
                  <p className="font-semibold">
                    {event.registrations}/{event.capacity}
                    <span className="text-sm text-gray-500 ml-1">
                      ({Math.round((event.registrations / event.capacity) * 100)}%)
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sessions</p>
                  <p className="font-semibold">{event.sessions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Speakers</p>
                  <p className="font-semibold">{event.speakers}</p>
                </div>
              </div>

              {event.rating && (
                <div className="mt-4 flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="font-semibold">{event.rating}</span>
                  <span className="text-sm text-gray-600">Average Rating</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const UsersTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="student">Students</SelectItem>
              <SelectItem value="professional">Professionals</SelectItem>
              <SelectItem value="speaker">Speakers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {user.role}
                      </Badge>
                      <Badge className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                      {user.checkedIn && (
                        <Badge className="bg-green-100 text-green-800">
                          Checked In
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Mail className="w-4 h-4 mr-1" />
                    Contact
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    Profile
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Certificates Tab - Issue certificates to attendees
  const CertificatesTab = ({ events, users }: { events: Event[]; users: User[] }) => {
    const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
    const selectedEvent = events.find(e => e.id === selectedEventId);
    
    // Map users to attendees format expected by CertificateManager
    const attendees = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      checkedIn: u.checkedIn || false,
    }));

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Certificate Management</h2>
            <p className="text-muted-foreground">
              Generate and issue certificates to event attendees
            </p>
          </div>
        </div>

        {/* Event Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Event</CardTitle>
            <CardDescription>
              Choose an event to manage certificates for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="w-full md:w-[400px]">
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    <div className="flex items-center gap-2">
                      <span>{event.title}</span>
                      <Badge variant="outline" className="ml-2">
                        {event.registrations} registrations
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Certificate Manager */}
        {selectedEvent ? (
          <CertificateManager
            eventId={selectedEvent.id}
            eventTitle={selectedEvent.title}
            attendees={attendees}
            onCertificatesGenerated={() => {
              toast({
                title: 'Success',
                description: 'Certificates have been generated and queued for delivery.',
              });
            }}
          />
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Select an event to manage certificates
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Organizer Dashboard</h1>
            <p className="text-gray-600">Manage events, users, and analytics from one place.</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              Reports
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Quick Actions
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Events</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="certificates" className="flex items-center space-x-2">
            <Award className="w-4 h-4" />
            <span>Certificates</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="events">
          <EventsTab />
        </TabsContent>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>

        <TabsContent value="certificates">
          <CertificatesTab events={events} users={users} />
        </TabsContent>

        <TabsContent value="settings">
          <div className="text-center py-12 text-gray-500">
            <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Settings panel coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone. 
              All registrations and data associated with this event will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteEvent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}