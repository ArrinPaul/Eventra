'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  FileText, 
  Table, 
  ExternalLink, 
  Plus, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  Calendar,
  Users,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '../../hooks/use-toast';
import { permissionsService } from '@/features/auth/services/permissions-service';
import { integrationService } from '@/features/integrations/services/integration-service';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { db } from '@/core/config/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

interface GoogleWorkspaceIntegrationProps {
  eventId: string;
  eventTitle: string;
}

interface WorkspaceDocument {
  id: string;
  documentId: string;
  documentTitle: string;
  templateType: string;
  createdAt: Date;
  createdBy: string;
  documentUrl: string;
}

interface WorkspaceSpreadsheet {
  id: string;
  spreadsheetId: string;
  spreadsheetTitle: string;
  templateType: string;
  createdAt: Date;
  createdBy: string;
  spreadsheetUrl: string;
  autoSync: boolean;
  lastSynced?: Date;
}

const DOCUMENT_TEMPLATES = [
  { 
    value: 'event_planning', 
    label: 'Event Planning Document', 
    description: 'Comprehensive planning checklist and timeline' 
  },
  { 
    value: 'agenda', 
    label: 'Event Agenda', 
    description: 'Detailed schedule and session information' 
  },
  { 
    value: 'notes', 
    label: 'Meeting Notes', 
    description: 'Collaborative note-taking document' 
  },
  { 
    value: 'feedback', 
    label: 'Feedback Collection', 
    description: 'Post-event feedback and evaluation' 
  },
];

const SPREADSHEET_TEMPLATES = [
  { 
    value: 'registrations', 
    label: 'Registration Tracker', 
    description: 'Real-time registration data and attendance tracking',
    sheets: [
      {
        title: 'Registrations',
        headers: ['Registration ID', 'Name', 'Email', 'Role', 'Registration Date', 'Status', 'Checked In', 'Ticket Type']
      }
    ]
  },
  { 
    value: 'analytics', 
    label: 'Event Analytics', 
    description: 'Attendance metrics, engagement data, and insights',
    sheets: [
      {
        title: 'Attendance',
        headers: ['Date', 'Total Registrations', 'Check-ins', 'No-shows', 'Engagement Score']
      },
      {
        title: 'Demographics',
        headers: ['Role', 'Count', 'Percentage', 'Engagement Level']
      }
    ]
  },
  { 
    value: 'feedback', 
    label: 'Feedback Analysis', 
    description: 'Survey responses and satisfaction metrics',
    sheets: [
      {
        title: 'Responses',
        headers: ['Timestamp', 'Attendee', 'Overall Rating', 'Content Rating', 'Venue Rating', 'Comments']
      }
    ]
  },
  { 
    value: 'planning', 
    label: 'Event Planning', 
    description: 'Budget tracking, vendor management, and logistics',
    sheets: [
      {
        title: 'Budget',
        headers: ['Category', 'Planned Amount', 'Actual Amount', 'Variance', 'Status']
      },
      {
        title: 'Vendors',
        headers: ['Vendor Name', 'Service', 'Contact', 'Cost', 'Status']
      }
    ]
  }
];

