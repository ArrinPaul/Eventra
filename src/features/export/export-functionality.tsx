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
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface ExportFunctionalityProps {
  initialEvents?: any[];
  initialTickets?: any[];
}

export default function ExportFunctionality({ initialEvents = [], initialTickets = [] }: ExportFunctionalityProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [exporting, setExporting] = useState<string | null>(null);

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
        downloadFile(JSON.stringify(initialEvents, null, 2), 'my-events.json', 'application/json');
      } else {
        const headers = ['Title', 'Category', 'Date', 'Type', 'Capacity', 'Registered'];
        const csvContent = [
          headers.join(','),
          ...initialEvents.map((e: any) => [
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
        downloadFile(JSON.stringify(initialTickets, null, 2), 'my-tickets.json', 'application/json');
      } else {
        const headers = ['Event', 'Ticket Number', 'Status', 'Purchase Date', 'Price'];
        const csvContent = [
          headers.join(','),
          ...initialTickets.map((t: any) => [
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
    <div className="space-y-8 text-foreground max-w-4xl mx-auto">
      <div>
        <h1 className="text-4xl font-black font-headline tracking-tight">Data Export</h1>
        <p className="text-muted-foreground mt-2 text-lg font-medium">Download your personal and event data in various formats.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Events Export */}
        <Card className="bg-card border-border/50 text-foreground overflow-hidden group hover:border-primary/40 transition-all duration-300 rounded-[2rem] shadow-xl">
          <CardHeader className="pb-6 p-8 bg-primary/[0.02] border-b border-border/50">
            <div className="bg-primary/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Calendar className="text-primary h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-black font-headline">My Events</CardTitle>
            <CardDescription className="text-muted-foreground font-medium">Events you&apos;ve organized and managed</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center justify-between text-sm py-3 border-b border-border/50">
              <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Total Records</span>
              <span className="font-black text-lg">{initialEvents.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <Button variant="outline" size="lg" onClick={() => exportEvents('csv')} disabled={exporting === 'events' || initialEvents.length === 0} className="border-2 rounded-xl font-bold">
                <TableIcon className="w-4 h-4 mr-2" /> CSV
              </Button>
              <Button variant="outline" size="lg" onClick={() => exportEvents('json')} disabled={exporting === 'events' || initialEvents.length === 0} className="border-2 rounded-xl font-bold">
                <FileJson className="w-4 h-4 mr-2" /> JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Export */}
        <Card className="bg-card border-border/50 text-foreground overflow-hidden group hover:border-primary/40 transition-all duration-300 rounded-[2rem] shadow-xl">
          <CardHeader className="pb-6 p-8 bg-primary/[0.02] border-b border-border/50">
            <div className="bg-primary/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Ticket className="text-primary h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-black font-headline">My Tickets</CardTitle>
            <CardDescription className="text-muted-foreground font-medium">Your registration and ticket history</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center justify-between text-sm py-3 border-b border-border/50">
              <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Total Records</span>
              <span className="font-black text-lg">{initialTickets.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <Button variant="outline" size="lg" onClick={() => exportTickets('csv')} disabled={exporting === 'tickets' || initialTickets.length === 0} className="border-2 rounded-xl font-bold">
                <TableIcon className="w-4 h-4 mr-2" /> CSV
              </Button>
              <Button variant="outline" size="lg" onClick={() => exportTickets('json')} disabled={exporting === 'tickets' || initialTickets.length === 0} className="border-2 rounded-xl font-bold">
                <FileJson className="w-4 h-4 mr-2" /> JSON
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border/50 rounded-[2.5rem] shadow-2xl overflow-hidden border-2">
        <CardContent className="p-12 text-center space-y-6">
          <div className="bg-primary/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={40} className="text-primary/40" />
          </div>
          <h3 className="text-2xl font-black font-headline">Need a full account backup?</h3>
          <p className="text-muted-foreground max-w-md mx-auto font-medium">Our upcoming &quot;Full Archive&quot; feature will allow you to download all your data, including chat history and community posts, in a single ZIP file.</p>
          <Button variant="link" className="text-primary font-black text-lg">Request account archive</Button>
        </CardContent>
      </Card>
    </div>
  );
}
