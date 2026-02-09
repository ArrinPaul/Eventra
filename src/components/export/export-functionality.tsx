'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  FileText, 
  Table as TableIcon, 
  FileJson,
  Calendar,
  Ticket,
  Users,
  Loader2
} from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function ExportFunctionality() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [exporting, setExporting] = useState<string | null>(null);

  const myEvents = useQuery(api.events.getByOrganizer, user ? { organizerId: user._id || user.id as any } : "skip" as any) || [];
  const myTickets = useQuery(api.tickets.getByUserId, user ? { userId: user._id || user.id as any } : "skip" as any) || [];

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportEvents = (format: 'csv' | 'json') => {
    setExporting('events');
    try {
      if (format === 'json') {
        downloadFile(JSON.stringify(myEvents, null, 2), 'my-events.json', 'application/json');
      } else {
        const headers = ['Title', 'Category', 'Date', 'Type', 'Capacity', 'Registered'];
        const csvContent = [
          headers.join(','),
          ...myEvents.map((e: any) => [
            `"${e.title}"`,
            e.category,
            new Date(e.startDate).toLocaleDateString(),
            e.type,
            e.capacity,
            e.registeredCount
          ].join(','))
        ].join('\n');
        downloadFile(csvContent, 'my-events.csv', 'text/csv');
      }
      toast({ title: 'Export successful' });
    } catch (e) {
      toast({ title: 'Export failed', variant: 'destructive' });
    } finally {
      setExporting(null);
    }
  };

  const exportTickets = (format: 'csv' | 'json') => {
    setExporting('tickets');
    try {
      if (format === 'json') {
        downloadFile(JSON.stringify(myTickets, null, 2), 'my-tickets.json', 'application/json');
      } else {
        const headers = ['Event', 'Ticket Number', 'Status', 'Purchase Date', 'Price'];
        const csvContent = [
          headers.join(','),
          ...myTickets.map(t => [
            `"${t.event?.title || 'Unknown'}"`,
            t.ticketNumber,
            t.status,
            new Date(t.purchaseDate).toLocaleDateString(),
            t.price
          ].join(','))
        ].join('\n');
        downloadFile(csvContent, 'my-tickets.csv', 'text/csv');
      }
      toast({ title: 'Export successful' });
    } catch (e) {
      toast({ title: 'Export failed', variant: 'destructive' });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-8 text-white max-w-4xl mx-auto">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Data Export</h1>
        <p className="text-gray-400 mt-2 text-lg">Download your personal and event data in various formats.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Events Export */}
        <Card className="bg-white/5 border-white/10 text-white overflow-hidden group hover:border-cyan-500/30 transition-all">
          <CardHeader className="pb-4">
            <div className="bg-cyan-500/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Calendar className="text-cyan-400" />
            </div>
            <CardTitle>My Events</CardTitle>
            <CardDescription className="text-gray-500">Events you've organized and managed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm py-2 border-b border-white/5">
              <span className="text-gray-400">Total Records</span>
              <span className="font-bold">{myEvents.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => exportEvents('csv')} disabled={exporting === 'events' || myEvents.length === 0} className="border-white/10 hover:bg-white/5">
                <TableIcon className="w-4 h-4 mr-2" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportEvents('json')} disabled={exporting === 'events' || myEvents.length === 0} className="border-white/10 hover:bg-white/5">
                <FileJson className="w-4 h-4 mr-2" /> JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Export */}
        <Card className="bg-white/5 border-white/10 text-white overflow-hidden group hover:border-purple-500/30 transition-all">
          <CardHeader className="pb-4">
            <div className="bg-purple-500/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Ticket className="text-purple-400" />
            </div>
            <CardTitle>My Tickets</CardTitle>
            <CardDescription className="text-gray-500">Your registration and ticket history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm py-2 border-b border-white/5">
              <span className="text-gray-400">Total Records</span>
              <span className="font-bold">{myTickets.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => exportTickets('csv')} disabled={exporting === 'tickets' || myTickets.length === 0} className="border-white/10 hover:bg-white/5">
                <TableIcon className="w-4 h-4 mr-2" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportTickets('json')} disabled={exporting === 'tickets' || myTickets.length === 0} className="border-white/10 hover:bg-white/5">
                <FileJson className="w-4 h-4 mr-2" /> JSON
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-gray-900 to-black border-white/5">
        <CardContent className="p-8 text-center space-y-4">
          <FileText size={48} className="mx-auto text-gray-700" />
          <h3 className="text-xl font-bold">Need a full account backup?</h3>
          <p className="text-gray-500 max-w-md mx-auto">Our upcoming "Full Archive" feature will allow you to download all your data, including chat history and community posts, in a single ZIP file.</p>
          <Button variant="link" className="text-cyan-400">Request account archive</Button>
        </CardContent>
      </Card>
    </div>
  );
}