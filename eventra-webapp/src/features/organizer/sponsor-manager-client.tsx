'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Trash2, 
  Globe, 
  Image as ImageIcon, 
  LayoutGrid, 
  Loader2,
  Award,
  Settings2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { upsertSponsor, deleteSponsor, getSponsorsForEvent } from '@/app/actions/sponsors';
import Image from 'next/image';
import { cn } from '@/core/utils/utils';

interface Sponsor {
  id: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  tier: string;
  order: number;
}

interface SponsorManagerProps {
  eventId: string;
  eventTitle: string;
}

const TIERS = [
  { id: 'platinum', label: 'Platinum', color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20' },
  { id: 'gold', label: 'Gold', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  { id: 'silver', label: 'Silver', color: 'text-gray-300', bg: 'bg-gray-300/10', border: 'border-gray-300/20' },
  { id: 'bronze', label: 'Bronze', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
];

export function SponsorManagerClient({ eventId, eventTitle }: SponsorManagerProps) {
  const { toast } = useToast();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [tier, setTier] = useState('silver');

  const loadSponsors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSponsorsForEvent(eventId);
      setSponsors(data as any);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadSponsors();
  }, [loadSponsors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const result = await upsertSponsor({
        id: editingId || undefined,
        eventId,
        name,
        logoUrl,
        websiteUrl,
        tier,
        order: sponsors.length
      });
      if (!result.success) {
        throw new Error(result.error || 'Failed to save sponsor');
      }
      toast({ title: editingId ? "Sponsor Updated" : "Sponsor Added" });
      resetForm();
      loadSponsors();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this sponsor?")) return;
    try {
      const result = await deleteSponsor(id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove sponsor');
      }
      toast({ title: "Sponsor removed" });
      loadSponsors();
    } catch (error: any) {
      toast({ title: "Failed to remove", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setLogoUrl('');
    setWebsiteUrl('');
    setTier('silver');
  };

  const startEdit = (s: Sponsor) => {
    setEditingId(s.id);
    setName(s.name);
    setLogoUrl(s.logoUrl || '');
    setWebsiteUrl(s.websiteUrl || '');
    setTier(s.tier);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8 text-white">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sponsor Form */}
        <Card className="bg-white/5 border-white/10 text-white h-fit">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              {editingId ? <Settings2 className="text-cyan-400" /> : <Plus className="text-cyan-400" />}
              {editingId ? 'Edit Sponsor' : 'Add New Sponsor'}
            </CardTitle>
            <CardDescription>Display partner logos on the event page.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Sponsor Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} className="bg-white/5 border-white/10" required placeholder="Acme Corp" />
              </div>
              
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <div className="flex gap-2">
                  <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className="bg-white/5 border-white/10 flex-1" placeholder="https://..." />
                  <Button type="button" variant="outline" size="icon" className="border-white/10"><ImageIcon size={16} /></Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Website URL (Optional)</Label>
                <Input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} className="bg-white/5 border-white/10" placeholder="https://acme.com" />
              </div>

              <div className="space-y-2">
                <Label>Sponsorship Tier</Label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm focus:ring-1 focus:ring-cyan-500 outline-none"
                  value={tier}
                  onChange={e => setTier(e.target.value)}
                >
                  {TIERS.map(t => (
                    <option key={t.id} value={t.id} className="bg-gray-900">{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-500" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : editingId ? 'Update Sponsor' : 'Add Sponsor'}
                </Button>
                {editingId && (
                  <Button type="button" variant="ghost" className="border border-white/10" onClick={resetForm}>Cancel</Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Sponsor Display */}
        <Card className="lg:col-span-2 bg-white/5 border-white/10 text-white">
          <CardHeader>
            <CardTitle>Sponsor Roster</CardTitle>
            <CardDescription>Partners supporting {eventTitle}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-cyan-500" /></div>
            ) : sponsors.length > 0 ? (
              <div className="space-y-8">
                {TIERS.map(t => {
                  const tierSponsors = sponsors.filter(s => s.tier === t.id);
                  if (tierSponsors.length === 0) return null;
                  
                  return (
                    <div key={t.id} className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                        <Award size={16} className={t.color} />
                        <h3 className={cn("font-black uppercase tracking-widest text-xs", t.color)}>{t.label} Sponsors</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tierSponsors.map(s => (
                          <div key={s.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group hover:border-white/20 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="relative h-12 w-12 rounded-lg bg-white p-1 flex items-center justify-center">
                                {s.logoUrl ? (
                                  <Image src={s.logoUrl} fill className="object-contain p-1" alt={s.name} />
                                ) : (
                                  <span className="text-black font-bold text-xs">{s.name[0]}</span>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-sm">{s.name}</p>
                                {s.websiteUrl && (
                                  <a href={s.websiteUrl} target="_blank" className="text-[10px] text-gray-500 flex items-center gap-1 hover:text-cyan-400">
                                    <Globe size={10} /> {new URL(s.websiteUrl).hostname}
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={() => startEdit(s)}><Settings2 size={14} /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => handleDelete(s.id)}><Trash2 size={14} /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center text-gray-500">
                <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-10" />
                <p>No sponsors added yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
