'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, MessageSquare, Plus, Search, ChevronRight, Lock, Calendar, Loader2, CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useToast } from '@/hooks/use-toast';
import { moderateContent } from '@/app/actions/moderation';

export function CommunityDetailClient({ communityId }: { communityId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const community = useQuery(api.communities.getById, { id: communityId as any });
  const memberStatus = useQuery(api.communities.getMemberStatus, { communityId: communityId as any });
  const posts = useQuery(api.posts.list) || []; 
  const joinMutation = useMutation(api.communities.join);
  const createPostMutation = useMutation(api.posts.create);
  const flagPostMutation = useMutation(api.moderation.flagPost);
  
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [loading, setLoading] = useState(false);

  const isMember = !!memberStatus;

  const handleJoin = async () => {
    try {
      await joinMutation({ id: communityId as any });
      toast({ title: 'Joined community! 🎉' });
    } catch (e) {
      toast({ title: 'Failed to join', variant: 'destructive' });
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    setLoading(true);
    try {
      // 1. Create Post
      const postId = await createPostMutation({ 
        content: newPostContent,
        communityId: communityId as any 
      });
      
      setShowCreatePost(false);
      setNewPostContent('');
      toast({ title: 'Posted successfully' });

      // 2. Async AI Moderation check
      const moderation = await moderateContent(newPostContent, user?.name);
      if (moderation.success && moderation.isFlagged) {
        // Flag the post in Convex
        await flagPostMutation({
          postId: postId as any,
          reason: moderation.reason || 'AI Flagged'
        });
        toast({ 
          title: 'Post Flagged', 
          description: 'Your post is under review by our AI moderator.',
          variant: 'destructive' 
        });
      }
    } catch (e) {
      toast({ title: 'Failed to post', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (community === undefined) return <div className="flex items-center justify-center min-h-[400px] text-white"><Loader2 className="animate-spin" /></div>;
  if (community === null) return <div className="p-20 text-center text-white">Community not found</div>;

  return (
    <div className="container mx-auto px-4 py-6 text-white space-y-6">
      <Card className="bg-white/5 border-white/10 text-white">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <CardTitle className="text-3xl font-bold">{community.name}</CardTitle>
              <CardDescription className="text-gray-400 mt-2">{community.description}</CardDescription>
            </div>
            <div className="flex gap-2">
                {isMember ? (
                    <>
                        <Button onClick={() => setShowCreatePost(true)}><Plus className="mr-2 h-4 w-4" /> New Post</Button>
                        <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/20 py-2 px-4 gap-2">
                            <CheckCircle2 size={14} /> Member
                        </Badge>
                    </>
                ) : (
                    <Button onClick={handleJoin} className="bg-cyan-600 hover:bg-cyan-500">Join Community</Button>
                )}
            </div>
          </div>
          <div className="flex gap-6 mt-4 pt-4 border-t border-white/10 text-sm text-gray-400">
            <span className="flex items-center gap-1"><Users size={14} className="text-cyan-400" /> {community.membersCount} members</span>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold">Feed</h2>
            {posts.map((p: any) => (
            <Card key={p._id} className="bg-white/5 border-white/10 text-white">
                <CardContent className="p-6">
                    <p className="text-gray-200 whitespace-pre-wrap">{p.content}</p>
                    <p className="text-[10px] text-gray-500 mt-4">{new Date(p.createdAt).toLocaleString()}</p>
                </CardContent>
            </Card>
            ))}
            {posts.length === 0 && <div className="py-20 text-center text-gray-500 border border-dashed border-white/10 rounded-lg italic">No posts yet. Be the first to share something!</div>}
        </div>
        
        <div className="space-y-4">
            <h2 className="text-xl font-bold">About</h2>
            <Card className="bg-white/5 border-white/10 text-white">
                <CardContent className="p-4 text-sm text-gray-400">
                    <p>Welcome to {community.name}! This is a space for discussion, sharing, and connection within the {community.category} category.</p>
                </CardContent>
            </Card>
        </div>
      </div>

      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="bg-gray-900 border-white/10 text-white">
          <DialogHeader><DialogTitle>Create Community Post</DialogTitle></DialogHeader>
          <Textarea 
            value={newPostContent} 
            onChange={e => setNewPostContent(e.target.value)} 
            placeholder="Share with your community..." 
            className="bg-white/5 border-white/10 min-h-[150px]" 
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePost(false)}>Cancel</Button>
            <Button onClick={handleCreatePost} disabled={loading}>{loading ? 'Posting...' : 'Post'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}