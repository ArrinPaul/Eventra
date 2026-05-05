'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/badge'; // Wait, Button from badge? Let's check imports.
// Fixing imports
import { Button as UIButton } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Users, MessageSquare, Heart, Share2, Shield, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CommunityDetail({ community, posts: initialPosts, members }: any) {
  const { toast } = useToast();
  const [posts, setPosts] = useState(initialPosts || []);

  const handleLike = async (postId: string) => {
    try {
      setPosts((prev: any[]) =>
        prev.map((post) => (post.id === postId ? { ...post, likes: Number(post.likes || 0) + 1 } : post))
      );
      toast({ title: 'Post liked!' });
    } catch (e) {
      toast({ title: 'Failed to like post', variant: 'destructive' });
    }
  };

  if (!community) return <div className="py-20 text-center text-white">Community not found</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="relative h-64 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-cyan-500/10 mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 p-8 z-20 w-full flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="space-y-2 text-white">
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30">{community.category}</Badge>
            <h1 className="text-5xl font-black text-white tracking-tighter">{community.name}</h1>
            <div className="flex items-center gap-4 text-gray-400 text-sm">
              <span className="flex items-center gap-1.5"><Users size={14} className="text-cyan-400" /> {community.memberCount} members</span>
              <span className="flex items-center gap-1.5"><MessageSquare size={14} className="text-cyan-400" /> {posts.length} discussions</span>
            </div>
          </div>
          <UIButton className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/40 px-8 rounded-xl h-12">
            Join Community
          </UIButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white/5 border-white/10 p-4 rounded-2xl">
             <div className="flex gap-4">
                <Avatar><AvatarFallback className="bg-cyan-500/20 text-cyan-400">ME</AvatarFallback></Avatar>
                <div className="flex-1 space-y-3">
                  <Textarea placeholder="Share something with the community..." className="bg-white/5 border-white/10 resize-none min-h-[100px] text-white" />
                  <div className="flex justify-between items-center">
                    <UIButton variant="ghost" size="sm" className="text-gray-400 hover:text-white"><Image size={18} className="mr-2" /> Media</UIButton>
                    <UIButton size="sm" className="bg-cyan-600 hover:bg-cyan-500 px-6">Post</UIButton>
                  </div>
                </div>
             </div>
          </Card>

          <div className="space-y-4">
            {posts.map((p: any) => (
                <Card key={p.id} className="bg-white/5 border-white/10 text-white overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex gap-4 mb-4">
                      <Avatar className="h-10 w-10 border border-white/10"><AvatarFallback>{p.authorName?.[0]}</AvatarFallback></Avatar>
                      <div>
                        <p className="font-bold text-white">{p.authorName || 'Member'}</p>
                        <p className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{p.content}</p>
                    <div className="flex items-center gap-6 mt-6 pt-4 border-t border-white/5">
                        <button 
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                            onClick={() => handleLike(p.id)}
                        >
                            <Heart size={18} className={p.likes > 0 ? "fill-cyan-500 text-cyan-500" : ""} /> {p.likes || 0}
                        </button>
                        <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors">
                            <MessageSquare size={18} /> {p.commentCount || 0}
                        </button>
                        <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors ml-auto">
                            <Share2 size={18} />
                        </button>
                    </div>
                  </CardContent>
                </Card>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="bg-white/5 border-white/10 p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white"><Shield size={18} className="text-cyan-400" /> About Community</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">{community.description}</p>
            <Separator className="bg-white/5 mb-6" />
            <div className="space-y-4">
               <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Members</h4>
               <div className="space-y-3">
                {members.slice(0, 5).map((m: any) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <Avatar className="h-8 w-8 border border-white/10"><AvatarFallback>{m.name?.[0]}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0 text-white">
                      <p className="text-sm font-bold truncate">{m.name}</p>
                      <p className="text-[10px] text-gray-500 capitalize">{m.role}</p>
                    </div>
                  </div>
                ))}
               </div>
               <UIButton variant="ghost" className="w-full text-xs text-cyan-400 hover:bg-cyan-500/10">View All Members</UIButton>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
