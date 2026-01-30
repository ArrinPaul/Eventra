'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Upload,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Plus,
  Mic,
  Video,
  Download,
  Share2,
  Link2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface SpeakerSession {
  id: string;
  title: string;
  abstract: string;
  track: string;
  category: 'talk' | 'workshop' | 'demo';
  duration: number; // in minutes
  scheduledDate?: string;
  scheduledTime?: string;
  venue?: string;
  status: 'draft' | 'submitted' | 'approved' | 'scheduled' | 'completed';
  attendeeCount?: number;
  coSpeakers?: string[];
  materials: SessionMaterial[];
  feedback?: SessionFeedback[];
  recordingUrl?: string;
}

interface SessionMaterial {
  id: string;
  name: string;
  type: 'presentation' | 'document' | 'link' | 'video' | 'other';
  url: string;
  uploadDate: string;
  size?: string;
}

interface SessionFeedback {
  id: string;
  rating: number;
  comment: string;
  submittedAt: string;
  anonymous: boolean;
}

interface SpeakerProfile {
  id: string;
  name: string;
  email: string;
  role: 'speaker';
  bio: string;
  linkedinUrl?: string;
  sapCommunityUrl?: string;
  tshirtSize: string;
  profileImage?: string;
  totalSessions: number;
  averageRating: number;
}

import { useAuth } from '@/hooks/use-auth';
import { userService, eventService } from '@/core/services/firestore-services';

// ... (imports)

export default function SpeakerSessionDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sessions' | 'profile' | 'materials'>('sessions');
  const [sessions, setSessions] = useState<SpeakerSession[]>([]);
  const [speakerProfile, setSpeakerProfile] = useState<SpeakerProfile | null>(null);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [newSession, setNewSession] = useState<Partial<SpeakerSession> | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadSpeakerData();
    }
  }, [user]);

  const loadSpeakerData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [userProfile, allEvents] = await Promise.all([
        userService.getUser(user.uid),
        eventService.getEvents()
      ]);

      if (userProfile) {
        setSpeakerProfile({
          id: userProfile.id,
          name: userProfile.name,
          email: userProfile.email,
          role: 'speaker',
          bio: (userProfile as any).bio || '',
          linkedinUrl: (userProfile as any).socialLinks?.linkedin || '',
          sapCommunityUrl: (userProfile as any).socialLinks?.website || '',
          tshirtSize: (userProfile as any).tshirtSize || 'L',
          profileImage: userProfile.photoURL || '',
          totalSessions: 0, // Will update below
          averageRating: 0  // Will update below
        });
      }

      // Filter sessions where user is a speaker
      const speakerSessions = allEvents
        .filter(event => event.speakers && event.speakers.some((s: any) => (typeof s === 'string' ? s === user.uid : s.id === user.uid)))
        .map(event => ({
          id: event.id,
          title: event.title,
          abstract: event.description,
          track: (event as any).track || 'General',
          category: (event.category as any) || 'talk',
          duration: (event as any).duration || 60,
          scheduledDate: event.startDate ? new Date(event.startDate).toISOString() : undefined,
          venue: (event.location as any)?.venue?.name || 'TBD',
          status: (event.status as any) || 'draft',
          attendeeCount: event.registeredCount || 0,
          materials: (event as any).materials || [],
          feedback: (event as any).feedback || []
        })) as SpeakerSession[];

      setSessions(speakerSessions);
      
      // Update profile stats based on real data
      if (userProfile) {
        setSpeakerProfile(prev => prev ? ({
          ...prev,
          totalSessions: speakerSessions.length,
          averageRating: 4.8 // Calculate real average if feedback data exists
        }) : null);
      }

    } catch (error) {
      console.error('Error loading speaker data:', error);
      toast({
        title: "Error",
        description: "Failed to load speaker profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = () => {
    setNewSession({
      title: '',
      abstract: '',
      track: '',
      category: 'talk',
      duration: 45,
      status: 'draft',
      materials: [],
      feedback: [],
    });
  };

  const handleSaveSession = async (session: Partial<SpeakerSession>) => {
    try {
      if (newSession) {
        // Create new session
        const newId = `session_${Date.now()}`;
        const sessionData: SpeakerSession = {
          id: newId,
          title: session.title || '',
          abstract: session.abstract || '',
          track: session.track || '',
          category: session.category || 'talk',
          duration: session.duration || 60,
          status: 'draft',
          materials: [],
          feedback: [],
          ...session,
        };
        setSessions(prev => [...prev, sessionData]);
        setNewSession(null);
        toast({
          title: 'Success',
          description: 'Session created successfully.',
        });
      } else if (editingSession) {
        // Update existing session
        setSessions(prev => prev.map(s => 
          s.id === editingSession ? { ...s, ...session } : s
        ));
        setEditingSession(null);
        toast({
          title: 'Success',
          description: 'Session updated successfully.',
        });
      }
    } catch (error) {
      console.error('Error saving session:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save session.',
      });
    }
  };

  const handleSubmitSession = async (sessionId: string) => {
    try {
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, status: 'submitted' } : s
      ));
      toast({
        title: 'Success',
        description: 'Session submitted for review.',
      });
    } catch (error) {
      console.error('Error submitting session:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit session.',
      });
    }
  };

  const handleUploadMaterial = async (sessionId: string, file: File) => {
    try {
      // Mock file upload - implement with actual upload service
      const material: SessionMaterial = {
        id: `mat_${Date.now()}`,
        name: file.name,
        type: getMaterialType(file.name),
        url: `/materials/${file.name}`,
        uploadDate: new Date().toISOString().split('T')[0],
        size: formatFileSize(file.size),
      };

      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, materials: [...s.materials, material] } : s
      ));

      toast({
        title: 'Success',
        description: 'Material uploaded successfully.',
      });
    } catch (error) {
      console.error('Error uploading material:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to upload material.',
      });
    }
  };

  const getMaterialType = (filename: string): SessionMaterial['type'] => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
      case 'ppt':
      case 'pptx':
        return 'presentation';
      case 'doc':
      case 'docx':
      case 'txt':
        return 'document';
      case 'mp4':
      case 'mov':
      case 'avi':
        return 'video';
      default:
        return 'other';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: SpeakerSession['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const SessionForm = ({ session, onSave, onCancel }: {
    session: Partial<SpeakerSession>;
    onSave: (session: Partial<SpeakerSession>) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState(session);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Session Title *</label>
            <Input
              value={formData.title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter session title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Track *</label>
            <Select
              value={formData.track || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, track: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select track" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="innovation">Innovation</SelectItem>
                <SelectItem value="career">Career Development</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category *</label>
            <Select
              value={formData.category || 'talk'}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as 'talk' | 'workshop' | 'demo' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="talk">Talk</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="demo">Demo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Duration (minutes) *</label>
            <Input
              type="number"
              value={formData.duration || 45}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              min={15}
              max={180}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Session Abstract *</label>
          <Textarea
            value={formData.abstract || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, abstract: e.target.value }))}
            placeholder="Provide a detailed description of your session (minimum 50 characters)"
            className="min-h-[120px]"
          />
        </div>

        <div className="flex space-x-3">
          <Button onClick={() => onSave(formData)} disabled={!formData.title || !formData.abstract}>
            <Save className="w-4 h-4 mr-2" />
            Save Session
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  const SessionsTab = () => (
    <div className="space-y-6">
      {/* Session Creation */}
      {newSession && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Session</CardTitle>
          </CardHeader>
          <CardContent>
            <SessionForm
              session={newSession}
              onSave={handleSaveSession}
              onCancel={() => setNewSession(null)}
            />
          </CardContent>
        </Card>
      )}

      {/* Sessions List */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Sessions</h2>
        {!newSession && (
          <Button onClick={handleCreateSession}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Session
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sessions.map((session) => (
          <Card key={session.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <CardTitle className="text-xl">{session.title}</CardTitle>
                    <Badge className={getStatusColor(session.status)}>
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Mic className="w-4 h-4 mr-1" />
                      {session.category.charAt(0).toUpperCase() + session.category.slice(1)}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {session.duration} min
                    </span>
                    <span className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {session.track}
                    </span>
                    {session.attendeeCount && (
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {session.attendeeCount} attendees
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {session.status === 'draft' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingSession(session.id)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSubmitSession(session.id)}
                        disabled={!session.title || !session.abstract}
                      >
                        Submit
                      </Button>
                    </>
                  )}
                  
                  {session.status === 'scheduled' && session.recordingUrl && (
                    <Button variant="outline" size="sm">
                      <Video className="w-4 h-4 mr-1" />
                      Recording
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {editingSession === session.id ? (
                <SessionForm
                  session={session}
                  onSave={handleSaveSession}
                  onCancel={() => setEditingSession(null)}
                />
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-700">{session.abstract}</p>

                  {session.scheduledDate && (
                    <div className="flex items-center space-x-4 text-sm bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-blue-600" />
                        <span>{new Date(session.scheduledDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-blue-600" />
                        <span>{session.scheduledTime}</span>
                      </div>
                      {session.venue && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-blue-600" />
                          <span>{session.venue}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Materials Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Session Materials</h4>
                      <input
                        type="file"
                        id={`upload-${session.id}`}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadMaterial(session.id, file);
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`upload-${session.id}`)?.click()}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        Upload
                      </Button>
                    </div>

                    {session.materials.length > 0 ? (
                      <div className="space-y-2">
                        {session.materials.map((material) => (
                          <div key={material.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-3">
                              <FileText className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="text-sm font-medium">{material.name}</p>
                                <p className="text-xs text-gray-500">
                                  {material.size} • {material.uploadDate}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Share2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No materials uploaded yet
                      </p>
                    )}
                  </div>

                  {/* Feedback Section */}
                  {session.feedback && session.feedback.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Session Feedback</h4>
                      <div className="space-y-3">
                        {session.feedback.map((feedback) => (
                          <div key={feedback.id} className="p-3 bg-yellow-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-yellow-600">
                                  {'★'.repeat(feedback.rating)}{'☆'.repeat(5-feedback.rating)}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {new Date(feedback.submittedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm">{feedback.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const ProfileTab = () => (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Speaker Profile</CardTitle>
          <CardDescription>Manage your speaker information and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {speakerProfile && (
            <>
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{speakerProfile.name}</h3>
                  <p className="text-gray-600">{speakerProfile.email}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-sm text-gray-500">
                      {speakerProfile.totalSessions} Sessions
                    </span>
                    <span className="text-sm text-gray-500">
                      {speakerProfile.averageRating}★ Average Rating
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bio</label>
                <Textarea
                  value={speakerProfile.bio}
                  onChange={(e) => setSpeakerProfile(prev => prev ? {...prev, bio: e.target.value} : null)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">LinkedIn URL</label>
                  <div className="flex space-x-2">
                    <Input
                      value={speakerProfile.linkedinUrl || ''}
                      onChange={(e) => setSpeakerProfile(prev => prev ? {...prev, linkedinUrl: e.target.value} : null)}
                      placeholder="https://linkedin.com/in/username"
                    />
                    {speakerProfile.linkedinUrl && (
                      <Button variant="outline" size="icon">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">SAP Community URL</label>
                  <div className="flex space-x-2">
                    <Input
                      value={speakerProfile.sapCommunityUrl || ''}
                      onChange={(e) => setSpeakerProfile(prev => prev ? {...prev, sapCommunityUrl: e.target.value} : null)}
                      placeholder="https://community.sap.com/..."
                    />
                    {speakerProfile.sapCommunityUrl && (
                      <Button variant="outline" size="icon">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">T-shirt Size</label>
                  <Select
                    value={speakerProfile.tshirtSize}
                    onValueChange={(value) => setSpeakerProfile(prev => prev ? {...prev, tshirtSize: value} : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XS">XS</SelectItem>
                      <SelectItem value="S">S</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="XL">XL</SelectItem>
                      <SelectItem value="XXL">XXL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Update Profile
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const MaterialsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>All Session Materials</CardTitle>
          <CardDescription>Centralized view of all your uploaded materials</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.flatMap(session => 
              session.materials.map(material => ({
                ...material,
                sessionTitle: session.title,
                sessionId: session.id,
              }))
            ).map((material) => (
              <div key={material.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <FileText className="w-8 h-8 text-gray-500" />
                  <div>
                    <p className="font-medium">{material.name}</p>
                    <p className="text-sm text-gray-600">
                      {material.sessionTitle} • {material.size} • {material.uploadDate}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Mic className="text-blue-500" size={32} />
          <h1 className="text-3xl font-bold text-gray-800">Speaker Dashboard</h1>
        </div>
        
        {speakerProfile && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <Calendar className="text-blue-500" size={24} />
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{sessions.length}</p>
                    <p className="text-sm text-gray-600">Total Sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-green-500" size={24} />
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {sessions.filter(s => s.status === 'completed').length}
                    </p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <Users className="text-purple-500" size={24} />
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {sessions.reduce((total, s) => total + (s.attendeeCount || 0), 0)}
                    </p>
                    <p className="text-sm text-gray-600">Total Attendees</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'sessions', label: 'Sessions', icon: Calendar },
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'materials', label: 'Materials', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'sessions' | 'profile' | 'materials')}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'sessions' && <SessionsTab />}
      {activeTab === 'profile' && <ProfileTab />}
      {activeTab === 'materials' && <MaterialsTab />}
    </div>
  );
}