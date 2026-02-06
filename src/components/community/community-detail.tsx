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
  Users, MessageSquare, Plus, Search, ChevronRight, Lock, Calendar, Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useToast } from '@/hooks/use-toast';

export function CommunityDetailClient({ communityId }: { communityId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const community = useQuery(api.communities.getById, { id: communityId as any });
  const posts = useQuery(api.posts.list) || []; // Should filter by communityId in real app
  const joinMutation = useMutation(api.communities.join);
  const createPostMutation = useMutation(api.posts.create);
  
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    try {
      await joinMutation({ id: communityId as any });
      toast({ title: 'Joined community' });
    } catch (e) {
      toast({ title: 'Failed to join', variant: 'destructive' });
    }
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

  if (community === undefined) return <div className="p-20 text-center text-white">Loading...</div>;
  if (community === null) return <div className="p-20 text-center text-white">Community not found</div>;

  return (
    <div className="container mx-auto px-4 py-6 text-white space-y-6">
      <Card className="bg-white/5 border-white/10 text-white">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div><CardTitle className="text-3xl font-bold">{community.name}</CardTitle><CardDescription className="text-gray-400 mt-2">{community.description}</CardDescription></div>
            <div className="flex gap-2">
                <Button onClick={() => setShowCreatePost(true)}>New Post</Button>
                <Button variant="outline" onClick={handleJoin}>Join</Button>
            </div>
          </div>
          <div className="flex gap-6 mt-4 pt-4 border-t border-white/10 text-sm text-gray-400">
            <span className="flex items-center gap-1"><Users size={14} /> {community.memberCount} members</span>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Recent Posts</h2>
        {posts.map((p: any) => (
          <Card key={p._id} className="bg-white/5 border-white/10 text-white">
            <CardContent className="p-6"><p className="text-gray-200">{p.content}</p></CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="bg-gray-900 border-white/10 text-white">
          <DialogHeader><DialogTitle>Create Post</DialogTitle></DialogHeader>
          <Textarea value={newPostContent} onChange={e => setNewPostContent(e.target.value)} placeholder="Share with community..." className="bg-white/5 border-white/10" rows={4} />
          <DialogFooter><Button onClick={handleCreatePost} disabled={loading}>{loading ? 'Posting...' : 'Post'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
