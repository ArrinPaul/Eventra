/**
 * EventOS Google Workspace Integration
 * OAuth2-based Docs/Sheets integration with real-time collaboration
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Spreadsheet,
  Plus,
  ExternalLink,
  RefreshCw,
  Settings,
  Users,
  Share2,
  Download,
  Upload,
  Link2,
  Eye,
  Edit,
  Copy,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  Zap,
  Cloud,
  Lock,
  Unlock,
  PlayCircle,
  PauseCircle,
  Calendar,
  BarChart3,
  MessageSquare,
  Globe,
  Shield
} from 'lucide-react';

// Google Workspace types
interface GoogleWorkspaceDocument {
  id: string;
  title: string;
  type: 'document' | 'spreadsheet' | 'presentation' | 'form';
  url: string;
  webViewLink: string;
  webContentLink: string;
  createdTime: string;
  modifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
  permissions: GooglePermission[];
  size?: number;
  mimeType: string;
  thumbnailLink?: string;
  eventId?: string;
  organizationId: string;
  isTemplate: boolean;
  tags: string[];
  collaborators: string[];
  status: 'draft' | 'in_progress' | 'review' | 'published' | 'archived';
  metadata: {
    purpose: 'agenda' | 'registration' | 'feedback' | 'report' | 'presentation' | 'other';
    autoSync: boolean;
    lastSyncTime?: string;
    syncFrequency: 'real-time' | 'hourly' | 'daily' | 'manual';
  };
}

interface GooglePermission {
  id: string;
  type: 'user' | 'group' | 'domain' | 'anyone';
  role: 'owner' | 'writer' | 'commenter' | 'reader';
  emailAddress?: string;
  displayName?: string;
  allowFileDiscovery?: boolean;
}

interface GoogleWorkspaceIntegration {
  isConnected: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  permissions: string[];
  userInfo?: {
    email: string;
    name: string;
    picture: string;
  };
  settings: {
    autoCreateDocs: boolean;
    defaultPermissions: string[];
    syncEnabled: boolean;
    notificationsEnabled: boolean;
  };
}

interface DocumentTemplate {
  id: string;
  name: string;
  type: 'document' | 'spreadsheet' | 'presentation';
  description: string;
  templateId: string;
  category: 'agenda' | 'registration' | 'feedback' | 'report';
  previewUrl: string;
  isCustom: boolean;
}

// Document templates
const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'event-agenda',
    name: 'Event Agenda',
    type: 'document',
    description: 'Professional event agenda with time slots and speaker details',
    templateId: 'template-agenda-001',
    category: 'agenda',
    previewUrl: '#',
    isCustom: false,
  },
  {
    id: 'attendee-list',
    name: 'Attendee Tracking Sheet',
    type: 'spreadsheet',
    description: 'Track registrations, check-ins, and feedback',
    templateId: 'template-attendee-001',
    category: 'registration',
    previewUrl: '#',
    isCustom: false,
  },
  {
    id: 'feedback-form',
    name: 'Event Feedback Form',
    type: 'document',
    description: 'Collect post-event feedback and testimonials',
    templateId: 'template-feedback-001',
    category: 'feedback',
    previewUrl: '#',
    isCustom: false,
  },
  {
    id: 'analytics-report',
    name: 'Event Analytics Report',
    type: 'spreadsheet',
    description: 'Comprehensive analytics and performance metrics',
    templateId: 'template-analytics-001',
    category: 'report',
    previewUrl: '#',
    isCustom: false,
  },
];

export function GoogleWorkspaceIntegration() {
  const [integration, setIntegration] = useState<GoogleWorkspaceIntegration>({
    isConnected: false,
    permissions: [],
    settings: {
      autoCreateDocs: true,
      defaultPermissions: ['reader'],
      syncEnabled: true,
      notificationsEnabled: true,
    },
  });
  
  const [documents, setDocuments] = useState<GoogleWorkspaceDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<GoogleWorkspaceDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (integration.isConnected) {
      loadDocuments();
    }
  }, [integration.isConnected]);

  const connectGoogleWorkspace = async () => {
    setIsConnecting(true);
    try {
      // Simulate OAuth2 flow
      // In real implementation, this would redirect to Google OAuth
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockIntegration: GoogleWorkspaceIntegration = {
        isConnected: true,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        permissions: ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/spreadsheets'],
        userInfo: {
          email: user?.email || 'user@example.com',
          name: user?.name || 'John Doe',
          picture: user?.avatar || '',
        },
        settings: {
          autoCreateDocs: true,
          defaultPermissions: ['reader'],
          syncEnabled: true,
          notificationsEnabled: true,
        },
      };
      
      setIntegration(mockIntegration);
      
      toast({
        title: 'Google Workspace Connected!',
        description: 'You can now create and manage documents directly from EventOS.',
      });
    } catch (error) {
      console.error('Google Workspace connection failed:', error);
      toast({
        title: 'Connection Failed',
        description: 'Unable to connect to Google Workspace. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectGoogleWorkspace = async () => {
    try {
      // Revoke tokens in real implementation
      setIntegration({
        isConnected: false,
        permissions: [],
        settings: {
          autoCreateDocs: true,
          defaultPermissions: ['reader'],
          syncEnabled: true,
          notificationsEnabled: true,
        },
      });
      setDocuments([]);
      
      toast({
        title: 'Disconnected',
        description: 'Google Workspace integration has been disabled.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to disconnect Google Workspace.',
        variant: 'destructive',
      });
    }
  };

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual Google Drive API calls
      const mockDocuments: GoogleWorkspaceDocument[] = [
        {
          id: 'doc1',
          title: 'AI Conference 2024 - Event Agenda',
          type: 'document',
          url: 'https://docs.google.com/document/d/1234567890',
          webViewLink: 'https://docs.google.com/document/d/1234567890/edit',
          webContentLink: 'https://docs.google.com/document/d/1234567890/export?format=pdf',
          createdTime: '2024-12-01T10:00:00Z',
          modifiedTime: '2024-12-10T15:30:00Z',
          createdBy: user?.id || 'user1',
          lastModifiedBy: 'user2',
          permissions: [
            { id: 'perm1', type: 'user', role: 'owner', emailAddress: user?.email, displayName: user?.name },
            { id: 'perm2', type: 'user', role: 'writer', emailAddress: 'speaker@example.com', displayName: 'Jane Speaker' },
          ],
          mimeType: 'application/vnd.google-apps.document',
          eventId: 'event1',
          organizationId: user?.organizationId || 'org1',
          isTemplate: false,
          tags: ['agenda', 'conference', 'ai'],
          collaborators: ['user1', 'user2'],
          status: 'in_progress',
          metadata: {
            purpose: 'agenda',
            autoSync: true,
            lastSyncTime: '2024-12-10T15:30:00Z',
            syncFrequency: 'real-time',
          },
        },
        {
          id: 'sheet1',
          title: 'Attendee Registration Tracker',
          type: 'spreadsheet',
          url: 'https://docs.google.com/spreadsheets/d/0987654321',
          webViewLink: 'https://docs.google.com/spreadsheets/d/0987654321/edit',
          webContentLink: 'https://docs.google.com/spreadsheets/d/0987654321/export?format=xlsx',
          createdTime: '2024-11-28T09:00:00Z',
          modifiedTime: '2024-12-10T16:45:00Z',
          createdBy: user?.id || 'user1',
          lastModifiedBy: user?.id || 'user1',
          permissions: [
            { id: 'perm3', type: 'user', role: 'owner', emailAddress: user?.email, displayName: user?.name },
            { id: 'perm4', type: 'group', role: 'writer', emailAddress: 'organizers@example.com', displayName: 'Event Organizers' },
          ],
          mimeType: 'application/vnd.google-apps.spreadsheet',
          eventId: 'event1',
          organizationId: user?.organizationId || 'org1',
          isTemplate: false,
          tags: ['registration', 'tracking', 'data'],
          collaborators: ['user1', 'user3'],
          status: 'published',
          metadata: {
            purpose: 'registration',
            autoSync: true,
            lastSyncTime: '2024-12-10T16:45:00Z',
            syncFrequency: 'hourly',
          },
        },
      ];
      
      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast({
        title: 'Error Loading Documents',
        description: 'Unable to fetch documents from Google Workspace.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createDocumentFromTemplate = async (template: DocumentTemplate, title: string, eventId?: string) => {
    setIsLoading(true);
    try {
      // Mock document creation - replace with actual Google Docs/Sheets API
      const newDocument: GoogleWorkspaceDocument = {
        id: `doc${Date.now()}`,
        title,
        type: template.type,
        url: `https://docs.google.com/${template.type}/d/new-document-id`,
        webViewLink: `https://docs.google.com/${template.type}/d/new-document-id/edit`,
        webContentLink: `https://docs.google.com/${template.type}/d/new-document-id/export`,
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString(),
        createdBy: user?.id || '',
        lastModifiedBy: user?.id || '',
        permissions: [
          { 
            id: 'perm-new', 
            type: 'user', 
            role: 'owner', 
            emailAddress: user?.email, 
            displayName: user?.name 
          },
        ],
        mimeType: template.type === 'document' ? 'application/vnd.google-apps.document' : 'application/vnd.google-apps.spreadsheet',
        eventId,
        organizationId: user?.organizationId || '',
        isTemplate: false,
        tags: [template.category],
        collaborators: [user?.id || ''],
        status: 'draft',
        metadata: {
          purpose: template.category,
          autoSync: integration.settings.syncEnabled,
          syncFrequency: 'real-time',
        },
      };
      
      setDocuments(prev => [newDocument, ...prev]);
      setShowCreateDialog(false);
      
      toast({
        title: 'Document Created!',
        description: `${template.name} has been created and is ready for collaboration.`,
      });
      
      // Open the document in a new tab
      window.open(newDocument.webViewLink, '_blank');
    } catch (error) {
      console.error('Document creation failed:', error);
      toast({
        title: 'Creation Failed',
        description: 'Unable to create document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncDocument = async (docId: string) => {
    try {
      // Mock sync operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDocuments(prev => prev.map(doc => 
        doc.id === docId 
          ? { 
              ...doc, 
              modifiedTime: new Date().toISOString(),
              metadata: { 
                ...doc.metadata, 
                lastSyncTime: new Date().toISOString() 
              }
            }
          : doc
      ));
      
      toast({
        title: 'Sync Complete',
        description: 'Document has been synchronized with EventOS data.',
      });
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: 'Unable to sync document.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Google Workspace</h1>
          <p className="text-muted-foreground">
            Collaborate on documents with real-time sync and AI-powered automation
          </p>
        </div>
        <Badge variant={integration.isConnected ? 'default' : 'secondary'}>
          {integration.isConnected ? 'Connected' : 'Not Connected'}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Cloud className="w-5 h-5" />
                <span>Google Workspace Integration</span>
              </CardTitle>
              <CardDescription>
                Connect your Google account to create and manage documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {integration.isConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-green-900 dark:text-green-100">Connected to Google Workspace</h4>
                        <p className="text-sm text-green-700 dark:text-green-200">
                          {integration.userInfo?.email}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={disconnectGoogleWorkspace}>
                      Disconnect
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Quick Stats</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                            <div className="text-2xl font-bold text-blue-600">{documents.length}</div>
                            <div className="text-sm text-muted-foreground">Documents</div>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                            <div className="text-2xl font-bold text-green-600">
                              {documents.reduce((sum, doc) => sum + doc.collaborators.length, 0)}
                            </div>
                            <div className="text-sm text-muted-foreground">Collaborators</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {documents.slice(0, 3).map((doc) => (
                            <div key={doc.id} className="flex items-center space-x-3 text-sm">
                              <div className={`w-2 h-2 rounded-full ${
                                doc.type === 'document' ? 'bg-blue-500' : 'bg-green-500'
                              }`} />
                              <span className="flex-1 truncate">{doc.title}</span>
                              <span className="text-muted-foreground">
                                {new Date(doc.modifiedTime).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                    <Cloud className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Connect Google Workspace</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Seamlessly create and collaborate on documents, spreadsheets, and presentations
                    </p>
                  </div>
                  <Button 
                    onClick={connectGoogleWorkspace} 
                    disabled={isConnecting}
                    className="w-full max-w-xs"
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4 mr-2" />
                        Connect Google Account
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Your Documents</span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={loadDocuments} disabled={isLoading}>
                    <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => setShowCreateDialog(true)}
                    disabled={!integration.isConnected}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Create
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-medium mb-2">No documents yet</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first document to start collaborating
                  </p>
                  <Button 
                    onClick={() => setShowCreateDialog(true)}
                    disabled={!integration.isConnected}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Document
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center space-x-4 p-4 rounded-lg border hover:bg-accent/50">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        doc.type === 'document' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {doc.type === 'document' ? (
                          <FileText className="w-5 h-5" />
                        ) : (
                          <Spreadsheet className="w-5 h-5" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{doc.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>Modified {new Date(doc.modifiedTime).toLocaleDateString()}</span>
                          <Badge variant={doc.status === 'published' ? 'default' : 'secondary'}>
                            {doc.status}
                          </Badge>
                          {doc.metadata.autoSync && (
                            <div className="flex items-center space-x-1">
                              <RefreshCw className="w-3 h-3" />
                              <span className="text-xs">Auto-sync</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {doc.collaborators.length} collaborator{doc.collaborators.length !== 1 ? 's' : ''}
                        </span>
                        
                        <Button size="sm" variant="ghost" onClick={() => syncDocument(doc.id)}>
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        
                        <Button size="sm" variant="ghost" asChild>
                          <a href={doc.webViewLink} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Document Templates</span>
              </CardTitle>
              <CardDescription>
                Create professional documents from pre-designed templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DOCUMENT_TEMPLATES.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          template.type === 'document' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {template.type === 'document' ? (
                            <FileText className="w-5 h-5" />
                          ) : (
                            <Spreadsheet className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium mb-1">{template.name}</h4>
                          <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setSelectedTemplate(template);
                                setShowCreateDialog(true);
                              }}
                              disabled={!integration.isConnected}
                            >
                              Use Template
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Settings</CardTitle>
              <CardDescription>
                Configure how Google Workspace integrates with EventOS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Advanced settings will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Document Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
            <DialogDescription>
              {selectedTemplate ? `Create a new ${selectedTemplate.name}` : 'Choose a template to get started'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {!selectedTemplate ? (
              <div className="grid grid-cols-1 gap-3">
                {DOCUMENT_TEMPLATES.map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        template.type === 'document' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {template.type === 'document' ? (
                          <FileText className="w-4 h-4" />
                        ) : (
                          <Spreadsheet className="w-4 h-4" />
                        )}
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const title = formData.get('title') as string;
                const eventId = formData.get('eventId') as string;
                createDocumentFromTemplate(selectedTemplate, title, eventId || undefined);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Document Title</label>
                    <Input 
                      name="title"
                      placeholder={`My ${selectedTemplate.name}`}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Link to Event (optional)</label>
                    <Select name="eventId">
                      <SelectTrigger>
                        <SelectValue placeholder="Select an event" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="event1">AI Conference 2024</SelectItem>
                        <SelectItem value="event2">Product Summit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setSelectedTemplate(null)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button type="submit" disabled={isLoading} className="flex-1">
                      {isLoading ? 'Creating...' : 'Create'}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}