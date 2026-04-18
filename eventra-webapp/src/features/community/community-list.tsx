'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, MessageSquare, Plus, Search, ChevronRight, Lock, Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { createCommunity, getCommunities } from '@/app/actions/communities';

export function CommunityListClient() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [communitiesRaw, setCommunitiesRaw] = useState<any[]>([]);
  const [status, setStatus] = useState<'LoadingFirstPage' | 'Exhausted'>('LoadingFirstPage');
  
  const [searchTerm, setSearchTerm] = useState('');
//     { search: searchTerm || undefined },
//     { initialNumItems: 12 }
//   );
//   
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    category: 'General',
    isPrivate: false
  });

  const handleCreateCommunity = async () => {
    if (!newCommunity.name.trim()) return;
    setLoading(true);
    try {
      const result = await createCommunity(newCommunity);
      if (!result.success) {
        throw new Error('Failed to create community');
      }
      const refreshed = await getCommunities(searchTerm || undefined);
      setCommunitiesRaw(refreshed);
      setShowCreateDialog(false);
      setNewCommunity({ name: '', description: '', category: 'General', isPrivate: false });
      toast({ title: 'Community created' });
    } catch (e) {
      toast({ title: 'Failed to create', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function load() {
      setStatus('LoadingFirstPage');
      try {
        const rows = await getCommunities(searchTerm || undefined);
        if (mounted) setCommunitiesRaw(rows);
      } finally {
        if (mounted) setStatus('Exhausted');
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [searchTerm]);

  return (
    <div className="container mx-auto px-4 py-6 text-white">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-3xl font-bold">Communities</h1><p className="text-gray-400">Join discussions and connect</p></div>
        <Button onClick={() => setShowCreateDialog(true)}><Plus className="w-4 h-4 mr-2" /> Create</Button>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
        <Input 
          placeholder="Search communities..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          className="pl-10 bg-white/5 border-white/10" 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {communitiesRaw.map((c: any) => (
          <Link key={c.id} href={`/community/${c.id}`}>
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer text-white h-full flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="line-clamp-1">{c.name}</CardTitle>
                  <Badge variant="secondary">{c.category}</Badge>
                </div>
                <CardDescription className="text-gray-400 line-clamp-2">{c.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-sm text-gray-500">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1">
                    <Users size={14} /> {c.memberCount}
                  </div>
                  {c.isPrivate && <Lock size={14} className="text-amber-500" />}
                </div>
                <ChevronRight size={16} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {communitiesRaw.length === 0 && status !== "LoadingFirstPage" && (
        <div className="py-20 text-center text-gray-500 border border-dashed border-white/10 rounded-lg">
          No communities found.
        </div>
      )}

      {status === "LoadingFirstPage" && (
        <div className="mt-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-gray-900 text-white border-white/10">
          <DialogHeader>
            <DialogTitle>Create New Community</DialogTitle>
            <DialogDescription>
              Connect with like-minded people.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
             <Input 
               placeholder="Community Name" 
               value={newCommunity.name} 
               onChange={(e) => setNewCommunity({...newCommunity, name: e.target.value})} 
               className="bg-white/5 border-white/10"
             />
             <Textarea 
               placeholder="Description" 
               value={newCommunity.description} 
               onChange={(e) => setNewCommunity({...newCommunity, description: e.target.value})} 
               className="bg-white/5 border-white/10"
             />
             <Input 
               placeholder="Category" 
               value={newCommunity.category} 
               onChange={(e) => setNewCommunity({...newCommunity, category: e.target.value})} 
               className="bg-white/5 border-white/10"
             />
             <div className="flex items-center gap-2">
               <input 
                 type="checkbox" 
                 checked={newCommunity.isPrivate} 
                 onChange={(e) => setNewCommunity({...newCommunity, isPrivate: e.target.checked})} 
                 className="rounded border-gray-600 bg-gray-700"
               />
               <span className="text-sm">Private Community</span>
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-white/10">Cancel</Button>
            <Button onClick={handleCreateCommunity} disabled={loading} className="bg-cyan-600 hover:bg-cyan-500">
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


