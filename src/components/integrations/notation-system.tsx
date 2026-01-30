'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  FileText, 
  Plus, 
  Save,
  Share2,
  Download,
  Hash,
  List,
  Type,
  Image,
  Table,
  Code,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Underline,
  Link,
  Palette,
  Users,
  Clock,
  Search,
  Filter,
  MoreVertical,
  Sparkles,
  Eye,
  Edit3,
  Archive,
  Copy,
  Trash2
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
import { Separator } from '../ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface NotationDocument {
  id: string;
  title: string;
  content: any; // Rich text content JSON
  tags: string[];
  collaborators: Array<{
    userId: string;
    email: string;
    role: 'viewer' | 'editor' | 'owner';
    joinedAt: Date;
  }>;
  createdBy: string;
  eventId?: string;
  category: 'meeting-notes' | 'planning' | 'documentation' | 'brainstorming' | 'other';
  isTemplate: boolean;
  isPublic: boolean;
  lastModified: Date;
  version: number;
  aiSummary?: string;
}

interface NotationSystemProps {
  eventId?: string;
  eventTitle?: string;
  userRole: 'student' | 'professional' | 'organizer';
}

export default function NotationSystem({ eventId, eventTitle, userRole }: NotationSystemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [documents, setDocuments] = useState<NotationDocument[]>([]);
  const [activeDocument, setActiveDocument] = useState<NotationDocument | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showNewDocDialog, setShowNewDocDialog] = useState(false);
  
  // Editor state
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorContent, setEditorContent] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentTags, setDocumentTags] = useState<string[]>([]);
  const [documentCategory, setDocumentCategory] = useState<NotationDocument['category']>('documentation');
  
  // Collaboration state
  const [collaborators, setCollaborators] = useState<NotationDocument['collaborators']>([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'viewer' | 'editor'>('viewer');

  useEffect(() => {
    loadDocuments();
  }, [eventId]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notation/documents', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      
      const data = await response.json();
      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewDocument = async () => {
    if (!documentTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a document title.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/notation/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          title: documentTitle,
          content: { type: 'doc', content: [] }, // Empty ProseMirror document
          tags: documentTags,
          category: documentCategory,
          eventId,
          isTemplate: false,
          isPublic: false,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Document Created",
          description: `${documentTitle} has been created successfully.`,
        });
        setShowNewDocDialog(false);
        setDocumentTitle('');
        setDocumentTags([]);
        setDocumentCategory('documentation');
        loadDocuments();
      }
    } catch (error) {
      console.error('Error creating document:', error);
      toast({
        title: "Error",
        description: "Failed to create document.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveDocument = async () => {
    if (!activeDocument) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/notation/documents/${activeDocument.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          content: editorContent,
          title: activeDocument.title,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Document Saved",
          description: "Changes have been saved successfully.",
        });
        loadDocuments();
      }
    } catch (error) {
      console.error('Error saving document:', error);
      toast({
        title: "Error",
        description: "Failed to save document.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAISummary = async (document: NotationDocument) => {
    setLoading(true);
    try {
      const response = await fetch('/api/notation/ai-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          documentId: document.id,
          content: document.content,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "AI Summary Generated",
          description: "Document summary has been created.",
        });
        loadDocuments();
      }
    } catch (error) {
      console.error('Error generating AI summary:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI summary.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const shareDocument = async () => {
    if (!activeDocument || !shareEmail) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/notation/documents/${activeDocument.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          email: shareEmail,
          role: shareRole,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Document Shared",
          description: `Document shared with ${shareEmail}.`,
        });
        setShowShareDialog(false);
        setShareEmail('');
        loadDocuments();
      }
    } catch (error) {
      console.error('Error sharing document:', error);
      toast({
        title: "Error",
        description: "Failed to share document.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportDocument = async (doc: NotationDocument, format: 'pdf' | 'markdown' | 'html') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/notation/documents/${doc.id}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ format }),
      });

      const data = await response.json();
      if (data.success && data.downloadUrl) {
        // Create download link
        const link = window.document.createElement('a');
        link.href = data.downloadUrl;
        link.download = `${doc.title}.${format}`;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        
        toast({
          title: "Export Complete",
          description: `Document exported as ${format.toUpperCase()}.`,
        });
      }
    } catch (error) {
      console.error('Error exporting document:', error);
      toast({
        title: "Error",
        description: "Failed to export document.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: NotationDocument['category']) => {
    switch (category) {
      case 'meeting-notes': return <Users className="w-4 h-4" />;
      case 'planning': return <List className="w-4 h-4" />;
      case 'documentation': return <FileText className="w-4 h-4" />;
      case 'brainstorming': return <Sparkles className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: NotationDocument['category']) => {
    switch (category) {
      case 'meeting-notes': return 'bg-blue-500';
      case 'planning': return 'bg-green-500';
      case 'documentation': return 'bg-purple-500';
      case 'brainstorming': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  // Rich Text Editor Toolbar
  const EditorToolbar = () => (
    <div className="border-b p-2 flex flex-wrap gap-1">
      <div className="flex items-center gap-1 pr-2 border-r">
        <Button variant="ghost" size="sm">
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Heading2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Heading3 className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-1 pr-2 border-r">
        <Button variant="ghost" size="sm">
          <Bold className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Italic className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Underline className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-1 pr-2 border-r">
        <Button variant="ghost" size="sm">
          <List className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Hash className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-1 pr-2 border-r">
        <Button variant="ghost" size="sm">
          <Link className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Image className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Table className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Code className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Quote className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm">
          <Palette className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="glass-effect">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Notation System
              {eventTitle && (
                <Badge variant="outline">
                  {eventTitle}
                </Badge>
              )}
            </CardTitle>
            <Button onClick={() => setShowNewDocDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Document
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="documents" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="shared">Shared</TabsTrigger>
            </TabsList>
            
            <TabsContent value="documents" className="space-y-4">
              <div className="flex gap-2 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="meeting-notes">Meeting Notes</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="documentation">Documentation</SelectItem>
                    <SelectItem value="brainstorming">Brainstorming</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocuments.map((document) => (
                  <Card key={document.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getCategoryColor(document.category)}`} />
                          <span className="font-medium text-sm truncate">{document.title}</span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => {
                              setActiveDocument(document);
                              setIsEditing(true);
                            }}>
                              <Edit3 className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setActiveDocument(document);
                              setShowShareDialog(true);
                            }}>
                              <Share2 className="w-4 h-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => generateAISummary(document)}>
                              <Sparkles className="w-4 h-4 mr-2" />
                              AI Summary
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportDocument(document, 'pdf')}>
                              <Download className="w-4 h-4 mr-2" />
                              Export PDF
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(document.category)}
                          <Badge variant="secondary" className="text-xs">
                            {document.category.replace('-', ' ')}
                          </Badge>
                        </div>
                        
                        {document.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {document.tags.slice(0, 3).map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                            {document.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{document.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {document.aiSummary && (
                          <div className="p-2 bg-muted rounded text-xs">
                            <p className="truncate">{document.aiSummary}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{document.lastModified.toLocaleDateString()}</span>
                          {document.collaborators.length > 1 && (
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{document.collaborators.length}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredDocuments.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No documents found</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first document to get started
                  </p>
                  <Button onClick={() => setShowNewDocDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Document
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="editor" className="space-y-4">
              {activeDocument && isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Input
                      value={activeDocument.title}
                      onChange={(e) => setActiveDocument({
                        ...activeDocument,
                        title: e.target.value,
                      })}
                      className="text-xl font-semibold border-none bg-transparent p-0 focus-visible:ring-0"
                      placeholder="Document title..."
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button onClick={saveDocument} disabled={loading}>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </div>

                  <Card>
                    <EditorToolbar />
                    <div
                      ref={editorRef}
                      contentEditable
                      className="min-h-[400px] p-4 focus:outline-none"
                      onInput={(e) => setEditorContent(e.currentTarget.innerHTML)}
                      dangerouslySetInnerHTML={{ __html: editorContent }}
                    />
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Edit3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No document selected</h3>
                  <p className="text-muted-foreground">
                    Select a document to start editing
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="templates" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Template cards will be implemented */}
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Users className="w-8 h-8 text-blue-500" />
                      <div>
                        <h3 className="font-semibold">Meeting Notes</h3>
                        <p className="text-sm text-muted-foreground">
                          Standard template for meeting documentation
                        </p>
                      </div>
                    </div>
                    <Button size="sm" className="w-full">
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="shared" className="space-y-4">
              <div className="space-y-3">
                {documents
                  .filter(doc => doc.collaborators.length > 1)
                  .map((document) => (
                    <Card key={document.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getCategoryIcon(document.category)}
                            <div>
                              <p className="font-medium">{document.title}</p>
                              <p className="text-sm text-muted-foreground">
                                Shared with {document.collaborators.length - 1} people
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {document.collaborators.find(c => c.userId === user?.uid)?.role || 'viewer'}
                            </Badge>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* New Document Dialog */}
      <Dialog open={showNewDocDialog} onOpenChange={setShowNewDocDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
            <DialogDescription>
              Create a new collaborative document for your team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="doc-title">Title</Label>
              <Input
                id="doc-title"
                placeholder="Document title..."
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="doc-category">Category</Label>
              <Select value={documentCategory} onValueChange={(v) => setDocumentCategory(v as typeof documentCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting-notes">Meeting Notes</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="brainstorming">Brainstorming</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="doc-tags">Tags (comma-separated)</Label>
              <Input
                id="doc-tags"
                placeholder="tag1, tag2, tag3..."
                value={documentTags.join(', ')}
                onChange={(e) => setDocumentTags(
                  e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                )}
              />
            </div>
            
            <Button onClick={createNewDocument} disabled={loading} className="w-full">
              {loading ? 'Creating...' : 'Create Document'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Document Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Document</DialogTitle>
            <DialogDescription>
              Share {activeDocument?.title} with team members
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
              <Select value={shareRole} onValueChange={(v) => setShareRole(v as typeof shareRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={shareDocument} disabled={!shareEmail || loading} className="w-full">
              {loading ? 'Sharing...' : 'Share Document'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}