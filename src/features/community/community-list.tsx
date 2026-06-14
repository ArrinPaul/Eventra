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
import { useTranslations } from 'next-intl';

export function CommunityListClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('Phase2I18n.communityList');

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
        throw new Error(t('failedCreateToast'));
      }
      const refreshed = await getCommunities(searchTerm || undefined);
      setCommunitiesRaw(refreshed);
      setShowCreateDialog(false);
      setNewCommunity({ name: '', description: '', category: 'General', isPrivate: false });
      toast({ title: t('createdToast') });
    } catch (e) {
      toast({ title: t('failedCreateToast'), variant: 'destructive' });
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
    <div className="container mx-auto px-4 py-6 text-foreground">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-3xl font-bold">{t('title')}</h1><p className="text-muted-foreground">{t('subtitle')}</p></div>
        <Button onClick={() => setShowCreateDialog(true)}><Plus className="w-4 h-4 mr-2" /> {t('create')}</Button>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input 
          placeholder={t('searchPlaceholder')} 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          className="pl-10 bg-card border-border" 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {communitiesRaw.map((c: any) => (
          <Link key={c.id} href={`/community/${c.id}`}>
            <Card className="bg-card border-border hover:bg-muted transition-colors cursor-pointer text-foreground h-full flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="line-clamp-1">{c.name}</CardTitle>
                  <Badge variant="secondary">{c.category}</Badge>
                </div>
                <CardDescription className="text-muted-foreground line-clamp-2">{c.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between text-sm text-muted-foreground">
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
        <div className="py-20 text-center text-muted-foreground border border-dashed border-border rounded-lg">
          {t('empty')}
        </div>
      )}

      {status === "LoadingFirstPage" && (
        <div className="mt-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-card text-foreground border-border">
          <DialogHeader>
            <DialogTitle>{t('createDialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('createDialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
             <Input 
               placeholder={t('namePlaceholder')} 
               value={newCommunity.name} 
               onChange={(e) => setNewCommunity({...newCommunity, name: e.target.value})} 
               className="bg-card border-border"
             />
             <Textarea 
               placeholder={t('descriptionPlaceholder')} 
               value={newCommunity.description} 
               onChange={(e) => setNewCommunity({...newCommunity, description: e.target.value})} 
               className="bg-card border-border"
             />
             <Input 
               placeholder={t('categoryPlaceholder')} 
               value={newCommunity.category} 
               onChange={(e) => setNewCommunity({...newCommunity, category: e.target.value})} 
               className="bg-card border-border"
             />
             <div className="flex items-center gap-2">
               <input 
                 type="checkbox" 
                 checked={newCommunity.isPrivate} 
                 onChange={(e) => setNewCommunity({...newCommunity, isPrivate: e.target.checked})} 
                 className="rounded border-gray-600 bg-gray-700"
               />
               <span className="text-sm">{t('privateCommunity')}</span>
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-border">{t('cancel')}</Button>
            <Button onClick={handleCreateCommunity} disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? t('creating') : t('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


