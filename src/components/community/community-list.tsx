'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, MessageSquare, Plus, Search, ChevronRight, Lock
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useToast } from '@/hooks/use-toast';

export function CommunityListClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const communitiesRaw = useQuery(api.communities.list) || [];
  const createCommunityMutation = useMutation(api.communities.create);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    category: 'General',
    isPrivate: false
  });

  const filteredCommunities = communitiesRaw.filter((c: any) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCommunity = async () => {
    if (!newCommunity.name.trim()) return;
    setLoading(true);
    try {
      await createCommunityMutation(newCommunity);
      setShowCreateDialog(false);
      setNewCommunity({ name: '', description: '', category: 'General', isPrivate: false });
      toast({ title: 'Community created' });
    } catch (e) {
      toast({ title: 'Failed to create', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 text-white">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-3xl font-bold">Communities</h1><p className="text-gray-400">Join discussions and connect</p></div>
        <Button onClick={() => setShowCreateDialog(true)}><Plus className="w-4 h-4 mr-2" /> Create</Button>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
        <Input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-white/5 border-white/10" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCommunities.map((c: any) => (
          <Link key={c._id} href={`/community/${c._id}`}>
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer text-white">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{c.name}</CardTitle>
                  <Badge variant="secondary">{c.category}</Badge>
                </div>
                <CardDescription className="text-gray-400">{c.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex gap-4"><div className="flex items-center gap-1"><Users size={14} /> {c.membersCount}</div></div>
                <ChevronRight size={16} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-gray-900 border-white/10 text-white">
          <DialogHeader><DialogTitle>New Community</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Name" value={newCommunity.name} onChange={e => setNewCommunity({...newCommunity, name: e.target.value})} className="bg-white/5 border-white/10" />
            <Textarea placeholder="Description" value={newCommunity.description} onChange={e => setNewCommunity({...newCommunity, description: e.target.value})} className="bg-white/5 border-white/10" />
          </div>
          <DialogFooter><Button onClick={handleCreateCommunity} disabled={loading}>{loading ? 'Creating...' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
