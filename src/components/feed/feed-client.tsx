'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, Heart, MessageCircle, Share2, Loader2, Search
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/core/utils/utils';
import { CommentSection } from './comment-section';

export default function FeedClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const postsRaw = useQuery(api.posts.list) || [];
  const createPostMutation = useMutation(api.posts.create);
  const likePostMutation = useMutation(api.posts.like);
  
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    setLoading(true);
    try {
      await createPostMutation({ content: newPostContent });
      setShowCreatePost(false);
      setNewPostContent('');
      toast({ title: 'Posted successfully' });
    } catch (e) {
      toast({ title: 'Failed to post', variant: 'destructive' });
    } finally {
      setLoading(false);
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
              <div className="flex gap-3 mb-4">
                <Avatar>
                  <AvatarImage src={post.authorImage} />
                  <AvatarFallback>{post.authorName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold">{post.authorName || 'User'}</p>
                  <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                </div>
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
      </div>

      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="bg-gray-900 border-white/10 text-white">
          <DialogHeader><DialogTitle>Create Post</DialogTitle></DialogHeader>
          <Textarea value={newPostContent} onChange={e => setNewPostContent(e.target.value)} placeholder="Share something..." className="bg-white/5 border-white/10" rows={4} />
          <DialogFooter>
            <Button onClick={handleCreatePost} disabled={loading}>{loading ? 'Posting...' : 'Post'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}