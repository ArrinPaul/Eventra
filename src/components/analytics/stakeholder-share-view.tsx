'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Share2, Copy, Check, ExternalLink, Users, Calendar, BarChart3, Globe } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useToast } from '@/hooks/use-toast';
import { Id } from '../../../convex/_generated/dataModel';
import { format } from 'date-fns';

export function StakeholderShareDialog({ eventId, eventName, open, onOpenChange }: { eventId: Id<"events">, eventName: string, open?: boolean, onOpenChange?: (open: boolean) => void }) {
  const { toast } = useToast();
  const createShareLink = useMutation(api.analytics.createShareLink);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { token } = await createShareLink({ eventId });
      const url = `${window.location.origin}/reports/share/${token}`;
      setShareUrl(url);
    } catch (e) {
      toast({ title: "Failed to generate link", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied to clipboard" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f172a] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Share Event Analytics</DialogTitle>
          <DialogDescription className="text-gray-400">
            Generate a secure, read-only link to share real-time analytics with stakeholders.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 flex flex-col items-center text-center space-y-4">
          <div className="bg-cyan-500/10 p-4 rounded-full">
            <Share2 className="h-10 w-10 text-cyan-400" />
          </div>
          
          {shareUrl ? (
            <div className="w-full space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <Globe className="h-4 w-4 text-gray-500 shrink-0" />
                <p className="text-xs text-gray-300 truncate flex-1">{shareUrl}</p>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 hover:bg-cyan-500/20" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-gray-500 italic">This link allows anyone with it to view basic attendee and registration stats.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-300">Ready to share <strong>{eventName}</strong> report?</p>
              <Button onClick={handleGenerate} disabled={loading} className="bg-cyan-600 hover:bg-cyan-500 w-full">
                {loading ? "Generating..." : "Create Secure Share Link"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function StakeholderReportView({ token }: { token: string }) {
  const report = useQuery(api.analytics.getSharedReport, { token });

  if (report === undefined) return <div className="p-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-cyan-500" /></div>;
  if (report === null) return <div className="p-20 text-center text-red-400">Invalid or expired share link.</div>;

  const progress = Math.min(100, Math.round((report.registeredCount / report.capacity) * 100));

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-0 uppercase tracking-widest text-[10px]">Stakeholder Report</Badge>
            <h1 className="text-4xl font-black tracking-tight">{report.eventTitle}</h1>
            <p className="text-gray-400">Real-time engagement and registration metrics</p>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-right shrink-0">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Status</p>
            <p className="text-green-400 font-bold capitalize">{report.status}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-gray-400"><Users size={16} /> <span className="text-xs uppercase font-bold">Registrations</span></div>
              <p className="text-3xl font-black">{report.registeredCount} / {report.capacity}</p>
              <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-gray-400"><Calendar size={16} /> <span className="text-xs uppercase font-bold">Event Date</span></div>
              <p className="text-xl font-bold">{format(report.startDate, 'MMMM dd, yyyy')}</p>
              <p className="text-xs text-gray-500 mt-1">Starts at {format(report.startDate, 'p')}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2 text-gray-400"><BarChart3 size={16} /> <span className="text-xs uppercase font-bold">Capacity Utilization</span></div>
              <p className="text-3xl font-black">{progress}%</p>
              <p className="text-xs text-gray-500 mt-1">Confirmed booking rate</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader><CardTitle className="text-lg">Event Overview</CardTitle></CardHeader>
          <CardContent>
            <p className="text-gray-400 leading-relaxed">{report.description}</p>
          </CardContent>
        </Card>

        <footer className="text-center pt-10 border-t border-white/5">
          <p className="text-xs text-gray-600">This is a verified live report generated by Eventra Platform.</p>
        </footer>
      </div>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return <div className={className}>...</div>;
}
