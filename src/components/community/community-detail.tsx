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
  Users, MessageSquare, Plus, Search, ChevronRight, Lock, Calendar, Loader2, CheckCircle2,
  MoreVertical, ThumbsUp, MessageCircle, Flag, Info
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, usePaginatedQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useToast } from '@/hooks/use-toast';
import { moderateContent } from '@/app/actions/moderation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function CommunityDetailClient({ communityId }: { communityId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const community = useQuery(api.communities.getById, { id: communityId as any });
  const memberStatus = useQuery(api.communities.getMemberStatus, { communityId: communityId as any });
  
  const { results: posts, status: postsStatus, loadMore: loadMorePosts } = usePaginatedQuery(
    api.posts.listByCommunity,
    { communityId: communityId as any },
    { initialNumItems: 10 }
  );

  const { results: members, status: membersStatus, loadMore: loadMoreMembers } = usePaginatedQuery(
    api.communities.getMembers,
    { communityId: communityId as any },
    { initialNumItems: 20 }
  );

  const joinMutation = useMutation(api.communities.join);
  const createPostMutation = useMutation(api.posts.create);
  const flagPostMutation = useMutation(api.moderation.flagPost);
  const likePostMutation = useMutation(api.posts.like);
  
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

  const handleLike = async (postId: string) => {
    try {
      await likePostMutation({ id: postId as any });
    } catch (e) {
      toast({ title: 'Failed to like post' });
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
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold text-2xl border border-cyan-500/20">
                {community.name.charAt(0)}
              </div>
              <div>
                <CardTitle className="text-3xl font-bold">{community.name}</CardTitle>
                <CardDescription className="text-gray-400 mt-1">{community.category} Community</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
                {isMember ? (
                    <>
                        <Button onClick={() => setShowCreatePost(true)} className="bg-cyan-600 hover:bg-cyan-500"><Plus className="mr-2 h-4 w-4" /> New Post</Button>
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
            <span className="flex items-center gap-1"><Lock size={14} className={community.isPrivate ? "text-amber-500" : "text-green-500"} /> {community.isPrivate ? "Private" : "Public"}</span>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="feed" className="space-y-6">
        <TabsList className="bg-white/5 border-white/10 p-1">
          <TabsTrigger value="feed" className="data-[state=active]:bg-cyan-600">Feed</TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-cyan-600">Members</TabsTrigger>
          <TabsTrigger value="about" className="data-[state=active]:bg-cyan-600">About</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
                {posts.map((p: any) => (
                <Card key={p._id} className="bg-white/5 border-white/10 text-white overflow-hidden">
                    <CardHeader className="p-4 flex flex-row items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={p.authorImage} />
                        <AvatarFallback className="bg-cyan-500/10 text-cyan-500 text-[10px]">{p.authorName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-bold">{p.authorName}</p>
                        <p className="text-[10px] text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500"><MoreVertical size={14} /></Button>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <p className="text-gray-200 whitespace-pre-wrap">{p.content}</p>
                        {p.imageUrl && (
                          <div className="mt-4 rounded-lg overflow-hidden border border-white/10">
                            <img src={p.imageUrl} alt="Post content" className="w-full h-auto object-cover max-h-[400px]" />
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/5">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={p.meLiked ? "text-cyan-400" : "text-gray-500"}
                            onClick={() => handleLike(p._id)}
                          >
                            <ThumbsUp className="mr-2 h-4 w-4" /> {p.likes || 0}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-500">
                            <MessageCircle className="mr-2 h-4 w-4" /> {p.commentCount || 0}
                          </Button>
                        </div>
                    </CardContent>
                </Card>
                ))}

                {posts.length === 0 && postsStatus !== "LoadingFirstPage" && (
                  <div className="py-20 text-center text-gray-500 border border-dashed border-white/10 rounded-lg italic">
                    No posts yet. Be the first to share something!
                  </div>
                )}

                {postsStatus === "CanLoadMore" && (
                  <div className="flex justify-center pt-4">
                    <Button variant="outline" onClick={() => loadMorePosts(10)} className="border-white/10">Load More Posts</Button>
                  </div>
                )}

                {(postsStatus === "LoadingMore" || postsStatus === "LoadingFirstPage") && (
                  <div className="flex justify-center pt-4"><Loader2 className="animate-spin text-cyan-500" /></div>
                )}
            </div>
            
            <div className="space-y-4">
                <Card className="bg-white/5 border-white/10 text-white">
                    <CardHeader><CardTitle className="text-sm">About Community</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0 text-sm text-gray-400">
                        <p>{community.description}</p>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-cyan-400" />
                            <span>Created {new Date(community._creationTime).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Info size={14} className="text-cyan-400" />
                            <span>Category: {community.category}</span>
                          </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="members">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader><CardTitle>Members ({community.membersCount})</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((m: any) => (
                  <div key={m._id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <Avatar>
                      <AvatarImage src={m.image} />
                      <AvatarFallback className="bg-cyan-500/10 text-cyan-500">{m.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold truncate">{m.name}</p>
                      <p className="text-[10px] text-cyan-400 uppercase tracking-wider font-mono">{m.role}</p>
                    </div>
                  </div>
                ))}
              </div>

              {membersStatus === "CanLoadMore" && (
                <div className="flex justify-center mt-6">
                  <Button variant="outline" onClick={() => loadMoreMembers(20)} className="border-white/10">Load More Members</Button>
                </div>
              )}

              {(membersStatus === "LoadingMore" || membersStatus === "LoadingFirstPage") && (
                <div className="flex justify-center mt-6"><Loader2 className="animate-spin text-cyan-500" /></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about">
           <Card className="bg-white/5 border-white/10 text-white">
              <CardHeader><CardTitle>About {community.name}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 leading-relaxed">{community.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/10">
                   <div>
                     <h4 className="font-bold mb-2">Platform Guidelines</h4>
                     <p className="text-sm text-gray-400">Be respectful, stay on topic, and help grow the community. All posts are subject to AI moderation for platform safety.</p>
                   </div>
                   <div>
                     <h4 className="font-bold mb-2">Moderation</h4>
                     <p className="text-sm text-gray-400">This community is moderated by its creator and automated AI tools. Violating content will be flagged and removed.</p>
                   </div>
                </div>
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>

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