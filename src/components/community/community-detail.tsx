'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  Star, 
  Eye, 
  ChevronRight,
  Pin,
  Lock,
  Shield,
  Flag,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Reply,
  Edit,
  Trash2,
  Globe,
  Crown,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Bookmark,
  Share,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Community, Post, Comment, Poll, AMASession } from '@/types';
import { db, FIRESTORE_COLLECTIONS } from '@/core/config/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc,
  orderBy,
  serverTimestamp,
  arrayUnion,
  increment
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface CommunityDetailClientProps {
  communityId: string;
}

export function CommunityDetailClient({ communityId }: CommunityDetailClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top'>('hot');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Create post form
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    type: 'text' as Post['type'],
    tags: ''
  });

  const loadCommunity = useCallback(async () => {
    try {
      const communityRef = doc(db, FIRESTORE_COLLECTIONS.COMMUNITIES, communityId);
      const communityDoc = await getDoc(communityRef);
      
      if (communityDoc.exists()) {
        const data = communityDoc.data();
        setCommunity({
          id: communityDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt)
        } as Community);
        
        // Check if user is a member
        if (user?.uid && data.members?.includes(user.uid)) {
          setIsMember(true);
        }
      }
    } catch (error) {
      console.error('Error loading community:', error);
    }
  }, [communityId, user?.uid]);

  const loadPosts = useCallback(async () => {
    try {
      const postsRef = collection(db, FIRESTORE_COLLECTIONS.POSTS);
      const q = query(
        postsRef,
        where('communityId', '==', communityId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const loadedPosts: Post[] = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() || new Date(d.data().createdAt),
        updatedAt: d.data().updatedAt?.toDate?.() || new Date(d.data().updatedAt)
      })) as Post[];
      
      setPosts(loadedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    loadCommunity();
    loadPosts();
  }, [loadCommunity, loadPosts]);

  const handleJoinCommunity = async () => {
    if (!user?.uid || !community) return;
    
    setCreating(true);
    try {
      const communityRef = doc(db, FIRESTORE_COLLECTIONS.COMMUNITIES, communityId);
      await updateDoc(communityRef, {
        members: arrayUnion(user.uid),
        memberCount: increment(1)
      });
      
      setIsMember(true);
      setCommunity(prev => prev ? { ...prev, memberCount: prev.memberCount + 1 } : null);
      toast({ title: 'Success', description: 'You have joined the community!' });
    } catch (error) {
      console.error('Error joining community:', error);
      toast({ title: 'Error', description: 'Failed to join community', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleCreatePost = async () => {
    if (!user?.uid || !community || !newPost.title.trim()) return;

    setCreating(true);
    try {
      const postsRef = collection(db, FIRESTORE_COLLECTIONS.POSTS);
      const postData = {
        communityId: community.id,
        authorId: user.uid,
        title: newPost.title,
        content: newPost.content,
        type: newPost.type,
        upvotes: 0,
        downvotes: 0,
        votedBy: {},
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tags: newPost.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        isPinned: false,
        isLocked: false
      };
      
      const docRef = await addDoc(postsRef, postData);
      
      // Update community post count
      const communityRef = doc(db, FIRESTORE_COLLECTIONS.COMMUNITIES, communityId);
      await updateDoc(communityRef, {
        postCount: increment(1)
      });

      const post: Post = {
        id: docRef.id,
        communityId: community.id,
        authorId: user.uid,
        title: newPost.title,
        content: newPost.content,
        type: newPost.type,
        upvotes: 0,
        downvotes: 0,
        votedBy: {},
        commentCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: newPost.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        isPinned: false,
        isLocked: false
      };

      setPosts(prev => [post, ...prev]);
      setShowCreatePost(false);
      setNewPost({ title: '', content: '', type: 'text', tags: '' });
      
      toast({ title: 'Success', description: 'Post created successfully!' });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({ title: 'Error', description: 'Failed to create post', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleVote = async (postId: string, voteType: 'up' | 'down') => {
    if (!user) return;

    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      
      const hasVoted = post.votedBy[user.id];
      const updatedPost = { ...post };
      
      if (hasVoted === voteType) {
        // Remove vote
        delete updatedPost.votedBy[user.id];
        if (voteType === 'up') {
          updatedPost.upvotes--;
        } else {
          updatedPost.downvotes--;
        }
      } else {
        // Change or add vote
        if (hasVoted) {
          // Change existing vote
          if (hasVoted === 'up') {
            updatedPost.upvotes--;
            updatedPost.downvotes++;
          } else {
            updatedPost.downvotes--;
            updatedPost.upvotes++;
          }
        } else {
          // Add new vote
          if (voteType === 'up') {
            updatedPost.upvotes++;
          } else {
            updatedPost.downvotes++;
          }
        }
        updatedPost.votedBy[user.id] = voteType;
      }
      
      return updatedPost;
    }));
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'new':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'top':
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      case 'hot':
      default:
        // Simple hot algorithm: score = upvotes - downvotes + recent activity boost
        const aScore = (a.upvotes - a.downvotes) + (a.commentCount * 2) + 
                      (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        const bScore = (b.upvotes - b.downvotes) + (b.commentCount * 2) + 
                      (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return bScore - aScore;
    }
  });

  if (!community) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Community not found</h1>
          <Button onClick={() => router.push('/community')}>
            Back to Communities
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Community Header */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{community.icon}</div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-2xl">{community.name}</CardTitle>
                  <Badge variant="secondary">{community.category}</Badge>
                  {community.isPrivate && <Lock className="w-4 h-4 text-gray-500" />}
                </div>
                <CardDescription className="text-base">
                  {community.description}
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {user && (
                <>
                  {isMember ? (
                    <Button onClick={() => setShowCreatePost(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      New Post
                    </Button>
                  ) : (
                    <Button onClick={handleJoinCommunity} disabled={loading}>
                      <Users className="w-4 h-4 mr-2" />
                      {loading ? 'Joining...' : 'Join Community'}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-gray-600 pt-3 border-t">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{community.memberCount} members</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span>{community.postCount} posts</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Created {community.createdAt?.toLocaleDateString() ?? 'N/A'}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Search and Sort */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={(value: 'hot' | 'new' | 'top') => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hot">ðŸ”¥ Hot</SelectItem>
                <SelectItem value="new">ðŸ•’ New</SelectItem>
                <SelectItem value="top">â¬†ï¸ Top</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Posts */}
          <div className="space-y-4">
            {sortedPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 ${post.votedBy[user?.id || ''] === 'up' ? 'text-blue-500' : 'text-gray-400'}`}
                        onClick={() => handleVote(post.id, 'up')}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium">
                        {post.upvotes - post.downvotes}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 ${post.votedBy[user?.id || ''] === 'down' ? 'text-red-500' : 'text-gray-400'}`}
                        onClick={() => handleVote(post.id, 'down')}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {post.isPinned && <Pin className="w-4 h-4 text-green-600" />}
                        {post.isLocked && <Lock className="w-4 h-4 text-gray-500" />}
                        <CardTitle className="text-lg hover:text-blue-600 cursor-pointer">
                          {post.title}
                        </CardTitle>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <span>by User {post.authorId}</span>
                        <span>â€¢</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        {post.type === 'poll' && (
                          <>
                            <span>â€¢</span>
                            <Badge variant="outline" className="text-xs">Poll</Badge>
                          </>
                        )}
                      </div>
                      
                      <CardDescription className="mb-3 whitespace-pre-wrap">
                        {post.content}
                      </CardDescription>

                      {/* Poll */}
                      {post.type === 'poll' && post.poll && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium mb-3">{post.poll.question}</h4>
                          <div className="space-y-2">
                            {post.poll.options.map((option) => {
                              const totalVotes = post.poll!.options.reduce((sum, opt) => sum + opt.votes, 0);
                              const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                              
                              return (
                                <div key={option.id} className="cursor-pointer hover:bg-gray-100 p-2 rounded">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm">{option.text}</span>
                                    <span className="text-sm text-gray-500">{option.votes} votes</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {post.poll.endsAt && (
                            <p className="text-xs text-gray-500 mt-3">
                              Poll ends on {post.poll.endsAt.toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Tags */}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {post.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Post Actions */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <button className="flex items-center gap-1 hover:text-blue-600">
                          <MessageSquare className="w-4 h-4" />
                          <span>{post.commentCount} comments</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-blue-600">
                          <Share className="w-4 h-4" />
                          <span>Share</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-blue-600">
                          <Bookmark className="w-4 h-4" />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {sortedPosts.length === 0 && (
            <Card className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
              <p className="text-gray-600 mb-4">Be the first to start a discussion!</p>
              {isMember && user && (
                <Button onClick={() => setShowCreatePost(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Post
                </Button>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Community Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About Community</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Rules</h4>
                  <ul className="space-y-1 text-sm">
                    {community.rules.map((rule, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="text-gray-500">{index + 1}.</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Moderators</h4>
                  <div className="space-y-2">
                    {community.moderators.map((modId) => (
                      <div key={modId} className="flex items-center gap-2 text-sm">
                        <Crown className="w-4 h-4 text-yellow-500" />
                        <span>Moderator {modId}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Community Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Members</span>
                    <span className="font-medium">{community.memberCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Posts</span>
                    <span className="font-medium">{community.postCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Today</span>
                    <span className="font-medium">42</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="font-medium">{community.createdAt?.toLocaleDateString() ?? 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Post Dialog */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
            <DialogDescription>
              Share your thoughts, questions, or resources with the community
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                placeholder="Enter post title"
                value={newPost.title}
                onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                placeholder="What would you like to discuss?"
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <Input
                placeholder="machine-learning, ai, python (comma separated)"
                value={newPost.tags}
                onChange={(e) => setNewPost(prev => ({ ...prev, tags: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Post Type</label>
              <Select 
                value={newPost.type} 
                onValueChange={(value: Post['type']) => setNewPost(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">ðŸ’¬ Discussion</SelectItem>
                  <SelectItem value="poll">ðŸ“Š Poll</SelectItem>
                  <SelectItem value="link">ðŸ”— Link Share</SelectItem>
                  <SelectItem value="ama">â“ Ask Me Anything</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePost(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePost} disabled={loading || !newPost.title.trim()}>
              {loading ? 'Posting...' : 'Create Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}