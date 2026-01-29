'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Flag,
  MessageSquare,
  Users,
  MapPin,
  Ban,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertCircle,
  Shield,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Send
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';

// Types
interface ReportedEvent {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  organizerId: string;
  organizerName: string;
  reportedBy: string;
  reporterName: string;
  reportType: 'spam' | 'inappropriate' | 'misleading' | 'copyright' | 'safety' | 'other';
  description: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  resolvedAt?: Date;
  resolution?: string;
  moderatorNotes?: string;
}

interface PendingEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  date: Date;
  location: string;
  organizerId: string;
  organizerName: string;
  organizerEmail: string;
  capacity: number;
  isPaid: boolean;
  price?: number;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'needs_changes';
  reviewNotes?: string;
  flaggedContent?: string[];
}

interface ContentReport {
  id: string;
  contentType: 'post' | 'comment' | 'message' | 'profile';
  contentId: string;
  contentPreview: string;
  authorId: string;
  authorName: string;
  reportedBy: string;
  reporterName: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: Date;
}

export default function EventModeration() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reports');
  
  // Reports state
  const [reports, setReports] = useState<ReportedEvent[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportedEvent | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [resolution, setResolution] = useState('');
  
  // Pending events state
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [selectedPendingEvent, setSelectedPendingEvent] = useState<PendingEvent | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  
  // Content reports state
  const [contentReports, setContentReports] = useState<ContentReport[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    loadModerationData();
  }, []);

  const loadModerationData = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock reported events
    const mockReports: ReportedEvent[] = [
      {
        id: '1',
        eventId: 'evt1',
        eventTitle: 'Suspicious Tech Conference',
        eventDate: new Date('2026-02-15'),
        organizerId: 'org1',
        organizerName: 'Unknown Org',
        reportedBy: 'user1',
        reporterName: 'John Doe',
        reportType: 'misleading',
        description: 'Event details seem fake. The venue address does not exist and contact information is invalid.',
        status: 'pending',
        priority: 'high',
        createdAt: new Date('2026-01-28')
      },
      {
        id: '2',
        eventId: 'evt2',
        eventTitle: 'Free iPhone Giveaway Event',
        eventDate: new Date('2026-02-01'),
        organizerId: 'org2',
        organizerName: 'Deals Inc',
        reportedBy: 'user2',
        reporterName: 'Jane Smith',
        reportType: 'spam',
        description: 'This appears to be a scam event with unrealistic promises.',
        status: 'under_review',
        priority: 'critical',
        createdAt: new Date('2026-01-27'),
        moderatorNotes: 'Investigating organizer history'
      },
      {
        id: '3',
        eventId: 'evt3',
        eventTitle: 'Music Festival 2026',
        eventDate: new Date('2026-03-20'),
        organizerId: 'org3',
        organizerName: 'Event Masters',
        reportedBy: 'user3',
        reporterName: 'Mike Johnson',
        reportType: 'copyright',
        description: 'Using copyrighted images without permission',
        status: 'resolved',
        priority: 'medium',
        createdAt: new Date('2026-01-20'),
        resolvedAt: new Date('2026-01-25'),
        resolution: 'Organizer removed copyrighted images'
      }
    ];

    // Mock pending events
    const mockPendingEvents: PendingEvent[] = [
      {
        id: 'pend1',
        title: 'AI Workshop Series',
        description: 'Learn about AI and machine learning fundamentals in this hands-on workshop series.',
        category: 'Technology',
        date: new Date('2026-02-10'),
        location: 'Tech Hub, Building A',
        organizerId: 'org4',
        organizerName: 'Tech Club',
        organizerEmail: 'techclub@university.edu',
        capacity: 50,
        isPaid: false,
        submittedAt: new Date('2026-01-28'),
        status: 'pending'
      },
      {
        id: 'pend2',
        title: 'Networking Night',
        description: 'Connect with industry professionals and fellow students.',
        category: 'Networking',
        date: new Date('2026-02-05'),
        location: 'Student Center',
        organizerId: 'org5',
        organizerName: 'Career Services',
        organizerEmail: 'careers@university.edu',
        capacity: 100,
        isPaid: true,
        price: 10,
        submittedAt: new Date('2026-01-27'),
        status: 'pending'
      },
      {
        id: 'pend3',
        title: 'Study Group Session',
        description: 'Collaborative study session for midterms',
        category: 'Academic',
        date: new Date('2026-02-03'),
        location: 'Library Room 201',
        organizerId: 'org6',
        organizerName: 'Study Buddies',
        organizerEmail: 'studybuddies@university.edu',
        capacity: 20,
        isPaid: false,
        submittedAt: new Date('2026-01-29'),
        status: 'needs_changes',
        reviewNotes: 'Please add more details about what subjects will be covered',
        flaggedContent: ['Vague description']
      }
    ];

    // Mock content reports
    const mockContentReports: ContentReport[] = [
      {
        id: 'cr1',
        contentType: 'post',
        contentId: 'post1',
        contentPreview: 'This post contains inappropriate language...',
        authorId: 'user5',
        authorName: 'Problem User',
        reportedBy: 'user6',
        reporterName: 'Concerned Student',
        reason: 'Hate speech',
        status: 'pending',
        createdAt: new Date('2026-01-28')
      },
      {
        id: 'cr2',
        contentType: 'comment',
        contentId: 'comment1',
        contentPreview: 'Spam link to external site...',
        authorId: 'user7',
        authorName: 'Spammer',
        reportedBy: 'user8',
        reporterName: 'Alert User',
        reason: 'Spam',
        status: 'pending',
        createdAt: new Date('2026-01-27')
      }
    ];

    setReports(mockReports);
    setPendingEvents(mockPendingEvents);
    setContentReports(mockContentReports);
    setLoading(false);
  };

  // Stats
  const stats = useMemo(() => ({
    pendingReports: reports.filter(r => r.status === 'pending').length,
    underReview: reports.filter(r => r.status === 'under_review').length,
    pendingEvents: pendingEvents.filter(e => e.status === 'pending').length,
    needsChanges: pendingEvents.filter(e => e.status === 'needs_changes').length,
    contentReports: contentReports.filter(c => c.status === 'pending').length,
    criticalReports: reports.filter(r => r.priority === 'critical' && r.status !== 'resolved').length
  }), [reports, pendingEvents, contentReports]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'under_review': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'resolved': 
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'dismissed':
      case 'rejected': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'needs_changes': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'spam': return <Ban className="w-4 h-4" />;
      case 'inappropriate': return <AlertTriangle className="w-4 h-4" />;
      case 'misleading': return <AlertCircle className="w-4 h-4" />;
      case 'copyright': return <FileText className="w-4 h-4" />;
      case 'safety': return <Shield className="w-4 h-4" />;
      default: return <Flag className="w-4 h-4" />;
    }
  };

  const handleResolveReport = async (reportId: string, action: 'resolved' | 'dismissed') => {
    setReports(reports.map(r => 
      r.id === reportId ? { 
        ...r, 
        status: action, 
        resolvedAt: new Date(),
        resolution: resolution 
      } : r
    ));
    
    toast({
      title: action === 'resolved' ? 'Report Resolved' : 'Report Dismissed',
      description: `The report has been ${action}.`
    });
    
    setShowReportDialog(false);
    setResolution('');
    setSelectedReport(null);
  };

  const handleApproveEvent = async (eventId: string) => {
    setPendingEvents(pendingEvents.map(e => 
      e.id === eventId ? { ...e, status: 'approved' as const } : e
    ));
    
    toast({
      title: 'Event Approved',
      description: 'The event has been approved and is now published.'
    });
    
    setShowEventDialog(false);
    setSelectedPendingEvent(null);
  };

  const handleRejectEvent = async (eventId: string) => {
    setPendingEvents(pendingEvents.map(e => 
      e.id === eventId ? { ...e, status: 'rejected' as const, reviewNotes } : e
    ));
    
    toast({
      title: 'Event Rejected',
      description: 'The event has been rejected.',
      variant: 'destructive'
    });
    
    setShowEventDialog(false);
    setReviewNotes('');
    setSelectedPendingEvent(null);
  };

  const handleRequestChanges = async (eventId: string) => {
    setPendingEvents(pendingEvents.map(e => 
      e.id === eventId ? { ...e, status: 'needs_changes' as const, reviewNotes } : e
    ));
    
    toast({
      title: 'Changes Requested',
      description: 'The organizer has been notified to make changes.'
    });
    
    setShowEventDialog(false);
    setReviewNotes('');
    setSelectedPendingEvent(null);
  };

  const handleResolveContent = async (reportId: string, action: 'resolved' | 'dismissed') => {
    setContentReports(contentReports.map(r => 
      r.id === reportId ? { ...r, status: action } : r
    ));
    
    toast({
      title: action === 'resolved' ? 'Content Removed' : 'Report Dismissed',
      description: `The content report has been ${action}.`
    });
  };

  // Filter reports
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = report.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          report.organizerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || report.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [reports, searchTerm, statusFilter, priorityFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className={`p-4 ${stats.criticalReports > 0 ? 'border-red-500 bg-red-50 dark:bg-red-950' : ''}`}>
          <div className="flex items-center gap-2">
            <AlertCircle className={`w-5 h-5 ${stats.criticalReports > 0 ? 'text-red-500' : 'text-gray-500'}`} />
            <div>
              <p className="text-2xl font-bold">{stats.criticalReports}</p>
              <p className="text-xs text-muted-foreground">Critical</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{stats.pendingReports}</p>
              <p className="text-xs text-muted-foreground">Pending Reports</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.underReview}</p>
              <p className="text-xs text-muted-foreground">Under Review</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{stats.pendingEvents}</p>
              <p className="text-xs text-muted-foreground">Pending Events</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{stats.needsChanges}</p>
              <p className="text-xs text-muted-foreground">Needs Changes</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-pink-500" />
            <div>
              <p className="text-2xl font-bold">{stats.contentReports}</p>
              <p className="text-xs text-muted-foreground">Content Reports</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="reports" className="gap-2">
            <Flag className="w-4 h-4" />
            Event Reports
            {stats.pendingReports > 0 && (
              <Badge variant="destructive" className="ml-1">{stats.pendingReports}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            Pending Events
            {stats.pendingEvents > 0 && (
              <Badge className="ml-1">{stats.pendingEvents}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Content Reports
            {stats.contentReports > 0 && (
              <Badge variant="secondary" className="ml-1">{stats.contentReports}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Event Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reports..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={loadModerationData}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reports Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Report Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reported By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id} className={report.priority === 'critical' ? 'bg-red-50 dark:bg-red-950/30' : ''}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{report.eventTitle}</p>
                          <p className="text-sm text-muted-foreground">by {report.organizerName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getReportTypeIcon(report.reportType)}
                          <span className="capitalize">{report.reportType.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(report.priority)}>
                          {report.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{report.reporterName}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(report.createdAt, { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setSelectedReport(report);
                            setShowReportDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Events Tab */}
        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4">
            {pendingEvents.filter(e => e.status === 'pending' || e.status === 'needs_changes').map((event) => (
              <Card key={event.id} className={event.status === 'needs_changes' ? 'border-orange-500' : ''}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{event.title}</h3>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status.replace('_', ' ')}
                        </Badge>
                        {event.isPaid && (
                          <Badge variant="secondary">${event.price}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(event.date, 'PPP')}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {event.capacity} capacity
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Organizer: </span>
                        <span className="font-medium">{event.organizerName}</span>
                        <span className="text-muted-foreground"> ({event.organizerEmail})</span>
                      </div>
                      {event.reviewNotes && (
                        <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg mt-2">
                          <p className="text-sm text-orange-800 dark:text-orange-200">
                            <strong>Review Notes:</strong> {event.reviewNotes}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex lg:flex-col gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedPendingEvent(event);
                          setShowEventDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleApproveEvent(event.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedPendingEvent(event);
                          setShowEventDialog(true);
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {pendingEvents.filter(e => e.status === 'pending' || e.status === 'needs_changes').length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                  <p className="text-muted-foreground">No pending events to review.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Content Reports Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content Type</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reported</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contentReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {report.contentType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]">
                          {report.contentPreview}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{report.authorName}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{report.reason}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(report.createdAt, { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell>
                        {report.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleResolveContent(report.id, 'resolved')}
                            >
                              <ThumbsUp className="w-4 h-4 text-green-500" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleResolveContent(report.id, 'dismissed')}
                            >
                              <ThumbsDown className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Detail Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedReport.eventTitle}</h3>
                  <p className="text-sm text-muted-foreground">Event ID: {selectedReport.eventId}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={getPriorityColor(selectedReport.priority)}>
                    {selectedReport.priority}
                  </Badge>
                  <Badge className={getStatusColor(selectedReport.status)}>
                    {selectedReport.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Report Type</Label>
                  <p className="font-medium capitalize">{selectedReport.reportType.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Organizer</Label>
                  <p className="font-medium">{selectedReport.organizerName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reported By</Label>
                  <p className="font-medium">{selectedReport.reporterName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Event Date</Label>
                  <p className="font-medium">{format(selectedReport.eventDate, 'PPP')}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1 p-3 bg-muted rounded-lg text-sm">{selectedReport.description}</p>
              </div>

              {selectedReport.moderatorNotes && (
                <div>
                  <Label className="text-muted-foreground">Moderator Notes</Label>
                  <p className="mt-1 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                    {selectedReport.moderatorNotes}
                  </p>
                </div>
              )}

              {selectedReport.status !== 'resolved' && selectedReport.status !== 'dismissed' && (
                <div>
                  <Label htmlFor="resolution">Resolution Notes</Label>
                  <Textarea
                    id="resolution"
                    placeholder="Add notes about how this report was handled..."
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="mt-2"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedReport?.status !== 'resolved' && selectedReport?.status !== 'dismissed' ? (
              <>
                <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => handleResolveReport(selectedReport!.id, 'dismissed')}
                >
                  Dismiss Report
                </Button>
                <Button onClick={() => handleResolveReport(selectedReport!.id, 'resolved')}>
                  Mark Resolved
                </Button>
              </>
            ) : (
              <Button onClick={() => setShowReportDialog(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Review Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Event</DialogTitle>
          </DialogHeader>
          {selectedPendingEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedPendingEvent.title}</h3>
                <Badge variant="outline">{selectedPendingEvent.category}</Badge>
              </div>

              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1 p-3 bg-muted rounded-lg text-sm">{selectedPendingEvent.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="font-medium">{format(selectedPendingEvent.date, 'PPP')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Location</Label>
                  <p className="font-medium">{selectedPendingEvent.location}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Capacity</Label>
                  <p className="font-medium">{selectedPendingEvent.capacity} attendees</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ticket Price</Label>
                  <p className="font-medium">
                    {selectedPendingEvent.isPaid ? `$${selectedPendingEvent.price}` : 'Free'}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Organizer</Label>
                  <p className="font-medium">{selectedPendingEvent.organizerName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact</Label>
                  <p className="font-medium">{selectedPendingEvent.organizerEmail}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="reviewNotes">Review Notes (for organizer)</Label>
                <Textarea
                  id="reviewNotes"
                  placeholder="Add notes explaining your decision or requested changes..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="secondary"
              onClick={() => handleRequestChanges(selectedPendingEvent!.id)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Request Changes
            </Button>
            <Button 
              variant="destructive"
              onClick={() => handleRejectEvent(selectedPendingEvent!.id)}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button 
              onClick={() => handleApproveEvent(selectedPendingEvent!.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
