'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/core/utils/utils';
import { 
  FileText, 
  Table, 
  Calendar,
  Share2, 
  Plus, 
  ExternalLink,
  Download,
  Upload,
  Users,
  Eye,
  Edit,
  Trash2,
  Settings,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileIcon,
  FolderIcon,
  Link,
  Copy,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  User,
  Star,
  Archive
} from 'lucide-react';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/core/config/firebase';

interface GoogleWorkspaceDocument {
  id: string;
  documentId: string;
  documentTitle: string;
  templateType: string;
  createdBy: string;
  createdAt: any;
  lastModified: any;
  collaborators: string[];
  eventId?: string;
  status: 'active' | 'archived';
  permissions: {
    canEdit: boolean;
    canView: boolean;
    canShare: boolean;
  };
}

interface GoogleWorkspaceSpreadsheet {
  id: string;
  spreadsheetId: string;
  spreadsheetTitle: string;
  templateType: string;
  createdBy: string;
  createdAt: any;
  lastModified: any;
  collaborators: string[];
  eventId?: string;
  status: 'active' | 'archived';
  permissions: {
    canEdit: boolean;
    canView: boolean;
    canShare: boolean;
  };
}

interface DocumentTemplate {
  title: string;
  content: string;
  templateType: 'event_planning' | 'agenda' | 'notes' | 'feedback' | 'custom';
}

interface SpreadsheetTemplate {
  title: string;
  sheets: Array<{
    title: string;
    headers: string[];
  }>;
  templateType: 'registrations' | 'analytics' | 'feedback' | 'planning' | 'custom';
}

