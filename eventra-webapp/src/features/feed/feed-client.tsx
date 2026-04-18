'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Heart, MessageCircle, Share2, Loader2, Search, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/core/utils/utils';
import { CommentSection } from './comment-section';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  createPost,
  deletePost,
  getCommunities,
  getCommunityPosts,
  likePost,
  updatePost,
} from '@/app/actions/communities';
import { useTranslations } from 'next-intl';

export default function FeedClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('Phase2I18n.feed');

  const [communities, setCommunities] = useState<any[]>([]);
  const [postsRaw, setPostsRaw] = useState<any[]>([]);
  const [status] = useState<'CanLoadMore' | 'LoadingMore' | 'Exhausted'>('Exhausted');
  const loadMore = (_count: number) => {};
  
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showEditPost, setShowEditPost] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [editPostContent, setEditPostContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;

    async function load() {
      const allCommunities = await getCommunities();
      if (!mounted) return;
      setCommunities(allCommunities);

      if (allCommunities.length > 0) {
        const posts = await getCommunityPosts(allCommunities[0].id);
        if (!mounted) return;
        setPostsRaw(
          posts.map((row: any) => ({
            _id: row.post.id,
            authorName: row.author.name,
            authorImage: row.author.image,
            createdAt: row.post.createdAt,
            content: row.post.content,
            likes: row.post.likes,
            meLiked: false,
          }))
        );
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    setLoading(true);
    try {
      // Note: This requires a communityId. For the global feed, we'll use a default community if needed,
      // but usually the feed is scoped. For now, assuming first community or platform feed.
      const defaultCommunityId = communities?.[0]?._id;
      
      if (!defaultCommunityId) throw new Error(t('noCommunityError'));

      const result = await createPost({ content: newPostContent, communityId: defaultCommunityId });
      if (!result.success || !result.post) throw new Error(t('failedCreatePost'));
      setPostsRaw((prev) => [
        {
          _id: result.post.id,
          authorName: user?.name || t('authorFallback'),
          authorImage: user?.image,
          createdAt: result.post.createdAt,
          content: result.post.content,
          likes: result.post.likes,
          meLiked: false,
        },
        ...prev,
      ]);
      setShowCreatePost(false);
      setNewPostContent('');
      toast({ title: t('postedSuccessfully') });
    } catch (e: any) {
      toast({ title: t('failedCreatePost'), description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePost = async () => {
    if (!editPostContent.trim() || !editingPost) return;
    setLoading(true);
    try {
      const result = await updatePost(editingPost._id, editPostContent);
      if (!result.success || !result.post) throw new Error(t('updateFailed'));
      setPostsRaw((prev) => prev.map((p) => (p._id === editingPost._id ? { ...p, content: result.post.content } : p)));
      setShowEditPost(false);
      setEditingPost(null);
      toast({ title: t('postUpdated') });
    } catch (e: any) {
      toast({ title: t('updateFailed'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      const result = await deletePost(id as any);
      if (!result.success) throw new Error(t('deleteFailed'));
      setPostsRaw((prev) => prev.filter((p) => p._id !== id));
      toast({ title: t('postDeleted') });
    } catch (e) {
      toast({ title: t('deleteFailed'), variant: 'destructive' });
    }
  };

  const handleLike = async (id: string) => {
    try {
      const result = await likePost(id as any);
      if (!result.success) throw new Error(t('likeFailed'));
      setPostsRaw((prev) => prev.map((p) => (p._id === id ? { ...p, likes: Number(p.likes || 0) + 1 } : p)));
    } catch (e) {}
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl text-white">
      <Card className="mb-6 bg-white/5 border-white/10 text-white">
        <CardContent className="p-4 flex gap-3">
          <Avatar><AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback></Avatar>
          <Button variant="outline" className="flex-1 justify-start text-gray-400 border-white/10" onClick={() => setShowCreatePost(true)}>{t('composerPrompt')}</Button>
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
                    <p className="font-bold">{post.authorName || t('authorFallback')}</p>
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
                        <Edit2 className="w-4 h-4 mr-2" /> {t('edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeletePost(post._id)}
                        className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-400/10"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> {t('delete')}
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
            {t('loadMore')}
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
          <DialogHeader><DialogTitle>{t('createPostTitle')}</DialogTitle></DialogHeader>
          <Textarea value={newPostContent} onChange={e => setNewPostContent(e.target.value)} placeholder={t('createPostPlaceholder')} className="bg-white/5 border-white/10" rows={4} />
          <DialogFooter>
            <Button onClick={handleCreatePost} disabled={loading}>{loading ? t('posting') : t('post')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Post Dialog */}
      <Dialog open={showEditPost} onOpenChange={setShowEditPost}>
        <DialogContent className="bg-gray-900 border-white/10 text-white">
          <DialogHeader><DialogTitle>{t('editPostTitle')}</DialogTitle></DialogHeader>
          <Textarea value={editPostContent} onChange={e => setEditPostContent(e.target.value)} placeholder={t('editPostPlaceholder')} className="bg-white/5 border-white/10" rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditPost(false)} disabled={loading}>{t('cancel')}</Button>
            <Button onClick={handleUpdatePost} disabled={loading}>{loading ? t('saving') : t('saveChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


