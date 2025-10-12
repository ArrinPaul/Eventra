'use client';/**/**/**'use client';



export default function FeedClient() { * Feed Client Component

  return (

    <div className="p-8"> * Social feed and community interaction * Feed Client Component

      <h1 className="text-2xl font-bold">Feed - Coming Soon</h1>

      <p>Community feed functionality is being developed.</p> */

    </div>

  ); * Social feed for events and community interaction * Feed Client Component

}
'use client';

 */

import React from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; * Simple placeholder for the social feed functionalityimport React, { useState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';'use client';

import { Users, MessageCircle, TrendingUp, Plus } from 'lucide-react';

 */import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FeedClient() {

  return (import React from 'react';

    <div className="container mx-auto px-4 py-8 max-w-6xl">

      <div className="flex items-center justify-between mb-8">import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';import { Button } from '@/components/ui/button';

        <div>

          <h1 className="text-3xl font-bold">Community Feed</h1>import { Button } from '@/components/ui/button';

          <p className="text-muted-foreground mt-2">

            Stay connected with your event communityimport { Badge } from '@/components/ui/badge';'use client';import { Input } from '@/components/ui/input';

          </p>

        </div>import { Users, MessageCircle, TrendingUp, Plus } from 'lucide-react';

        <Badge variant="secondary">Coming Soon</Badge>

      </div>import { Badge } from '@/components/ui/badge';



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">export default function FeedClient() {

        <div className="lg:col-span-2 space-y-6">

          <Card>  return (import React from 'react';import { Textarea } from '@/components/ui/textarea';

            <CardHeader>

              <div className="flex items-center space-x-2">    <div className="container mx-auto px-4 py-8 max-w-6xl">

                <Plus className="w-5 h-5 text-blue-500" />

                <CardTitle>Share Update</CardTitle>      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

              </div>

              <CardDescription>What's happening at your event?</CardDescription>        {/* Main Feed */}

            </CardHeader>

            <CardContent>        <div className="lg:col-span-2">import { Button } from '@/components/ui/button';import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

              <Button variant="outline" className="w-full" disabled>

                Create Post          <div className="flex items-center justify-between mb-6">

              </Button>

            </CardContent>            <div>import { Badge } from '@/components/ui/badge';import { Avatar, AvatarFallback } from '@/components/ui/avatar';

          </Card>

              <h2 className="text-2xl font-bold">Event Feed</h2>

          <div className="space-y-4">

            {[1, 2, 3].map((i) => (              <p className="text-muted-foreground">import { Users, MessageCircle, TrendingUp, Plus } from 'lucide-react';import { ScrollArea } from '@/components/ui/scroll-area';

              <Card key={i}>

                <CardContent className="p-6">                Stay updated with the latest from your events and community

                  <div className="flex gap-3">

                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">              </p>import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

                      <Users className="w-5 h-5 text-muted-foreground" />

                    </div>            </div>

                    <div className="flex-1">

                      <h4 className="font-semibold mb-2">Sample Post {i}</h4>            <Badge variant="secondary">Coming Soon</Badge>export default function FeedClient() {import { 

                      <p className="text-muted-foreground mb-4">

                        This is a placeholder for community posts and updates.          </div>

                      </p>

                      <div className="flex items-center gap-4 text-sm">  return (  Heart, 

                        <Button variant="ghost" size="sm" disabled>

                          <MessageCircle className="w-4 h-4 mr-1" />          <Card className="mb-6">

                          0

                        </Button>            <CardHeader>    <div className="container mx-auto px-4 py-8 max-w-6xl">  MessageCircle, 

                        <Button variant="ghost" size="sm" disabled>

                          <TrendingUp className="w-4 h-4 mr-1" />              <div className="flex items-center space-x-2">

                          0

                        </Button>                <Plus className="w-5 h-5 text-blue-500" />      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">  Share2, 

                      </div>

                    </div>                <CardTitle className="text-lg">Create Post</CardTitle>

                  </div>

                </CardContent>              </div>        {/* Main Feed */}  Bookmark, 

              </Card>

            ))}              <CardDescription>

          </div>

        </div>                Share updates and connect with attendees        <div className="lg:col-span-2">  Plus, 



        <div className="space-y-6">              </CardDescription>

          <Card>

            <CardHeader>            </CardHeader>          <div className="flex items-center justify-between mb-6">  Image as ImageIcon, 

              <CardTitle>Trending</CardTitle>

            </CardHeader>            <CardContent>

            <CardContent>

              <p className="text-sm text-muted-foreground text-center py-4">              <p className="text-sm text-muted-foreground mb-4">            <div>  Video,

                Trending topics will appear here

              </p>                Create and share posts about events, updates, and networking opportunities.

            </CardContent>

          </Card>              </p>              <h2 className="text-2xl font-bold">Event Feed</h2>  Link,

        </div>

      </div>              <Button variant="outline" className="w-full" disabled>

    </div>

  );                What's happening?              <p className="text-muted-foreground">  MapPin,

}
              </Button>

            </CardContent>                Stay updated with the latest from your events and community  Calendar,

          </Card>

              </p>  Users,

          <div className="space-y-4">

            {[1, 2, 3].map((i) => (            </div>  Trending,

              <Card key={i}>

                <CardContent className="p-6">            <Badge variant="secondary">Coming Soon</Badge>  Clock,

                  <div className="flex gap-3">

                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">          </div>  Filter,

                      <Users className="w-5 h-5 text-muted-foreground" />

                    </div>  Search,

                    <div className="flex-1">

                      <div className="flex items-center gap-2 mb-2">          <Card className="mb-6">  MoreHorizontal,

                        <h4 className="font-semibold">Sample User {i}</h4>

                        <span className="text-sm text-muted-foreground">2h</span>            <CardHeader>  ThumbsUp,

                      </div>

                      <p className="text-muted-foreground mb-4">              <div className="flex items-center space-x-2">  ThumbsDown,

                        This is a placeholder for a social media post. The feed functionality is being developed.

                      </p>                <Plus className="w-5 h-5 text-blue-500" />  Repeat2,

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">

                        <Button variant="ghost" size="sm" disabled>                <CardTitle className="text-lg">Create Post</CardTitle>  Eye,

                          <MessageCircle className="w-4 h-4 mr-1" />

                          0              </div>  Flag,

                        </Button>

                        <Button variant="ghost" size="sm" disabled>              <CardDescription>  Edit,

                          <TrendingUp className="w-4 h-4 mr-1" />

                          0                Share updates and connect with attendees  Trash2,

                        </Button>

                      </div>              </CardDescription>  Send,

                    </div>

                  </div>            </CardHeader>  Smile,

                </CardContent>

              </Card>            <CardContent>  AtSign,

            ))}

          </div>              <p className="text-sm text-muted-foreground mb-4">  Hash,

        </div>

                Create and share posts about events, updates, and networking opportunities.  Globe,

        {/* Sidebar */}

        <div className="space-y-6">              </p>  Lock,

          <Card>

            <CardHeader>              <Button variant="outline" className="w-full" disabled>  UserPlus

              <CardTitle className="text-lg">Trending Topics</CardTitle>

            </CardHeader>                What's happening?} from 'lucide-react';

            <CardContent>

              <div className="space-y-3">              </Button>import { useAuth } from '@/hooks/use-auth';

                {['#IPXHub', '#EventTech', '#Networking'].map((tag) => (

                  <div key={tag} className="flex justify-between items-center">            </CardContent>import { FeedPost, Comment, Event, User } from '@/types';

                    <span className="font-medium">{tag}</span>

                    <span className="text-sm text-muted-foreground">0 posts</span>          </Card>

                  </div>

                ))}// Mock data

              </div>

            </CardContent>          <div className="space-y-4">const mockUsers: User[] = [

          </Card>

            {[1, 2, 3].map((i) => (  { id: '1', name: 'Sarah Johnson', email: 'sarah@example.com', avatar: '', isOnline: true, lastSeen: new Date() },

          <Card>

            <CardHeader>              <Card key={i}>  { id: '2', name: 'Mike Chen', email: 'mike@example.com', avatar: '', isOnline: false, lastSeen: new Date(Date.now() - 1000 * 60 * 30) },

              <CardTitle className="text-lg">Live Updates</CardTitle>

            </CardHeader>                <CardContent className="p-6">  { id: '3', name: 'Emily Davis', email: 'emily@example.com', avatar: '', isOnline: true, lastSeen: new Date() },

            <CardContent>

              <p className="text-sm text-muted-foreground">                  <div className="flex gap-3">  { id: '4', name: 'Alex Rivera', email: 'alex@example.com', avatar: '', isOnline: true, lastSeen: new Date() }

                Real-time event updates and notifications will appear here.

              </p>                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">];

            </CardContent>

          </Card>                      <Users className="w-5 h-5 text-muted-foreground" />

        </div>

      </div>                    </div>const mockPosts: FeedPost[] = [

    </div>

  );                    <div className="flex-1">  {

}
                      <div className="flex items-center gap-2 mb-2">    id: '1',

                        <h4 className="font-semibold">Sample User {i}</h4>    authorId: '1',

                        <span className="text-sm text-muted-foreground">2h</span>    content: 'Excited to announce that our AI startup just raised Series A! 🚀 The journey from idea to funding has been incredible. Can\'t wait to share what we\'ve been building with the world soon. Special thanks to all the mentors and advisors who believed in our vision from day one.',

                      </div>    type: 'text',

                      <p className="text-muted-foreground mb-4">    mediaUrls: [],

                        This is a placeholder for a social media post. The feed functionality is being developed and will include real-time updates, interactions, and event-related content.    likes: 47,

                      </p>    comments: 12,

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">    shares: 8,

                        <Button variant="ghost" size="sm" disabled>    createdAt: new Date('2024-10-09T14:30:00'),

                          <MessageCircle className="w-4 h-4 mr-1" />    updatedAt: new Date('2024-10-09T14:30:00'),

                          0    likedBy: ['2', '3', '4'],

                        </Button>    tags: ['startup', 'ai', 'funding'],

                        <Button variant="ghost" size="sm" disabled>    visibility: 'public',

                          <TrendingUp className="w-4 h-4 mr-1" />    eventId: undefined,

                          0    pollId: undefined,

                        </Button>    location: 'San Francisco, CA',

                      </div>    mentions: []

                    </div>  },

                  </div>  {

                </CardContent>    id: '2',

              </Card>    authorId: '2',

            ))}    content: 'Just wrapped up an amazing workshop on machine learning fundamentals. The engagement from attendees was incredible! Here are some key takeaways and resources for anyone interested in getting started with ML.',

          </div>    type: 'text',

        </div>    mediaUrls: ['https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=500'],

    likes: 23,

        {/* Sidebar */}    comments: 6,

        <div className="space-y-6">    shares: 15,

          <Card>    createdAt: new Date('2024-10-09T12:15:00'),

            <CardHeader>    updatedAt: new Date('2024-10-09T12:15:00'),

              <CardTitle className="text-lg">Trending Topics</CardTitle>    likedBy: ['1', '4'],

            </CardHeader>    tags: ['ml', 'workshop', 'education'],

            <CardContent>    visibility: 'public',

              <div className="space-y-3">    eventId: 'event1',

                {['#IPXHub', '#EventTech', '#Networking'].map((tag) => (    pollId: undefined,

                  <div key={tag} className="flex justify-between items-center">    location: undefined,

                    <span className="font-medium">{tag}</span>    mentions: []

                    <span className="text-sm text-muted-foreground">0 posts</span>  },

                  </div>  {

                ))}    id: '3',

              </div>    authorId: '3',

            </CardContent>    content: 'Poll: What\'s your biggest challenge in networking at tech events?',

          </Card>    type: 'poll',

    mediaUrls: [],

          <Card>    likes: 18,

            <CardHeader>    comments: 9,

              <CardTitle className="text-lg">Live Updates</CardTitle>    shares: 3,

            </CardHeader>    createdAt: new Date('2024-10-09T10:45:00'),

            <CardContent>    updatedAt: new Date('2024-10-09T10:45:00'),

              <p className="text-sm text-muted-foreground">    likedBy: ['1', '2'],

                Real-time event updates and notifications will appear here.    tags: ['networking', 'events'],

              </p>    visibility: 'public',

            </CardContent>    eventId: undefined,

          </Card>    pollId: 'poll1',

        </div>    location: undefined,

      </div>    mentions: []

    </div>  },

  );  {

}    id: '4',
    authorId: '4',
    content: 'Sharing some behind-the-scenes footage from our hackathon last weekend. The energy was incredible and the projects were mind-blowing! 🧠⚡',
    type: 'video',
    mediaUrls: ['https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'],
    likes: 34,
    comments: 8,
    shares: 12,
    createdAt: new Date('2024-10-08T18:20:00'),
    updatedAt: new Date('2024-10-08T18:20:00'),
    likedBy: ['1', '2', '3'],
    tags: ['hackathon', 'development'],
    visibility: 'public',
    eventId: undefined,
    pollId: undefined,
    location: 'Tech Hub Downtown',
    mentions: ['1', '2']
  }
];

const mockComments: { [postId: string]: Comment[] } = {
  '1': [
    {
      id: '1',
      postId: '1',
      authorId: '2',
      content: 'Congratulations! This is huge news. Looking forward to seeing what you build next.',
      parentId: undefined,
      likes: 3,
      createdAt: new Date('2024-10-09T15:00:00'),
      likedBy: ['1', '3']
    },
    {
      id: '2',
      postId: '1',
      authorId: '3',
      content: 'Amazing achievement! Your dedication really paid off.',
      parentId: undefined,
      likes: 1,
      createdAt: new Date('2024-10-09T15:30:00'),
      likedBy: ['1']
    }
  ],
  '2': [
    {
      id: '3',
      postId: '2',
      authorId: '4',
      content: 'Great session! The practical examples really helped solidify the concepts.',
      parentId: undefined,
      likes: 2,
      createdAt: new Date('2024-10-09T13:00:00'),
      likedBy: ['1', '2']
    }
  ]
};

export default function FeedClient() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>(mockPosts);
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>(mockComments);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'following' | 'trending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  // Create post form
  const [newPost, setNewPost] = useState({
    content: '',
    type: 'text' as FeedPost['type'],
    tags: '',
    location: '',
    visibility: 'public' as 'public' | 'private',
    mediaUrls: [] as string[]
  });

  const getUser = (userId: string) => mockUsers.find(u => u.id === userId);

  const handleLikePost = async (postId: string) => {
    if (!user) return;

    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      
      const hasLiked = post.likedBy.includes(user.id);
      return {
        ...post,
        likes: hasLiked ? post.likes - 1 : post.likes + 1,
        likedBy: hasLiked 
          ? post.likedBy.filter(id => id !== user.id)
          : [...post.likedBy, user.id]
      };
    }));
  };

  const handleSharePost = async (postId: string) => {
    if (!user) return;
    
    // In real app, implement sharing functionality
    setPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, shares: post.shares + 1 } : post
    ));
  };

  const handleCreatePost = async () => {
    if (!user || !newPost.content.trim()) return;

    setLoading(true);
    try {
      const post: FeedPost = {
        id: Date.now().toString(),
        authorId: user.id,
        content: newPost.content,
        type: newPost.type,
        mediaUrls: newPost.mediaUrls,
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        likedBy: [],
        tags: newPost.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        visibility: newPost.visibility,
        eventId: undefined,
        pollId: undefined,
        location: newPost.location || undefined,
        mentions: []
      };

      setPosts(prev => [post, ...prev]);
      setShowCreatePost(false);
      setNewPost({
        content: '',
        type: 'text',
        tags: '',
        location: '',
        visibility: 'public',
        mediaUrls: []
      });
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user || !newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      postId,
      authorId: user.id,
      content: newComment.trim(),
      parentId: undefined,
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
    
    switch (selectedFilter) {
      case 'following':
        // In real app, filter by followed users
        return true;
      case 'trending':
        // Sort by engagement
        return post.likes + post.comments + post.shares > 20;
      default:
        return true;
    }
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (selectedFilter === 'trending') {
      const aScore = a.likes + a.comments * 2 + a.shares * 3;
      const bScore = b.likes + b.comments * 2 + b.shares * 3;
      return bScore - aScore;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Feed</h1>
          <Button onClick={() => setShowCreatePost(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Post
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedFilter} onValueChange={(value: 'all' | 'following' | 'trending') => setSelectedFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>All Posts</span>
                </div>
              </SelectItem>
              <SelectItem value="following">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Following</span>
                </div>
              </SelectItem>
              <SelectItem value="trending">
                <div className="flex items-center gap-2">
                  <Trending className="w-4 h-4" />
                  <span>Trending</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {sortedPosts.map((post) => {
          const author = getUser(post.authorId);
          const postComments = comments[post.id] || [];
          const hasLiked = user ? post.likedBy.includes(user.id) : false;

          return (
            <Card key={post.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {author?.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{author?.name}</h4>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                      {post.visibility === 'private' && (
                        <Lock className="w-3 h-3 text-gray-500" />
                      )}
                    </div>
                    
                    {post.location && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <MapPin className="w-3 h-3" />
                        <span>{post.location}</span>
                      </div>
                    )}
                    
                    {post.eventId && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 mb-2">
                        <Calendar className="w-3 h-3" />
                        <span>Posted at an event</span>
                      </div>
                    )}
                  </div>
                  
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Content */}
                <div className="mb-4">
                  <p className="text-sm whitespace-pre-wrap mb-3">{post.content}</p>
                  
                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Media */}
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
                      {post.type === 'video' && (
                        <video 
                          controls 
                          className="w-full max-h-80 rounded-lg"
                          src={post.mediaUrls[0]}
                        />
                      )}
                    </div>
                  )}

                  {/* Poll */}
                  {post.type === 'poll' && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-3">Poll: {post.content}</h4>
                      <div className="space-y-2">
                        <div className="cursor-pointer hover:bg-gray-100 p-2 rounded">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm">Finding time to network</span>
                            <span className="text-sm text-gray-500">45%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }} />
                          </div>
                        </div>
                        <div className="cursor-pointer hover:bg-gray-100 p-2 rounded">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm">Starting conversations</span>
                            <span className="text-sm text-gray-500">35%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '35%' }} />
                          </div>
                        </div>
                        <div className="cursor-pointer hover:bg-gray-100 p-2 rounded">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm">Following up</span>
                            <span className="text-sm text-gray-500">20%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '20%' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Engagement Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <span>{post.likes} likes</span>
                  <span>{post.comments} comments</span>
                  <span>{post.shares} shares</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={hasLiked ? 'text-red-600' : 'text-gray-600'}
                      onClick={() => handleLikePost(post.id)}
                    >
                      <Heart className={`w-4 h-4 mr-1 ${hasLiked ? 'fill-current' : ''}`} />
                      <span>Like</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowComments(showComments === post.id ? null : post.id)}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      <span>Comment</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSharePost(post.id)}
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      <span>Share</span>
                    </Button>
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    <Bookmark className="w-4 h-4" />
                  </Button>
                </div>

                {/* Comments Section */}
                {showComments === post.id && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    {/* Comment Input */}
                    {user && (
                      <div className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                            {user.name.split(' ').map(n => n[0]).join('')}
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

                    {/* Comments */}
                    <div className="space-y-3">
                      {postComments.map((comment) => {
                        const commentAuthor = getUser(comment.authorId);
                        return (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                                {commentAuthor?.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-gray-100 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium">{commentAuthor?.name}</span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm">{comment.content}</p>
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                                <button className="hover:text-blue-600">Like ({comment.likes})</button>
                                <button className="hover:text-blue-600">Reply</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Post Dialog */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
            <DialogDescription>
              Share your thoughts, updates, or media with the community
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="text" onClick={() => setNewPost(prev => ({ ...prev, type: 'text' }))}>
                  Text
                </TabsTrigger>
                <TabsTrigger value="image" onClick={() => setNewPost(prev => ({ ...prev, type: 'image' }))}>
                  Image
                </TabsTrigger>
                <TabsTrigger value="video" onClick={() => setNewPost(prev => ({ ...prev, type: 'video' }))}>
                  Video
                </TabsTrigger>
                <TabsTrigger value="poll" onClick={() => setNewPost(prev => ({ ...prev, type: 'poll' }))}>
                  Poll
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4">
                <Textarea
                  placeholder="What's on your mind?"
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                />
              </TabsContent>

              <TabsContent value="image" className="space-y-4">
                <Textarea
                  placeholder="Share a photo and tell us about it..."
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  rows={3}
                />
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Drag and drop images here, or click to select</p>
                  <Button variant="outline" size="sm">Select Images</Button>
                </div>
              </TabsContent>

              <TabsContent value="video" className="space-y-4">
                <Textarea
                  placeholder="Share a video and tell us about it..."
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  rows={3}
                />
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Upload a video file</p>
                  <Button variant="outline" size="sm">Select Video</Button>
                </div>
              </TabsContent>

              <TabsContent value="poll" className="space-y-4">
                <Input
                  placeholder="Ask a question..."
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                />
                <div className="space-y-2">
                  <Input placeholder="Option 1" />
                  <Input placeholder="Option 2" />
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Option
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <Input
                  placeholder="networking, ai, startup (comma separated)"
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Visibility</label>
              <Select 
                value={newPost.visibility} 
                onValueChange={(value: 'public' | 'private') => setNewPost(prev => ({ ...prev, visibility: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span>Public - Anyone can see</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      <span>Private - Only connections</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePost(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePost} disabled={loading || !newPost.content.trim()}>
              {loading ? 'Posting...' : 'Share Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
  'user-4': { id: 'user-4', name: 'David Wilson', email: 'david@example.com' } as User,
  'organizer-1': { id: 'organizer-1', name: 'Event Organizer', email: 'organizer@ipxhub.com' } as User,
  'sarah_chen': { id: 'sarah_chen', name: 'Dr. Sarah Chen', email: 'sarah@example.com' } as User,
};

const trendingTopics = [
  { tag: 'AIEthics', posts: 45 },
  { tag: 'Startup', posts: 32 },
  { tag: 'Networking', posts: 28 },
  { tag: 'IPXHub', posts: 67 },
  { tag: 'TechTrends', posts: 23 },
];

export default function FeedClient() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>(mockFeedPosts);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('for-you');

  const [newPost, setNewPost] = useState({
    content: '',
    type: 'text' as const,
  });

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      const feedPosts = await feedService.getFeedPosts();
      if (feedPosts.length > 0) {
        setPosts(feedPosts);
      }
    } catch (error) {
      console.error('Error loading feed:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.content.trim() || !user) return;

    // Extract hashtags and mentions
    const hashtags = (newPost.content.match(/#[\w]+/g) || []).map(tag => tag.slice(1));
    const mentions = (newPost.content.match(/@[\w]+/g) || []).map(mention => mention.slice(1));

    try {
      const postData: Omit<FeedPost, 'id'> = {
        authorId: user.id,
        content: newPost.content.trim(),
        type: newPost.type,
        hashtags,
        mentions,
        likes: 0,
        likedBy: [],
        reposts: 0,
        repostedBy: [],
        replies: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await feedService.createFeedPost(postData);
      setIsCreatePostOpen(false);
      setNewPost({ content: '', type: 'text' });
      loadFeed();
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      await feedService.likePost(postId, user.id);
      
      // Update local state
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const isLiked = post.likedBy.includes(user.id);
            return {
              ...post,
              likes: isLiked ? post.likes - 1 : post.likes + 1,
              likedBy: isLiked 
                ? post.likedBy.filter(id => id !== user.id)
                : [...post.likedBy, user.id]
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleRepost = (postId: string) => {
    if (!user) return;

    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          const isReposted = post.repostedBy.includes(user.id);
          return {
            ...post,
            reposts: isReposted ? post.reposts - 1 : post.reposts + 1,
            repostedBy: isReposted 
              ? post.repostedBy.filter(id => id !== user.id)
              : [...post.repostedBy, user.id]
          };
        }
        return post;
      })
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const renderHashtags = (content: string) => {
    return content.replace(/(#[\w]+)/g, '<span class="text-primary font-medium">$1</span>');
  };

  const renderMentions = (content: string) => {
    return content.replace(/(@[\w]+)/g, '<span class="text-secondary font-medium">$1</span>');
  };

  const formatContent = (content: string) => {
    let formatted = renderHashtags(content);
    formatted = renderMentions(formatted);
    return formatted;
  };

  const filteredPosts = posts.sort((a, b) => {
    if (activeTab === 'trending') {
      const aEngagement = a.likes + a.reposts + a.replies;
      const bEngagement = b.likes + b.reposts + b.replies;
      return bEngagement - aEngagement;
    } else if (activeTab === 'following') {
      // Filter posts from followed users (mock implementation)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    // For You tab - default chronological
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2">
          {/* Create Post */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Avatar>
                  <AvatarFallback>
                    {getInitials(user?.name || "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-muted-foreground">
                        What's happening at IPX Hub?
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create Post</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="What's happening?"
                          value={newPost.content}
                          onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                          rows={4}
                          className="min-h-[100px]"
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <ImageIcon className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Video className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Calendar className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsCreatePostOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleCreatePost}>Post</Button>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feed Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="for-you">For You</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="following">Following</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Posts */}
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              const author = mockUsers[post.authorId];
              const isLiked = user && post.likedBy.includes(user.id);
              const isReposted = user && post.repostedBy.includes(user.id);

              return (
                <Card key={post.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={cn(
                          post.authorId.includes('organizer') && "bg-primary text-primary-foreground"
                        )}>
                          {getInitials(author?.name || "U")}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{author?.name || "Unknown User"}</h3>
                          {post.authorId.includes('organizer') && (
                            <Badge variant="default" className="text-xs">Organizer</Badge>
                          )}
                          {post.type === 'announcement' && (
                            <Badge variant="destructive" className="text-xs">Announcement</Badge>
                          )}
                          <span className="text-muted-foreground text-sm">
                            {formatTime(post.createdAt)}
                          </span>
                        </div>
                        
                        <div 
                          className="mb-4 text-foreground"
                          dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
                        />
                        
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
                              className={cn(
                                "flex items-center gap-2",
                                isLiked && "text-red-500"
                              )}
                              onClick={() => handleLike(post.id)}
                            >
                              <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                              {post.likes}
                            </Button>
                            
                            <Button variant="ghost" size="sm" className="flex items-center gap-2">
                              <MessageCircle className="h-4 w-4" />
                              {post.replies}
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "flex items-center gap-2",
                                isReposted && "text-green-500"
                              )}
                              onClick={() => handleRepost(post.id)}
                            >
                              <Repeat2 className="h-4 w-4" />
                              {post.reposts}
                            </Button>
                            
                            <Button variant="ghost" size="sm" className="flex items-center gap-2">
                              <Share className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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

          {/* Event Updates */}
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Live Event Updates
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium">AI Workshop - Live</div>
                    <div className="text-muted-foreground">Hall B, 45 attendees</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium">Networking Break</div>
                    <div className="text-muted-foreground">Lobby, 15 min</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium">Panel Discussion</div>
                    <div className="text-muted-foreground">Main Hall, 3:00 PM</div>
                  </div>
                </div>
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
    </div>
  );
}