const GoogleWorkspaceClient = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<GoogleWorkspaceDocument[]>([]);
  const [spreadsheets, setSpreadsheets] = useState<GoogleWorkspaceSpreadsheet[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('lastModified');
  
  // Dialog states
  const [createDocDialog, setCreateDocDialog] = useState(false);
  const [createSheetDialog, setCreateSheetDialog] = useState(false);
  const [shareDialog, setShareDialog] = useState<{open: boolean, item: any}>({open: false, item: null});
  
  // Form states
  const [selectedEvent, setSelectedEvent] = useState('');
  const [documentTemplate, setDocumentTemplate] = useState<DocumentTemplate>({
    title: '',
    content: '',
    templateType: 'event_planning'
  });
  const [spreadsheetTemplate, setSpreadsheetTemplate] = useState<SpreadsheetTemplate>({
    title: '',
    sheets: [{ title: 'Sheet1', headers: [] }],
    templateType: 'registrations'
  });

  const functions = getFunctions();

  // Document Templates
  const documentTemplates = {
    event_planning: {
      title: 'Event Planning Document',
      content: `# Event Planning Document

## Event Overview
- **Event Name**: [Event Name]
- **Date**: [Event Date]
- **Location**: [Event Location]
- **Expected Attendees**: [Number]

## Planning Checklist
### Pre-Event (30 days before)
- [ ] Finalize venue booking
- [ ] Send invitations
- [ ] Arrange catering
- [ ] Prepare materials

### Pre-Event (7 days before)
- [ ] Confirm attendee numbers
- [ ] Prepare registration setup
- [ ] Brief event staff
- [ ] Final equipment check

### Event Day
- [ ] Setup registration
- [ ] Welcome attendees
- [ ] Monitor event flow
- [ ] Collect feedback

### Post-Event
- [ ] Send thank you messages
- [ ] Analyze feedback
- [ ] Generate reports
- [ ] Archive materials

## Notes
[Additional planning notes and updates]`
    },
    agenda: {
      title: 'Event Agenda',
      content: `# Event Agenda

## Event Details
- **Event**: [Event Name]
- **Date**: [Event Date]
- **Location**: [Event Location]

## Schedule

### 9:00 AM - Registration & Welcome
- Check-in process
- Welcome coffee
- Networking

### 9:30 AM - Opening Keynote
- **Speaker**: [Speaker Name]
- **Topic**: [Keynote Topic]

### 10:30 AM - Break
- Networking break
- Refreshments

### 11:00 AM - Session 1
- **Title**: [Session Title]
- **Speaker**: [Speaker Name]
- **Duration**: 45 minutes

### 12:00 PM - Lunch Break
- Networking lunch
- Informal discussions

### 1:00 PM - Session 2
- **Title**: [Session Title]
- **Speaker**: [Speaker Name]
- **Duration**: 45 minutes

### 2:00 PM - Panel Discussion
- **Moderator**: [Moderator Name]
- **Panelists**: [Panelist Names]

### 3:00 PM - Closing Remarks
- Summary and next steps
- Thank you and wrap-up`
    },
    notes: {
      title: 'Meeting Notes',
      content: `# Meeting Notes

## Meeting Information
- **Date**: [Meeting Date]
- **Time**: [Meeting Time]
- **Attendees**: [List of Attendees]
- **Facilitator**: [Facilitator Name]

## Agenda
1. [Agenda Item 1]
2. [Agenda Item 2]
3. [Agenda Item 3]

## Discussion Points
### [Topic 1]
- Key points discussed
- Decisions made
- Action items

### [Topic 2]
- Key points discussed
- Decisions made
- Action items

## Action Items
| Task | Assigned To | Due Date | Status |
|------|------------|----------|--------|
| [Task 1] | [Person] | [Date] | Pending |
| [Task 2] | [Person] | [Date] | Pending |

## Next Steps
- [Next step 1]
- [Next step 2]
- [Next meeting date/time]`
    },
    feedback: {
      title: 'Event Feedback Collection',
      content: `# Event Feedback Collection

## Event Information
- **Event Name**: [Event Name]
- **Date**: [Event Date]
- **Location**: [Event Location]

## Feedback Categories

### Overall Experience
Please rate your overall experience (1-5 stars)
- Comments and suggestions:

### Content Quality
Rate the quality of presentations and sessions
- Most valuable session:
- Suggestions for improvement:

### Organization & Logistics
Rate event organization and logistics
- Registration process:
- Venue and facilities:
- Catering and refreshments:

### Networking Opportunities
Rate networking and interaction opportunities
- Did you meet new contacts?
- Networking session effectiveness:

### Speakers & Presentations
Rate speaker quality and presentation effectiveness
- Most engaging speaker:
- Presentation feedback:

### Suggestions for Future Events
- Topics you'd like to see covered:
- Preferred event format:
- Additional suggestions:

## Contact Information (Optional)
- Name:
- Email:
- Organization:
- Would you like to be contacted about future events? Yes/No`
    },
    custom: {
      title: 'Custom Document',
      content: `# Custom Document

## Description
Enter your custom content here.

## Notes
[Your notes]`
    }
  };

  // Spreadsheet Templates
  const spreadsheetTemplates = {
    registrations: {
      title: 'Event Registrations',
      sheets: [
        {
          title: 'Registrations',
          headers: ['Name', 'Email', 'Organization', 'Role', 'Registration Date', 'Check-in Status', 'Dietary Requirements', 'Contact Number']
        },
        {
          title: 'Analytics',
          headers: ['Metric', 'Count', 'Percentage', 'Notes']
        }
      ]
    },
    analytics: {
      title: 'Event Analytics',
      sheets: [
        {
          title: 'Attendance',
          headers: ['Session', 'Total Registered', 'Attended', 'Attendance Rate', 'No Shows']
        },
        {
          title: 'Demographics',
          headers: ['Category', 'Count', 'Percentage']
        },
        {
          title: 'Engagement',
          headers: ['Activity', 'Participants', 'Completion Rate', 'Average Rating']
        }
      ]
    },
    feedback: {
      title: 'Feedback Analysis',
      sheets: [
        {
          title: 'Responses',
          headers: ['Respondent', 'Overall Rating', 'Content Quality', 'Organization', 'Networking', 'Comments', 'Submission Date']
        },
        {
          title: 'Summary',
          headers: ['Question', 'Average Score', 'Response Count', 'Top Comments']
        }
      ]
    },
    planning: {
      title: 'Event Planning',
      sheets: [
        {
          title: 'Tasks',
          headers: ['Task', 'Assigned To', 'Due Date', 'Status', 'Priority', 'Notes']
        },
        {
          title: 'Budget',
          headers: ['Category', 'Budgeted Amount', 'Actual Cost', 'Variance', 'Notes']
        },
        {
          title: 'Timeline',
          headers: ['Milestone', 'Planned Date', 'Actual Date', 'Status', 'Dependencies']
        }
      ]
    },
    custom: {
      title: 'Custom Spreadsheet',
      sheets: [
        {
          title: 'Sheet1',
          headers: ['Column A', 'Column B', 'Column C', 'Column D']
        }
      ]
    }
  };

  // Check connection status on component mount
  useEffect(() => {
    if (user) {
      checkConnectionStatus();
      loadUserEvents();
      loadDocuments();
      loadSpreadsheets();
    }
  }, [user]);

  const checkConnectionStatus = async () => {
    try {
      // This would typically check the user's document for Google Workspace connection status
      // For now, we'll assume it's not connected initially
      setIsConnected(false);
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const loadUserEvents = async () => {
    if (!user) return;
    
    try {
      const eventsQuery = query(
        collection(db, 'events'),
        where('organizerId', '==', user.uid),
        orderBy('startTime', 'desc')
      );
      
      const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
        const eventsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEvents(eventsData);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadDocuments = async () => {
    if (!user) return;
    
    try {
      const docsQuery = query(
        collection(db, 'eventDocuments'),
        where('collaborators', 'array-contains', user.uid),
        orderBy('lastModified', 'desc')
      );
      
      const unsubscribe = onSnapshot(docsQuery, (snapshot) => {
        const docsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          permissions: {
            canEdit: true, // This would be calculated based on user role
            canView: true,
            canShare: true
          }
        })) as GoogleWorkspaceDocument[];
        setDocuments(docsData);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const loadSpreadsheets = async () => {
    if (!user) return;
    
    try {
      const sheetsQuery = query(
        collection(db, 'eventSpreadsheets'),
        where('collaborators', 'array-contains', user.uid),
        orderBy('lastModified', 'desc')
      );
      
      const unsubscribe = onSnapshot(sheetsQuery, (snapshot) => {
        const sheetsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          permissions: {
            canEdit: true, // This would be calculated based on user role
            canView: true,
            canShare: true
          }
        })) as GoogleWorkspaceSpreadsheet[];
        setSpreadsheets(sheetsData);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading spreadsheets:', error);
    }
  };

  const connectGoogleWorkspace = async () => {
    try {
      setLoading(true);
      const getAuthUrl = httpsCallable(functions, 'getGoogleWorkspaceAuthUrl');
      const result = await getAuthUrl();
      
      // Open Google OAuth window
      const authWindow = window.open((result.data as { authUrl: string }).authUrl, 'google-auth', 'width=500,height=600');
      
      // Listen for the auth completion (you'd implement a callback handler)
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          checkConnectionStatus();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error connecting Google Workspace:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect Google Workspace. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async () => {
    if (!selectedEvent) {
      toast({
        title: "Event Required",
        description: "Please select an event for this document.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const createDoc = httpsCallable(functions, 'createEventDocument');
      
      const template = documentTemplates[documentTemplate.templateType];
      const result = await createDoc({
        eventId: selectedEvent,
        template: {
          ...documentTemplate,
          title: documentTemplate.title || template.title,
          content: documentTemplate.content || template.content
        }
      });

      toast({
        title: "Document Created",
        description: `Document created successfully!`,
      });

      setCreateDocDialog(false);
      setDocumentTemplate({
        title: '',
        content: '',
        templateType: 'event_planning'
      });
      setSelectedEvent('');

      // Open the created document
      const docData = result.data as { documentUrl?: string };
      if (docData.documentUrl) {
        window.open(docData.documentUrl, '_blank');
      }

    } catch (error) {
      console.error('Error creating document:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createSpreadsheet = async () => {
    if (!selectedEvent) {
      toast({
        title: "Event Required",
        description: "Please select an event for this spreadsheet.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const createSheet = httpsCallable(functions, 'createEventSpreadsheet');
      
      const template = spreadsheetTemplates[spreadsheetTemplate.templateType];
      const result = await createSheet({
        eventId: selectedEvent,
        template: {
          ...spreadsheetTemplate,
          title: spreadsheetTemplate.title || template.title,
          sheets: spreadsheetTemplate.sheets.length > 0 ? spreadsheetTemplate.sheets : template.sheets
        }
      });

      toast({
        title: "Spreadsheet Created",
        description: `Spreadsheet created successfully!`,
      });

      setCreateSheetDialog(false);
      setSpreadsheetTemplate({
        title: '',
        sheets: [{ title: 'Sheet1', headers: [] }],
        templateType: 'registrations'
      });
      setSelectedEvent('');

      // Open the created spreadsheet
      const sheetData = result.data as { spreadsheetUrl?: string };
      if (sheetData.spreadsheetUrl) {
        window.open(sheetData.spreadsheetUrl, '_blank');
      }

    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create spreadsheet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: "Document link copied to clipboard",
    });
  };

  const archiveItem = async (itemId: string, type: 'document' | 'spreadsheet') => {
    try {
      const collection_name = type === 'document' ? 'eventDocuments' : 'eventSpreadsheets';
      await updateDoc(doc(db, collection_name, itemId), {
        status: 'archived'
      });
      
      toast({
        title: "Archived",
        description: `${type === 'document' ? 'Document' : 'Spreadsheet'} archived successfully`,
      });
    } catch (error) {
      console.error('Error archiving item:', error);
      toast({
        title: "Archive Failed",
        description: "Failed to archive item. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Filter and sort items
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.documentTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || doc.templateType === filterType;
    return matchesSearch && matchesFilter && doc.status === 'active';
  });

  const filteredSpreadsheets = spreadsheets.filter(sheet => {
    const matchesSearch = sheet.spreadsheetTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || sheet.templateType === filterType;
    return matchesSearch && matchesFilter && sheet.status === 'active';
  });

  if (!isConnected) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <FileText className="h-8 w-8 text-blue-600" />
            Google Workspace Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-lg text-muted-foreground">
              Connect your Google Workspace to create and manage collaborative documents and spreadsheets for your events.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
              <div className="flex flex-col items-center p-4 border rounded-lg">
                <FileText className="h-8 w-8 text-blue-600 mb-2" />
                <h3 className="font-semibold">Documents</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Create planning docs, agendas, and meeting notes
                </p>
              </div>
              <div className="flex flex-col items-center p-4 border rounded-lg">
                <Table className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-semibold">Spreadsheets</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Track registrations, analytics, and feedback
                </p>
              </div>
              <div className="flex flex-col items-center p-4 border rounded-lg">
                <Share2 className="h-8 w-8 text-purple-600 mb-2" />
                <h3 className="font-semibold">Collaboration</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Real-time collaboration with your team
                </p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={connectGoogleWorkspace} 
            disabled={loading}
            size="lg"
            className="w-full max-w-sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Connect Google Workspace
              </>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground">
            You'll be redirected to Google to authorize access to your Workspace account.
            We only access documents you create through Vibeathon.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Google Workspace</h2>
          <p className="text-muted-foreground">Manage your collaborative documents and spreadsheets</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents and spreadsheets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="event_planning">Event Planning</SelectItem>
            <SelectItem value="agenda">Agenda</SelectItem>
            <SelectItem value="notes">Meeting Notes</SelectItem>
            <SelectItem value="feedback">Feedback</SelectItem>
            <SelectItem value="registrations">Registrations</SelectItem>
            <SelectItem value="analytics">Analytics</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lastModified">Last Modified</SelectItem>
            <SelectItem value="created">Date Created</SelectItem>
            <SelectItem value="title">Title A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Dialog open={createDocDialog} onOpenChange={setCreateDocDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select Event</Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map(event => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Template Type</Label>
                <Select 
                  value={documentTemplate.templateType} 
                  onValueChange={(value: keyof typeof documentTemplates) => setDocumentTemplate(prev => ({ 
                    ...prev, 
                    templateType: value,
                    content: documentTemplates[value].content 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event_planning">Event Planning</SelectItem>
                    <SelectItem value="agenda">Agenda</SelectItem>
                    <SelectItem value="notes">Meeting Notes</SelectItem>
                    <SelectItem value="feedback">Feedback Collection</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Document Title (Optional)</Label>
                <Input
                  value={documentTemplate.title}
                  onChange={(e) => setDocumentTemplate(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Leave empty to use template default"
                />
              </div>

              <div>
                <Label>Initial Content</Label>
                <Textarea
                  value={documentTemplate.content}
                  onChange={(e) => setDocumentTemplate(prev => ({ ...prev, content: e.target.value }))}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateDocDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createDocument} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Document'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={createSheetDialog} onOpenChange={setCreateSheetDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              New Spreadsheet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Spreadsheet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select Event</Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map(event => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Template Type</Label>
                <Select 
                  value={spreadsheetTemplate.templateType} 
                  onValueChange={(value: keyof typeof spreadsheetTemplates) => setSpreadsheetTemplate(prev => ({ 
                    ...prev, 
                    templateType: value,
                    sheets: spreadsheetTemplates[value].sheets 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registrations">Registrations</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Spreadsheet Title (Optional)</Label>
                <Input
                  value={spreadsheetTemplate.title}
                  onChange={(e) => setSpreadsheetTemplate(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Leave empty to use template default"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateSheetDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createSpreadsheet} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Spreadsheet'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs for Documents and Spreadsheets */}
      <Tabs defaultValue="documents" className="w-full">
        <TabsList>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents ({filteredDocuments.length})
          </TabsTrigger>
          <TabsTrigger value="spreadsheets" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            Spreadsheets ({filteredSpreadsheets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6">
          {filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Documents Found</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first document to get started with collaborative planning.
                </p>
                <Button onClick={() => setCreateDocDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Document
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{doc.documentTitle}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <Badge variant="secondary">{doc.templateType.replace('_', ' ')}</Badge>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {doc.lastModified?.toDate?.()?.toLocaleDateString() || 'Recently'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {doc.collaborators.length} collaborator{doc.collaborators.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(`https://docs.google.com/document/d/${doc.documentId}/edit`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyLink(`https://docs.google.com/document/d/${doc.documentId}/edit`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => archiveItem(doc.id, 'document')}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="spreadsheets" className="mt-6">
          {filteredSpreadsheets.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Table className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Spreadsheets Found</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first spreadsheet to track event data and analytics.
                </p>
                <Button onClick={() => setCreateSheetDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Spreadsheet
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredSpreadsheets.map((sheet) => (
                <Card key={sheet.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Table className="h-8 w-8 text-green-600" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{sheet.spreadsheetTitle}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <Badge variant="secondary">{sheet.templateType}</Badge>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {sheet.lastModified?.toDate?.()?.toLocaleDateString() || 'Recently'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {sheet.collaborators.length} collaborator{sheet.collaborators.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${sheet.spreadsheetId}/edit`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyLink(`https://docs.google.com/spreadsheets/d/${sheet.spreadsheetId}/edit`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => archiveItem(sheet.id, 'spreadsheet')}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GoogleWorkspaceClient;