export default function GoogleWorkspaceIntegration({ eventId, eventTitle }: GoogleWorkspaceIntegrationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Permission checks
  const event = { organizerId: user?.uid }; // This would come from props in real implementation
  const workspacePermissions = permissionsService.getGoogleWorkspacePermissions(user);
  const canAccessIntegration = permissionsService.canAccessWorkspaceIntegration(user, event);
  
  const [isConnected, setIsConnected] = useState(false);
  const [documents, setDocuments] = useState<WorkspaceDocument[]>([]);
  const [spreadsheets, setSpreadsheets] = useState<WorkspaceSpreadsheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingRegistrations, setSyncingRegistrations] = useState(false);
  
  // Dialog states
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [showSpreadsheetDialog, setShowSpreadsheetDialog] = useState(false);
  
  // Form states
  const [selectedDocumentTemplate, setSelectedDocumentTemplate] = useState('');
  const [customDocumentTitle, setCustomDocumentTitle] = useState('');
  const [customDocumentContent, setCustomDocumentContent] = useState('');
  const [selectedSpreadsheetTemplate, setSelectedSpreadsheetTemplate] = useState('');
  const [customSpreadsheetTitle, setCustomSpreadsheetTitle] = useState('');

  useEffect(() => {
    checkConnectionStatus();
    if (isConnected) {
      loadWorkspaceItems();
    }
  }, [eventId, isConnected]);

  const checkConnectionStatus = async () => {
    try {
      if (!user?.uid) return;
      
      // Check user's Google Workspace connection status from Firestore
      const userIntegrationDoc = await getDoc(doc(db, 'user_integrations', user.uid));
      if (userIntegrationDoc.exists()) {
        const data = userIntegrationDoc.data();
        setIsConnected(data.googleWorkspaceConnected === true);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const connectGoogleWorkspace = async () => {
    setLoading(true);
    try {
      // Call Firebase function to get Google Workspace auth URL
      const response = await fetch('/api/google-workspace/auth-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      const data = await response.json();
      
      if (data.authUrl) {
        // Open Google OAuth in new window
        const authWindow = window.open(data.authUrl, 'googleAuth', 'width=600,height=600');
        
        // Listen for auth completion
        const checkClosed = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkClosed);
            checkConnectionStatus();
            toast({
              title: "Connection Status",
              description: "Please check if Google Workspace was connected successfully.",
            });
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error connecting Google Workspace:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to Google Workspace. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnectGoogleWorkspace = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/google-workspace/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (response.ok) {
        setIsConnected(false);
        // Update connection status in Firestore
        if (user?.uid) {
          await setDoc(doc(db, 'user_integrations', user.uid), {
            googleWorkspaceConnected: false,
            disconnectedAt: serverTimestamp()
          }, { merge: true });
        }
        toast({
          title: "Disconnected",
          description: "Google Workspace has been disconnected successfully.",
        });
      }
    } catch (error) {
      console.error('Error disconnecting Google Workspace:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect Google Workspace.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspaceItems = async () => {
    try {
      // Load documents and spreadsheets for this event
      // This would typically fetch from Firestore
      setDocuments([]);
      setSpreadsheets([]);
    } catch (error) {
      console.error('Error loading workspace items:', error);
    }
  };

  const createDocument = async () => {
    if (!selectedDocumentTemplate) return;

    // Check permissions
    const validation = permissionsService.validateAction(user, 'create_document', {
      type: selectedDocumentTemplate,
      eventId,
      ownerId: event.organizerId
    });

    if (!validation.allowed) {
      toast({
        title: "Permission Denied",
        description: validation.reason || "You don't have permission to create this document.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const template = DOCUMENT_TEMPLATES.find(t => t.value === selectedDocumentTemplate);
      const title = customDocumentTitle || template?.label || 'Untitled Document';
      
      const createEventDocumentFn = httpsCallable(functions, 'createEventDocument');
      const result = await createEventDocumentFn({
        eventId,
        template: {
          templateType: selectedDocumentTemplate,
          title: title,
          content: customDocumentContent || template?.description || '',
        }
      });

      const data = result.data as { success: boolean; documentId: string; documentUrl: string };
      
      if (data.success) {
        toast({
          title: "Document Created",
          description: `${title} has been created successfully in Google Docs.`,
        });
        setShowDocumentDialog(false);
        setSelectedDocumentTemplate('');
        setCustomDocumentTitle('');
        setCustomDocumentContent('');
        
        // Open the document in a new tab
        if (data.documentUrl) {
          window.open(data.documentUrl, '_blank');
        }
        
        loadWorkspaceItems();
      }
    } catch (error) {
      console.error('Error creating document:', error);
      toast({
        title: "Error",
        description: "Failed to create document. Ensure Google Workspace is connected.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSpreadsheet = async () => {
    if (!selectedSpreadsheetTemplate) return;

    // Check permissions
    const validation = permissionsService.validateAction(user, 'create_spreadsheet', {
      type: selectedSpreadsheetTemplate,
      eventId,
      ownerId: event.organizerId
    });

    if (!validation.allowed) {
      toast({
        title: "Permission Denied",
        description: validation.reason || "You don't have permission to create this spreadsheet.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const template = SPREADSHEET_TEMPLATES.find(t => t.value === selectedSpreadsheetTemplate);
      const title = customSpreadsheetTitle || template?.label || 'Untitled Spreadsheet';
      
      const createEventSpreadsheetFn = httpsCallable(functions, 'createEventSpreadsheet');
      const result = await createEventSpreadsheetFn({
        eventId,
        template: {
          templateType: selectedSpreadsheetTemplate,
          title: title,
          sheets: template?.sheets || []
        }
      });

      const data = result.data as { success: boolean; spreadsheetId: string; spreadsheetUrl: string };
      
      if (data.success) {
        toast({
          title: "Spreadsheet Created",
          description: `${title} has been created successfully in Google Sheets.`,
        });
        setShowSpreadsheetDialog(false);
        setSelectedSpreadsheetTemplate('');
        setCustomSpreadsheetTitle('');
        
        // Open the spreadsheet in a new tab
        if (data.spreadsheetUrl) {
          window.open(data.spreadsheetUrl, '_blank');
        }
        
        loadWorkspaceItems();
      }
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      toast({
        title: "Error",
        description: "Failed to create spreadsheet. Ensure Google Workspace is connected.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const syncRegistrations = async () => {
    setSyncingRegistrations(true);
    try {
      const response = await fetch('/api/google-workspace/sync-registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ eventId }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Sync Complete",
          description: `${result.syncedRecords} registrations synced to spreadsheet.`,
        });
        loadWorkspaceItems();
      }
    } catch (error) {
      console.error('Error syncing registrations:', error);
      toast({
        title: "Sync Error",
        description: "Failed to sync registrations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSyncingRegistrations(false);
    }
  };

  if (!canAccessIntegration) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Access Restricted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Not Permitted</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              You don&apos;t have permission to access Google Workspace integration for this event. 
              Contact the event organizer or upgrade your account permissions.
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Your current role: {user?.role || 'Unknown'}</p>
              <p className="text-xs text-muted-foreground">
                {permissionsService.getPermissionSummary(user, event).description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Google Workspace Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connect Google Workspace</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Connect your Google account to create collaborative documents and spreadsheets 
              that automatically sync with your event data.
            </p>
            <Button 
              onClick={connectGoogleWorkspace} 
              disabled={loading}
              className="w-full max-w-xs"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Connect Google Workspace
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Google Workspace Integration
            </CardTitle>
            <Badge variant="secondary">Connected</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              Create and manage collaborative documents and spreadsheets for {eventTitle}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={disconnectGoogleWorkspace}
              disabled={loading}
            >
              Disconnect
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Google Docs Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documents
                </h3>
                <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      New Doc
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Document</DialogTitle>
                      <DialogDescription>
                        Choose a template to create a collaborative document for your event.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="doc-template">Document Template</Label>
                        <Select value={selectedDocumentTemplate} onValueChange={setSelectedDocumentTemplate}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_TEMPLATES.map((template) => (
                              <SelectItem key={template.value} value={template.value}>
                                <div>
                                  <div className="font-medium">{template.label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {template.description}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="doc-title">Custom Title (Optional)</Label>
                        <Input
                          id="doc-title"
                          value={customDocumentTitle}
                          onChange={(e) => setCustomDocumentTitle(e.target.value)}
                          placeholder="Leave blank to use template name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="doc-content">Custom Content (Optional)</Label>
                        <Textarea
                          id="doc-content"
                          value={customDocumentContent}
                          onChange={(e) => setCustomDocumentContent(e.target.value)}
                          placeholder="Add custom content or leave blank for template content"
                          rows={3}
                        />
                      </div>
                      
                      <Button 
                        onClick={createDocument} 
                        disabled={!selectedDocumentTemplate || loading}
                        className="w-full"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            Create Document
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-2">
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No documents created yet
                  </p>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium text-sm">{doc.documentTitle}</div>
                        <div className="text-xs text-muted-foreground">
                          {doc.templateType.replace('_', ' ')} â€¢ {doc.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Google Sheets Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Table className="w-4 h-4" />
                  Spreadsheets
                </h3>
                <Dialog open={showSpreadsheetDialog} onOpenChange={setShowSpreadsheetDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      New Sheet
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Spreadsheet</DialogTitle>
                      <DialogDescription>
                        Choose a template to create a data spreadsheet for your event.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="sheet-template">Spreadsheet Template</Label>
                        <Select value={selectedSpreadsheetTemplate} onValueChange={setSelectedSpreadsheetTemplate}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                          <SelectContent>
                            {SPREADSHEET_TEMPLATES.map((template) => (
                              <SelectItem key={template.value} value={template.value}>
                                <div>
                                  <div className="font-medium">{template.label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {template.description}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="sheet-title">Custom Title (Optional)</Label>
                        <Input
                          id="sheet-title"
                          value={customSpreadsheetTitle}
                          onChange={(e) => setCustomSpreadsheetTitle(e.target.value)}
                          placeholder="Leave blank to use template name"
                        />
                      </div>
                      
                      <Button 
                        onClick={createSpreadsheet} 
                        disabled={!selectedSpreadsheetTemplate || loading}
                        className="w-full"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Table className="w-4 h-4 mr-2" />
                            Create Spreadsheet
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-2">
                {spreadsheets.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No spreadsheets created yet
                  </p>
                ) : (
                  spreadsheets.map((sheet) => (
                    <div key={sheet.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium text-sm">{sheet.spreadsheetTitle}</div>
                        <div className="text-xs text-muted-foreground">
                          {sheet.templateType} â€¢ {sheet.createdAt.toLocaleDateString()}
                          {sheet.autoSync && <Badge variant="secondary" className="ml-2">Auto-sync</Badge>}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <a href={sheet.spreadsheetUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Quick Actions */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Quick Actions
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={syncRegistrations}
                disabled={syncingRegistrations}
              >
                {syncingRegistrations ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Sync Registrations
                  </>
                )}
              </Button>
              
              <Button variant="outline" size="sm" onClick={loadWorkspaceItems}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Items
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}