'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { 
  Award, 
  Plus, 
  Settings, 
  Send, 
  Eye, 
  Layout, 
  Loader2,
  ChevronRight,
  Search,
  FileText
} from 'lucide-react';
import { getEvents } from '@/app/actions/events';
import { getCertificateTemplates } from '@/app/actions/certificates';
import { CertificateTemplateBuilder } from '@/features/certificates/certificate-template-builder';
import { BulkDistributionClient } from '@/features/certificates/bulk-distribution-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

export default function OrganizerCertificatesPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'builder' | 'distribute'>('list');
  const [activeTemplate, setActiveTemplate] = useState<any>(null);

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
        <p className="mt-4 text-gray-400">Loading your certificate workspace...</p>
      </div>
    );
  }

  const selectedEvent = events.find(e => e.id === selectedEventId);

  if (view === 'builder' && selectedEventId) {
    return (
      <div className="h-[calc(100vh-4rem)]">
        <CertificateTemplateBuilder 
          eventId={selectedEventId} 
          initialTemplate={activeTemplate} 
        />
      </div>
    );
  }

  if (view === 'distribute' && selectedEventId) {
    return (
      <div className="container py-8 space-y-6 text-white">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setView('list')}>
            <ChevronRight className="rotate-180" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Distribute Certificates</h1>
            <p className="text-gray-400">Event: {selectedEvent?.title}</p>
          </div>
        </div>
        <BulkDistributionClient 
          eventId={selectedEventId} 
          initialAttendees={[]} // In a real app, fetch checked-in attendees
          templateHtml="<div style='padding: 50px; text-align: center;'><h1>Certificate</h1><p>{attendee_name}</p></div>" 
        />
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8 text-white">
      <div>
        <h1 className="text-3xl font-bold">Certificate Manager</h1>
        <p className="text-gray-400">Create, design, and distribute certificates for your events.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader>
            <div className="p-2 w-fit bg-cyan-500/10 rounded-lg mb-2"><Award className="text-cyan-400" /></div>
            <CardTitle>AI Personalization</CardTitle>
            <CardDescription className="text-gray-400">Every certificate includes a unique AI-generated message based on the event theme.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader>
            <div className="p-2 w-fit bg-purple-500/10 rounded-lg mb-2"><Layout className="text-purple-400" /></div>
            <CardTitle>Drag-and-Drop</CardTitle>
            <CardDescription className="text-gray-400">Custom designer for your certificate layouts with real-time preview.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader>
            <div className="p-2 w-fit bg-emerald-500/10 rounded-lg mb-2"><Send className="text-emerald-400" /></div>
            <CardTitle>Bulk Distribution</CardTitle>
            <CardDescription className="text-gray-400">Send thousands of certificates via email or download as ZIP in seconds.</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="bg-white/5 border-white/10 text-white">
        <CardHeader>
          <CardTitle>Your Events</CardTitle>
          <CardDescription>Select an event to manage its certificates.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.map(event => (
              <div key={event.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 group hover:border-cyan-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-cyan-900/20 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold">{event.title}</h3>
                    <p className="text-xs text-gray-500">{event.registeredCount || 0} Registrations • {event.status}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="border-white/10" onClick={() => { setSelectedEventId(event.id); setView('builder'); }}>
                    <Settings className="w-4 h-4 mr-2" /> Design Template
                  </Button>
                  <Button size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white" onClick={() => { setSelectedEventId(event.id); setView('distribute'); }}>
                    <Send className="w-4 h-4 mr-2" /> Distribute
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
