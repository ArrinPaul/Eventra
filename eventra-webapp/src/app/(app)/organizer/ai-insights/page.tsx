'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { 
  BrainCircuit, 
  Sparkles, 
  Loader2,
  ChevronRight,
  Zap,
  Bot
} from 'lucide-react';
import { getEvents } from '@/app/actions/events';
import { AIInsightsClient } from '@/features/ai/ai-insights-client';
import { cn } from '@/core/utils/utils';

export default function OrganizerAIHubPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setLoading(true);
      try {
        const data = await getEvents({ organizerId: user.id });
        setEvents(data as any);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="container py-20 text-center text-white">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-cyan-500" />
        <p className="mt-4 text-gray-400">Powering up AI Hub...</p>
      </div>
    );
  }

  if (selectedEventId) {
    return (
      <div className="container py-8 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setSelectedEventId(null)} className="text-white hover:bg-white/5">
            <ChevronRight className="rotate-180" />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
               AI Event Pulse <Zap className="text-cyan-400 fill-current" size={24} />
            </h1>
            <p className="text-gray-400">Deep intelligence for {events.find(e => e.id === selectedEventId)?.title}</p>
          </div>
        </div>
        <AIInsightsClient eventId={selectedEventId} />
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 italic">
            AI HUB <Sparkles className="text-cyan-400" />
          </h1>
          <p className="text-gray-400">Leverage advanced generative AI to automate your event operations.</p>
        </div>
        <div className="px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black flex items-center gap-2">
           <Bot size={14} /> SYSTEM: ONLINE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { title: 'Predictive Analytics', desc: 'Forecast attendance using neural networks.', icon: BrainCircuit, color: 'text-purple-400' },
           { title: 'Auto-Tasking', desc: 'Generate complete to-do lists in seconds.', icon: Zap, color: 'text-amber-400' },
           { title: 'Content Forge', desc: 'Create viral social posts tailored for platforms.', icon: Sparkles, color: 'text-emerald-400' },
           { title: 'Smart Reporting', desc: 'Synthesize complex data into AAR reports.', icon: Bot, color: 'text-blue-400' }
         ].map((tool, i) => (
           <Card key={i} className="bg-white/5 border-white/10 group hover:bg-white/[0.07] transition-all cursor-default">
             <CardHeader className="p-5">
               <tool.icon className={cn("h-6 w-6 mb-2", tool.color)} />
               <CardTitle className="text-sm font-bold">{tool.title}</CardTitle>
               <CardDescription className="text-[11px] text-gray-500 leading-relaxed">{tool.desc}</CardDescription>
             </CardHeader>
           </Card>
         ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Select an Event to Analyze</h2>
        <div className="grid gap-4">
          {events.map((event) => (
            <Card 
              key={event.id} 
              className="bg-white/5 border-white/10 text-white group hover:border-cyan-500/30 transition-all cursor-pointer overflow-hidden relative"
              onClick={() => setSelectedEventId(event.id)}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold group-hover:text-cyan-400 transition-colors">{event.title}</h3>
                    <p className="text-xs text-gray-500">{event.category} • {new Date(event.startDate).toLocaleDateString()}</p>
                  </div>
                  <Button variant="ghost" className="group-hover:bg-cyan-500 group-hover:text-white transition-all">
                    Launch AI <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {events.length === 0 && (
            <div className="py-20 text-center bg-white/5 rounded-2xl border-2 border-dashed border-white/10">
               <p className="text-gray-500">No events found to analyze.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
