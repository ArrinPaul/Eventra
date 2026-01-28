'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  FileText, 
  Table, 
  ExternalLink, 
  Plus, 
  Share2,
  Download,
  Users,
  Settings,
  Loader2,
  FolderOpen,
  Eye,
  Edit3
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '../../hooks/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

interface EnhancedGoogleWorkspaceProps {
  eventId?: string;
  eventTitle?: string;
  userRole: 'student' | 'professional' | 'organizer';
}

interface WorkspaceFile {
  id: string;
  name: string;
  type: 'document' | 'spreadsheet' | 'presentation';
  url: string;
  thumbnailUrl?: string;
  lastModified: Date;
  sharedWith: Array<{
    email: string;
    role: string;
    sharedAt: Date;
  }>;
  permissions: {
    canEdit: boolean;
    canShare: boolean;
    canComment: boolean;
  };
}

interface CollaborationSession {
  id: string;
  fileId: string;
  participants: string[];
  isActive: boolean;
  lastActivity: Date;
}

// Google Drive Picker integration
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export default function EnhancedGoogleWorkspace({ eventId, eventTitle, userRole }: EnhancedGoogleWorkspaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isConnected, setIsConnected] = useState(false);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [collaborationSessions, setCollaborationSessions] = useState<CollaborationSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [pickerApiLoaded, setPickerApiLoaded] = useState(false);
  const [accessToken, setAccessToken] = useState<string>('');
  
  // Dialogs state
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<WorkspaceFile | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState('reader');

  useEffect(() => {
    loadGoogleAPI();
    checkConnectionStatus();
    if (isConnected) {
      loadWorkspaceFiles();
      loadCollaborationSessions();
    }
  }, [isConnected]);

  const loadGoogleAPI = useCallback(() => {
    if (typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('picker', () => {
          setPickerApiLoaded(true);
        });
      };
      document.head.appendChild(script);
    }
  }, []);

  const checkConnectionStatus = async () => {
    try {
      // Check connection status and get access token
      const connectionStatus = localStorage.getItem('googleWorkspaceConnected');
      if (connectionStatus === 'true') {
        setIsConnected(true);
        // Get access token for Drive Picker
        const response = await fetch('/api/google-workspace/picker-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.token}`,
          },
        });
        const data = await response.json();
        if (data.accessToken) {
          setAccessToken(data.accessToken);
        }
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const loadWorkspaceFiles = async () => {
    try {
      // Load files from integrations collection
      const response = await fetch('/api/google-workspace/files', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      const data = await response.json();
      if (data.files) {
        setFiles(data.files);
      }
    } catch (error) {
      console.error('Error loading workspace files:', error);
    }
  };

  const loadCollaborationSessions = async () => {
    try {
      const response = await fetch('/api/google-workspace/collaboration-sessions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      const data = await response.json();
      if (data.sessions) {
        setCollaborationSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error loading collaboration sessions:', error);
    }
  };

  const openDrivePicker = () => {
    if (!pickerApiLoaded || !accessToken) {
      toast({
        title: "Error",
        description: "Drive Picker is not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const picker = new window.google.picker.PickerBuilder()
      .addView(window.google.picker.ViewId.DOCS)
      .addView(window.google.picker.ViewId.SPREADSHEETS)
      .addView(window.google.picker.ViewId.PRESENTATIONS)
      .setOAuthToken(accessToken)
      .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_API_KEY)
      .setCallback(handlePickerCallback)
      .build();

    picker.setVisible(true);
  };

  const handlePickerCallback = async (data: any) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const file = data.docs[0];
      
      try {
        // Store file metadata in Firebase
        const response = await fetch('/api/google-workspace/manage-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.token}`,
          },
          body: JSON.stringify({
            action: 'updateMetadata',
            fileData: {
              fileId: file.id,
              name: file.name,
              type: file.mimeType.includes('document') ? 'document' : 
                    file.mimeType.includes('spreadsheet') ? 'spreadsheet' : 'presentation',
              url: file.url,
              thumbnailUrl: file.thumbnailUrl,
              eventId,
              permissions: {
                canEdit: true,
                canShare: userRole === 'organizer',
                canComment: true,
              }
            }
          }),
        });

        if (response.ok) {
          toast({
            title: "File Added",
            description: `${file.name} has been added to your workspace.`,
          });
          loadWorkspaceFiles();
        }
      } catch (error) {
        console.error('Error adding file:', error);
        toast({
          title: "Error",
          description: "Failed to add file to workspace.",
          variant: "destructive",
        });
      }
    }
  };

  const shareFile = async () => {
    if (!selectedFile || !shareEmail) return;

    setLoading(true);
    try {
      const response = await fetch('/api/google-workspace/manage-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          action: 'share',
          fileData: {
            fileId: selectedFile.id,
            email: shareEmail,
            role: shareRole,
          }
        }),
      });

      if (response.ok) {
        toast({
          title: "File Shared",
          description: `${selectedFile.name} has been shared with ${shareEmail}.`,
        });
        setShowShareDialog(false);
        setShareEmail('');
        setSelectedFile(null);
        loadWorkspaceFiles();
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      toast({
        title: "Error",
        description: "Failed to share file.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToPdf = async (file: WorkspaceFile) => {
    if (file.type !== 'document') {
      toast({
        title: "Error",
        description: "Only documents can be exported to PDF.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/google-workspace/manage-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          action: 'exportPdf',
          fileData: {
            fileId: file.id,
          }
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Open download URL
        window.open(result.downloadURL, '_blank');
        toast({
          title: "Export Complete",
          description: `${file.name} has been exported to PDF.`,
        });
      }
    } catch (error) {
      console.error('Error exporting file:', error);
      toast({
        title: "Error",
        description: "Failed to export file to PDF.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const enableCollaboration = async (file: WorkspaceFile) => {
    setLoading(true);
    try {
      const response = await fetch('/api/google-workspace/collaboration/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          fileId: file.id,
          fileType: file.type,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: "Collaboration Enabled",
          description: `Real-time collaboration is now active for ${file.name}.`,
        });
        loadCollaborationSessions();
      }
    } catch (error) {
      console.error('Error enabling collaboration:', error);
      toast({
        title: "Error",
        description: "Failed to enable collaboration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="w-5 h-5" />;
      case 'spreadsheet': return <Table className="w-5 h-5" />;
      case 'presentation': return <FileText className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getPermissionLevel = (userRole: string) => {
    switch (userRole) {
      case 'organizer': return 'Full Access';
      case 'professional': return 'Edit & Share';
      case 'student': return 'View Only';
      default: return 'No Access';
    }
  };

  if (!isConnected) {
    return (
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Enhanced Google Workspace
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Connect your Google Workspace to access advanced collaboration features
            </p>
            <Button onClick={() => setIsConnected(true)} className="w-full max-w-xs">
              <ExternalLink className="w-4 h-4 mr-2" />
              Connect Google Workspace
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-effect">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Enhanced Google Workspace
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{getPermissionLevel(userRole)}</Badge>
              <Badge variant="outline">Connected</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="files" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="files" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Workspace Files</h3>
                <div className="flex gap-2">
                  <Button onClick={openDrivePicker} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Files
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                  <Card key={file.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.type)}
                          <span className="font-medium text-sm truncate">{file.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {file.type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      {file.thumbnailUrl && (
                        <div className="mb-3">
                          <img 
                            src={file.thumbnailUrl} 
                            alt={file.name}
                            className="w-full h-24 object-cover rounded border"
                          />
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(file.url, '_blank')}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        
                        {file.permissions.canEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(file.url, '_blank')}
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        )}
                        
                        {file.permissions.canShare && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedFile(file);
                              setShowShareDialog(true);
                            }}
                          >
                            <Share2 className="w-3 h-3 mr-1" />
                            Share
                          </Button>
                        )}
                        
                        {file.type === 'document' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportToPdf(file)}
                            disabled={loading}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            PDF
                          </Button>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        <p>Modified: {file.lastModified.toLocaleDateString()}</p>
                        {file.sharedWith.length > 0 && (
                          <p>Shared with {file.sharedWith.length} people</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {files.length === 0 && (
                <div className="text-center py-12">
                  <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No files yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add files from Google Drive to get started
                  </p>
                  <Button onClick={openDrivePicker}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First File
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="collaboration" className="space-y-4">
              <h3 className="text-lg font-semibold">Active Collaboration Sessions</h3>
              
              <div className="space-y-3">
                {collaborationSessions.map((session) => {
                  const sessionFile = files.find(f => f.id === session.fileId);
                  return (
                    <Card key={session.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{sessionFile?.name || 'Unknown File'}</p>
                            <p className="text-sm text-muted-foreground">
                              {session.participants.length} participants • 
                              Last activity: {session.lastActivity.toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={session.isActive ? "default" : "secondary"}>
                              {session.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => sessionFile && window.open(sessionFile.url, '_blank')}
                            >
                              Join
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {collaborationSessions.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No active collaborations</h3>
                  <p className="text-muted-foreground">
                    Enable real-time collaboration on your documents to see active sessions here
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="templates" className="space-y-4">
              <h3 className="text-lg font-semibold">Document Templates</h3>
              <p className="text-muted-foreground">
                Quick-start templates for common event management documents
              </p>
              {/* Template content will be implemented */}
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4">
              <h3 className="text-lg font-semibold">Integration Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-sync changes</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically sync document changes with event data
                    </p>
                  </div>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Collaboration notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when others edit shared documents
                    </p>
                  </div>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Share File Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share File</DialogTitle>
            <DialogDescription>
              Share {selectedFile?.name} with team members
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="share-email">Email Address</Label>
              <Input
                id="share-email"
                type="email"
                placeholder="colleague@example.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="share-role">Permission Level</Label>
              <Select value={shareRole} onValueChange={setShareRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reader">Viewer</SelectItem>
                  <SelectItem value="commenter">Commenter</SelectItem>
                  <SelectItem value="writer">Editor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={shareFile} 
              disabled={!shareEmail || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share File
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}