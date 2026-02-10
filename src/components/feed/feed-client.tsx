'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Plus, Heart, MessageCircle, Share2, Loader2, Search, MoreVertical, Edit2, Trash2
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, usePaginatedQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/core/utils/utils';
import { CommentSection } from './comment-section';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function FeedClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { results: postsRaw, status, loadMore } = usePaginatedQuery(
    api.posts.list,
    {},
    { initialNumItems: 10 }
  );
  
  const createPostMutation = useMutation(api.posts.create);
  const updatePostMutation = useMutation(api.posts.update);
  const deletePostMutation = useMutation(api.posts.deletePost);
  const likePostMutation = useMutation(api.posts.like);
  
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showEditPost, setShowEditPost] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [editPostContent, setEditPostContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    setLoading(true);
    try {
      // Note: This requires a communityId. For the global feed, we'll use a default community if needed,
      // but usually the feed is scoped. For now, assuming first community or platform feed.
      const communities = await (window as any).Convex.query(api.communities.list);
      const defaultCommunityId = communities?.[0]?._id;
      
      if (!defaultCommunityId) throw new Error("No community found to post to");

      await createPostMutation({ content: newPostContent, communityId: defaultCommunityId });
      setShowCreatePost(false);
      setNewPostContent('');
      toast({ title: 'Posted successfully' });
    } catch (e: any) {
      toast({ title: 'Failed to post', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePost = async () => {
    if (!editPostContent.trim() || !editingPost) return;
    setLoading(true);
    try {
      await updatePostMutation({ id: editingPost._id, content: editPostContent });
      setShowEditPost(false);
      setEditingPost(null);
      toast({ title: 'Post updated' });
    } catch (e: any) {
      toast({ title: 'Update failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await deletePostMutation({ id: id as any });
      toast({ title: 'Post deleted' });
    } catch (e) {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  const handleLike = async (id: string) => {
    try {
      await likePostMutation({ id: id as any });
    } catch (e) {}
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl text-white">
      <Card className="mb-6 bg-white/5 border-white/10 text-white">
        <CardContent className="p-4 flex gap-3">
          <Avatar><AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback></Avatar>
          <Button variant="outline" className="flex-1 justify-start text-gray-400 border-white/10" onClick={() => setShowCreatePost(true)}>What&apos;s happening?</Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {postsRaw.map((post: any) => (
          <Card key={post._id} className="bg-white/5 border-white/10 text-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <Avatar>
                    <AvatarImage src={post.authorImage} />
                    <AvatarFallback>{post.authorName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold">{post.authorName || 'User'}</p>
                    <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {user?._id === post.authorId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-gray-900 border-white/10 text-white">
                      <DropdownMenuItem 
                        onClick={() => {
                          setEditingPost(post);
                          setEditPostContent(post.content);
                          setShowEditPost(true);
                        }}
                        className="cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeletePost(post._id)}
                        className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-400/10"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <p className="text-gray-200 whitespace-pre-wrap">{post.content}</p>
              <div className="flex gap-6 mt-6 pt-4 border-t border-white/10">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleLike(post._id)} 
                  className={cn("gap-2 hover:bg-pink-500/10 hover:text-pink-400", post.meLiked && "text-pink-500")}
                >
                  <Heart size={16} fill={post.meLiked ? "currentColor" : "none"} /> {post.likes}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleComments(post._id)}
                  className={cn("gap-2 hover:bg-cyan-500/10 hover:text-cyan-400", expandedComments[post._id] && "text-cyan-400")}
                >
                  <MessageCircle size={16} /> {post.commentCount || 0}
                </Button>
              </div>

              {expandedComments[post._id] && (
                <CommentSection postId={post._id} />
              )}
            </CardContent>
          </Card>
        ))}

        {status === "CanLoadMore" && (
          <Button 
            variant="ghost" 
            className="w-full text-gray-400 hover:text-white" 
            onClick={() => loadMore(10)}
          >
            Load More
          </Button>
        )}
        
        {status === "LoadingMore" && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
          </div>
        )}
      </div>

      {/* Create Post Dialog */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="bg-gray-900 border-white/10 text-white">
          <DialogHeader><DialogTitle>Create Post</DialogTitle></DialogHeader>
          <Textarea value={newPostContent} onChange={e => setNewPostContent(e.target.value)} placeholder="Share something..." className="bg-white/5 border-white/10" rows={4} />
          <DialogFooter>
            <Button onClick={handleCreatePost} disabled={loading}>{loading ? 'Posting...' : 'Post'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Post Dialog */}
      <Dialog open={showEditPost} onOpenChange={setShowEditPost}>
        <DialogContent className="bg-gray-900 border-white/10 text-white">
          <DialogHeader><DialogTitle>Edit Post</DialogTitle></DialogHeader>
          <Textarea value={editPostContent} onChange={e => setEditPostContent(e.target.value)} placeholder="Update your post..." className="bg-white/5 border-white/10" rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditPost(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleUpdatePost} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}