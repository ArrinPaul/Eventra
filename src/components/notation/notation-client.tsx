'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  NotebookPen, 
  Save, 
  Share, 
  Download, 
  Plus, 
  Search, 
  Filter,
  Users,
  Calendar,
  Tag,
  FileText,
  Brain,
  Clock,
  CheckCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import dynamic from 'next/dynamic';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

interface Notation {
  id: string;
  title: string;
  content: string;
  eventId?: string;
  sessionId?: string;
  tags: string[];
  isPublic: boolean;
  collaborators: string[];
  createdAt: string;
  updatedAt: string;
  aiSummary?: string;
  aiTags?: string[];
  version: number;
  lastEditBy: string;
}

interface NotationClientProps {
  eventId?: string;
  sessionId?: string;
  userId?: string;
}

const NotationClient: React.FC<NotationClientProps> = ({ eventId, sessionId, userId }) => {
  const { user } = useAuth();
  const [notations, setNotations] = useState<Notation[]>([]);
  const [selectedNotation, setSelectedNotation] = useState<Notation | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [collaboratorEmails, setCollaboratorEmails] = useState('');

  const createNotation = httpsCallable(functions, 'createNotation');
  const updateNotation = httpsCallable(functions, 'updateNotation');
  const shareNotation = httpsCallable(functions, 'shareNotation');
  const generateAISummary = httpsCallable(functions, 'generateAISummary');
  const exportNotationToPDF = httpsCallable(functions, 'exportNotationToPDF');

  // Load notations
  const loadNotations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // In a real implementation, you'd call a Firebase function to get notations
      // For now, we'll simulate with local data
      const mockNotations: Notation[] = [
        {
          id: '1',
          title: 'AI Conference Session Notes',
          content: '<h2>Machine Learning Trends</h2><p>Key insights from the session...</p>',
          eventId: eventId || 'event1',
          sessionId: sessionId || 'session1',
          tags: ['AI', 'machine-learning', 'trends'],
          isPublic: false,
          collaborators: [user.uid],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          lastEditBy: user.uid,
          aiSummary: 'Discussion on latest ML trends and applications in industry'
        }
      ];
      
      setNotations(mockNotations);
    } catch (error) {
      console.error('Error loading notations:', error);
      toast({
        title: "Error",
        description: "Failed to load notations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, eventId, sessionId]);

  useEffect(() => {
    loadNotations();
  }, [loadNotations]);

  // Filter notations based on search and tags
  const filteredNotations = notations.filter(notation => {
    const matchesSearch = notation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notation.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = filterTags.length === 0 || 
                       filterTags.some(tag => notation.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  // Get all unique tags
  const allTags = Array.from(new Set(notations.flatMap(n => n.tags)));

  const handleCreateNotation = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and content are required",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Simulate API call
      // await createNotation({...});
      
      const newNotation: Notation = {
        id: Date.now().toString(),
        title,
        content,
        tags,
        isPublic,
        collaborators: [user?.uid || ''],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        lastEditBy: user?.uid || '',
        eventId,
        sessionId
      };
      
      setNotations([newNotation, ...notations]);
      toast({
        title: "Success",
        description: "Notation created successfully"
      });
      
      setIsCreating(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating notation:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to create notation',
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNotation = async () => {
    if (!selectedNotation || !title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      // await updateNotation({...});
      
      const updatedNotation = {
        ...selectedNotation,
        title,
        content,
        tags,
        isPublic,
        updatedAt: new Date().toISOString(),
        version: selectedNotation.version + 1
      };
      
      setNotations(notations.map(n => n.id === selectedNotation.id ? updatedNotation : n));
      setSelectedNotation(updatedNotation);
      
      toast({
        title: "Success",
        description: "Notation updated successfully"
      });
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating notation:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to update notation',
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleShareNotation = async () => {
    if (!selectedNotation || !collaboratorEmails.trim()) return;

    setSaving(true);
    try {
      const emails = collaboratorEmails.split(',').map(email => email.trim()).filter(Boolean);
      
      // await shareNotation({...});

      toast({
        title: "Success",
        description: `Notation shared with ${emails.length} collaborator(s)`
      });
      setShareDialogOpen(false);
      setCollaboratorEmails('');
    } catch (error: any) {
      console.error('Error sharing notation:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to share notation',
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAISummary = async (notationId: string) => {
    setSaving(true);
    try {
      // await generateAISummary({ notationId });
      toast({
        title: "Success",
        description: "AI summary generated"
      });
      // In real app, reload notations to get the new summary
    } catch (error: any) {
      console.error('Error generating AI summary:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to generate AI summary',
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async (notationId: string) => {
    setSaving(true);
    try {
      // const result = await exportNotationToPDF({ notationId });
      
      // if (result.data && (result.data as any).downloadUrl) {
      //   window.open((result.data as any).downloadUrl, '_blank');
      // }
      toast({
        title: "Success",
        description: "PDF export started"
      });
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to export PDF',
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTags([]);
    setIsPublic(false);
    setNewTag('');
  };

  const startEditing = (notation: Notation) => {
    setSelectedNotation(notation);
    setTitle(notation.title);
    setContent(notation.content);
    setTags(notation.tags);
    setIsPublic(notation.isPublic);
    setIsEditing(true);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const toggleFilterTag = (tag: string) => {
    setFilterTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <NotebookPen className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Notation System</h1>
            <p className="text-gray-600">Create, collaborate, and organize your notes</p>
          </div>
        </div>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Notation
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>

            {/* Tag filters */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-600 flex items-center">
                  <Tag className="h-3 w-3 mr-1" />
                  Filter by tags:
                </span>
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={filterTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleFilterTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notations List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Notations ({filteredNotations.length})
          </h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredNotations.map(notation => (
              <Card 
                key={notation.id} 
                className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedNotation?.id === notation.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedNotation(notation)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-medium truncate">{notation.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {new Date(notation.updatedAt).toLocaleDateString()}
                      {notation.collaborators.length > 1 && (
                        <>
                          <Users className="h-3 w-3 ml-2" />
                          {notation.collaborators.length}
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {notation.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {notation.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{notation.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {(isCreating || isEditing) ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {isCreating ? 'Create New Notation' : 'Edit Notation'}
                </CardTitle>
                <CardDescription>
                  {isCreating 
                    ? 'Create a new notation with rich text content and collaboration features'
                    : 'Update your notation content and settings'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Notation title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <div className="h-64">
                  <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={modules}
                    style={{ height: '200px' }}
                  />
                </div>

                <div className="space-y-3 mt-12">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button onClick={addTag} variant="outline">Add</Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <Badge key={tag} variant="default" className="cursor-pointer"
                             onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                    />
                    <span className="text-sm">Make public</span>
                  </label>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreating(false);
                        setIsEditing(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={isCreating ? handleCreateNotation : handleUpdateNotation}
                      disabled={saving}
                      className="flex items-center gap-2"
                    >
                      {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                      <Save className="h-4 w-4" />
                      {isCreating ? 'Create' : 'Update'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : selectedNotation ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedNotation.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <Clock className="h-4 w-4" />
                      Updated {new Date(selectedNotation.updatedAt).toLocaleString()}
                      • Version {selectedNotation.version}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing(selectedNotation)}
                      className="flex items-center gap-1"
                    >
                      <NotebookPen className="h-3 w-3" />
                      Edit
                    </Button>
                    
                    <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Share className="h-3 w-3" />
                          Share
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Share Notation</DialogTitle>
                          <DialogDescription>
                            Enter email addresses of collaborators (comma-separated)
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea
                            placeholder="email1@example.com, email2@example.com..."
                            value={collaboratorEmails}
                            onChange={(e) => setCollaboratorEmails(e.target.value)}
                          />
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleShareNotation} disabled={saving}>
                              {saving ? 'Sharing...' : 'Share'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateAISummary(selectedNotation.id)}
                      disabled={saving}
                      className="flex items-center gap-1"
                    >
                      <Brain className="h-3 w-3" />
                      AI Summary
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportPDF(selectedNotation.id)}
                      disabled={saving}
                      className="flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="ai-summary">AI Summary</TabsTrigger>
                    <TabsTrigger value="metadata">Metadata</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="mt-4">
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedNotation.content }}
                    />
                  </TabsContent>
                  
                  <TabsContent value="ai-summary" className="mt-4">
                    {selectedNotation.aiSummary ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Brain className="h-4 w-4" />
                            AI Generated Summary
                          </h4>
                          <p>{selectedNotation.aiSummary}</p>
                        </div>
                        
                        {selectedNotation.aiTags && selectedNotation.aiTags.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">AI Suggested Tags</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedNotation.aiTags.map(tag => (
                                <Badge key={tag} variant="outline">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Brain className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p>No AI summary available</p>
                        <Button 
                          className="mt-2"
                          onClick={() => handleGenerateAISummary(selectedNotation.id)}
                          disabled={saving}
                        >
                          Generate AI Summary
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="metadata" className="mt-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Created</label>
                          <p>{new Date(selectedNotation.createdAt).toLocaleString()}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Last Updated</label>
                          <p>{new Date(selectedNotation.updatedAt).toLocaleString()}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Version</label>
                          <p>{selectedNotation.version}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Collaborators</label>
                          <p className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {selectedNotation.collaborators.length}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">Tags</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedNotation.tags.map(tag => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <CheckCircle className={`h-4 w-4 ${selectedNotation.isPublic ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className="text-sm">{selectedNotation.isPublic ? 'Public' : 'Private'}</span>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                <NotebookPen className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No notation selected</h3>
                <p className="text-gray-500 mb-4">Select a notation from the list or create a new one</p>
                <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Notation
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotationClient;