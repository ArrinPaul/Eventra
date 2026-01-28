'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, MessageCircle, TrendingUp, Plus, Heart, Share2, 
  Bookmark, Image as ImageIcon, Video, Link, MapPin, 
  Calendar, MoreHorizontal, Send, Globe, UserPlus, 
  TrendingUp as Trending, Lock, Share, Hash, Repeat2,
  Search, Loader2, Trash2
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { feedService } from '@/lib/firestore-services';
import { FeedPost } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Types
interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentId?: string;
  likes: number;
  createdAt: Date;
  likedBy: string[];
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

// Mock Data (Keep for user profiles and comments for now, or fetch them too later)
const mockUsers: Record<string, User> = {
  '1': { id: '1', name: 'Sarah Johnson', email: 'sarah@example.com', avatar: '', isOnline: true, lastSeen: new Date() },
  '2': { id: '2', name: 'Mike Chen', email: 'mike@example.com', avatar: '', isOnline: false, lastSeen: new Date(Date.now() - 1000 * 60 * 30) },
  '3': { id: '3', name: 'Emily Davis', email: 'emily@example.com', avatar: '', isOnline: true, lastSeen: new Date() },
  '4': { id: '4', name: 'Alex Rivera', email: 'alex@example.com', avatar: '', isOnline: true, lastSeen: new Date() },
  'user-4': { id: 'user-4', name: 'David Wilson', email: 'david@example.com', isOnline: false },
  'organizer-1': { id: 'organizer-1', name: 'Event Organizer', email: 'organizer@eventos.com', isOnline: true },
  'sarah_chen': { id: 'sarah_chen', name: 'Dr. Sarah Chen', email: 'sarah@example.com', isOnline: true },
};

const mockComments: { [postId: string]: Comment[] } = {
  '1': [
    {
      id: '1',
      postId: '1',
      authorId: '2',
      content: 'Congratulations! This is huge news. Looking forward to seeing what you build next.',
      likes: 3,
      createdAt: new Date('2024-10-09T15:00:00'),
      likedBy: ['1', '3']
    }
  ]
};

const trendingTopics = [
  { tag: 'AIEthics', posts: 45 },
  { tag: 'Startup', posts: 32 },
  { tag: 'Networking', posts: 28 },
  { tag: 'EventOS', posts: 67 },
  { tag: 'TechTrends', posts: 23 },
];

export default function FeedClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>(mockComments);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'following' | 'trending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Create post form
  const [newPost, setNewPost] = useState({
    content: '',
    type: 'text' as FeedPost['type'],
    tags: '',
    location: '',
    visibility: 'public' as 'public' | 'private',
    mediaUrls: [] as string[]
  });

  const getUser = (userId: string) => {
    // In a real app, we would fetch user profile from Firestore or a users cache
    // For now, fallback to current user if it matches, or mockUsers
    if (user && userId === user.uid) {
      return { 
        id: user.uid, 
        name: user.displayName || 'Me', 
        email: user.email || '', 
        avatar: user.avatar || '', 
        isOnline: true 
      };
    }
    return mockUsers[userId] || { id: userId, name: 'Unknown User', email: '', isOnline: false };
  };
  
  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

  // Fetch posts on mount
  useEffect(() => {
    const fetchPosts = async () => {
      setInitialLoading(true);
      try {
        const fetchedPosts = await feedService.getFeedPosts();
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast({
          title: 'Error',
          description: 'Failed to load feed posts. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setInitialLoading(false);
      }
    };

    fetchPosts();
  }, [toast]);

  const handleLikePost = async (postId: string) => {
    if (!user) {
      toast({
         title: 'Sign in required',
         description: 'Please sign in to like posts.',
         variant: 'default',
      });
      return;
    }

    try {
      // Optimistic update
      setPosts(prev => prev.map(post => {
        if (post.id !== postId) return post;
        
        const hasLiked = post.likedBy?.includes(user.uid);
        const newLikes = hasLiked ? Math.max(0, post.likes - 1) : post.likes + 1;
        const newLikedBy = hasLiked 
          ? (post.likedBy || []).filter(id => id !== user.uid)
          : [...(post.likedBy || []), user.uid];

        return {
          ...post,
          likes: newLikes,
          likedBy: newLikedBy
        };
      }));

      await feedService.likePost(postId, user.uid);
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert on error (could implement more robust rollback)
      toast({
        title: 'Error',
        description: 'Failed to update like.',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await feedService.deleteFeedPost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast({
        title: 'Success',
        description: 'Post deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete post.',
        variant: 'destructive',
      });
    }
  };

  const handleSharePost = async (postId: string) => {
    if (!user) return;
    // Implement share logic later
    toast({
        title: 'Coming Soon',
        description: 'Sharing functionality is under development.',
    });
  };

  const handleCreatePost = async () => {
    if (!user || !newPost.content.trim()) return;

    setLoading(true);
    try {
      const postData: Omit<FeedPost, 'id'> = {
        authorId: user.uid,
        content: newPost.content,
        type: newPost.type as any, // Cast to any if strict string types mismatch with input
        mediaUrls: newPost.mediaUrls,
        likes: 0,
        comments: 0,
        shares: 0,
        reposts: 0,
        replies: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        likedBy: [],
        repostedBy: [],
        tags: newPost.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        visibility: newPost.visibility as any,
        location: newPost.location || undefined,
        mentions: []
      };

      const newPostId = await feedService.createFeedPost(postData);
      
      const createdPost: FeedPost = {
        id: newPostId,
        ...postData
      };

      setPosts(prev => [createdPost, ...prev]);
      setShowCreatePost(false);
      setNewPost({
        content: '',
        type: 'text',
        tags: '',
        location: '',
        visibility: 'public',
        mediaUrls: []
      });
      
      toast({
        title: 'Success',
        description: 'Post created successfully!',
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to create post.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user || !newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      postId,
      authorId: user.uid,
      content: newComment.trim(),
      likes: 0,
      createdAt: new Date(),
      likedBy: []
    };

    setComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), comment]
    }));

    setPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, comments: post.comments + 1 } : post
    ));

    setNewComment('');
  };

  const filteredPosts = posts.filter(post => {
    if (searchTerm) {
      return (
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (activeTab === 'trending') {
        return post.likes + post.comments + post.shares > 20;
    }

    return true;
  }).sort((a, b) => {
    if (activeTab === 'trending') {
      const aScore = a.likes + a.comments * 2 + a.shares * 3;
      const bScore = b.likes + b.comments * 2 + b.shares * 3;
      return bScore - aScore;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const formatContent = (content: string) => {
    return content
        .replace(/(#[\[\w\]]+)/g, '<span class="text-blue-600 font-medium">$1</span>')
        .replace(/(@[\w]+)/g, '<span class="text-blue-600 font-medium">$1</span>');
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2">
          {/* Header & Create Post Trigger */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Avatar>
                  <AvatarFallback>{user?.displayName ? getInitials(user.displayName) : 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-muted-foreground"
                    onClick={() => setShowCreatePost(true)}
                  >
                    What's happening?
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <div className="mb-6 flex gap-4">
             <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList>
                    <TabsTrigger value="all">For You</TabsTrigger>
                    <TabsTrigger value="trending">Trending</TabsTrigger>
                    <TabsTrigger value="following">Following</TabsTrigger>
                </TabsList>
              </Tabs>
          </div>

          {/* Posts List */}
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              const author = getUser(post.authorId);
              const postComments = comments[post.id] || [];
              const hasLiked = user ? post.likedBy.includes(user.uid) : false;
              const hasReposted = user ? post.repostedBy.includes(user.uid) : false;

              return (
                <Card key={post.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={cn(
                          post.authorId.includes('organizer') && "bg-primary text-primary-foreground"
                        )}>
                          {author?.name ? getInitials(author.name) : "U"}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{author?.name || "Unknown User"}</h3>
                          {post.authorId.includes('organizer') && (
                            <Badge variant="default" className="text-xs">Organizer</Badge>
                          )}
                          <span className="text-muted-foreground text-sm">
                            {formatTime(post.createdAt)}
                          </span>
                          
                          {user && user.uid === post.authorId && (
                            <div className="ml-auto">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    className="text-red-600 cursor-pointer"
                                    onClick={() => handleDeletePost(post.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </div>
                        
                        <div 
                          className="mb-4 text-foreground text-sm whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
                        />

                        {/* Media Rendering */}
                        {post.mediaUrls.length > 0 && (
                            <div className="mb-3">
                            {post.type === 'image' && (
                                <div className="grid gap-2 rounded-lg overflow-hidden">
                                {post.mediaUrls.map((url, index) => (
                                    <img 
                                    key={index}
                                    src={url}
                                    alt="Post media"
                                    className="w-full max-h-80 object-cover"
                                    />
                                ))}
                                </div>
                            )}
                            </div>
                        )}
                        
                        {/* Event Link */}
                        {post.eventId && (
                          <Card className="mb-4 bg-muted/50">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Related Event</span>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-6">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn("flex items-center gap-2", hasLiked && "text-red-500")}
                              onClick={() => handleLikePost(post.id)}
                            >
                              <Heart className={cn("h-4 w-4", hasLiked && "fill-current")}/>
                              {post.likes}
                            </Button>
                            
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="flex items-center gap-2"
                                onClick={() => setShowComments(showComments === post.id ? null : post.id)}
                            >
                              <MessageCircle className="h-4 w-4" />
                              {post.comments}
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn("flex items-center gap-2", hasReposted && "text-green-500")}
                              onClick={() => handleSharePost(post.id)}
                            >
                              <Repeat2 className="h-4 w-4" />
                              {post.reposts}
                            </Button>
                            
                            <Button variant="ghost" size="sm" className="flex items-center gap-2">
                              <Share className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Comments Section */}
                        {showComments === post.id && (
                            <div className="mt-4 pt-4 border-t space-y-4">
                                {user && (
                                <div className="flex gap-3">
                                    <Avatar className="w-8 h-8">
                                    <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                                        {user.displayName ? getInitials(user.displayName) : 'U'}
                                    </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 flex gap-2">
                                    <Input
                                        placeholder="Write a comment..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                    />
                                    <Button 
                                        size="sm" 
                                        onClick={() => handleAddComment(post.id)}
                                        disabled={!newComment.trim()}
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                    </div>
                                </div>
                                )}
                                <div className="space-y-3">
                                    {postComments.map(comment => {
                                        const commentAuthor = getUser(comment.authorId);
                                        return (
                                            <div key={comment.id} className="flex gap-3">
                                                <Avatar className="w-8 h-8">
                                                    <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                                                        {commentAuthor?.name ? getInitials(commentAuthor.name) : 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="bg-gray-100 rounded-lg px-3 py-2">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-sm font-medium">{commentAuthor?.name || "Unknown"}</span>
                                                            <span className="text-xs text-gray-500">{formatTime(comment.createdAt)}</span>
                                                        </div>
                                                        <p className="text-sm">{comment.content}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 hidden lg:block">
          {/* Trending Topics */}
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Trending Topics
              </h3>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-3">
                {trendingTopics.map((topic, index) => (
                  <div
                    key={topic.tag}
                    className="px-4 py-2 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          #{index + 1} trending
                        </div>
                        <div className="font-medium">#{topic.tag}</div>
                        <div className="text-sm text-muted-foreground">
                          {topic.posts} posts
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold">Quick Actions</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Hash className="h-4 w-4 mr-2" />
                Start Hashtag
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <MapPin className="h-4 w-4 mr-2" />
                Check In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Post Dialog */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
            <DialogDescription>Share updates with your community</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
                placeholder="What's happening?"
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
            />
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Tags</label>
                    <Input 
                        placeholder="networking, ai (comma separated)"
                        value={newPost.tags}
                        onChange={(e) => setNewPost(prev => ({ ...prev, tags: e.target.value }))}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <Input 
                        placeholder="Where are you?"
                        value={newPost.location}
                        onChange={(e) => setNewPost(prev => ({ ...prev, location: e.target.value }))}
                    />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setNewPost(prev => ({ ...prev, type: 'image' }))}>
                    <ImageIcon className="h-4 w-4 mr-2" /> Image
                </Button>
                <Button variant="outline" size="sm" onClick={() => setNewPost(prev => ({ ...prev, type: 'video' }))}>
                    <Video className="h-4 w-4 mr-2" /> Video
                </Button>
                <Button variant="outline" size="sm" onClick={() => setNewPost(prev => ({ ...prev, type: 'poll' }))}>
                    <MoreHorizontal className="h-4 w-4 mr-2" /> Poll
                </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePost(false)}>Cancel</Button>
            <Button onClick={handleCreatePost} disabled={loading || !newPost.content.trim()}>
                {loading ? 'Posting...' : 'Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
