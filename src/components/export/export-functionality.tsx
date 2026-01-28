'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  Download, 
  FileText, 
  Calendar, 
  Users, 
  BarChart3, 
  Table, 
  FileSpreadsheet,
  FileJson,
  Loader2
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  dateRange: 'all' | 'year' | 'month' | 'week';
  includePrivate: boolean;
}

interface ExportableData {
  events: any[];
  registrations: any[];
  communities: any[];
  connections: any[];
  messages: any[];
  analytics: any[];
}

export default function ExportFunctionality() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    dateRange: 'all',
    includePrivate: false
  });
  const [dataStats, setDataStats] = useState({
    events: 0,
    registrations: 0,
    communities: 0,
    connections: 0,
    messages: 0
  });

  useEffect(() => {
    if (user) {
      loadDataStats();
    }
  }, [user]);

  const loadDataStats = async () => {
    if (!user) return;

    try {
      // Get user's data counts
      const [events, registrations, communities, connections, messages] = await Promise.all([
        getDocs(query(collection(db, 'events'), where('organizerId', '==', user.uid))),
        getDocs(query(collection(db, 'registrations'), where('userId', '==', user.uid))),
        getDocs(query(collection(db, 'communities'), where('members', 'array-contains', user.uid))),
        getDocs(query(collection(db, 'connections'), where('userId', '==', user.uid))),
        getDocs(query(collection(db, 'messages'), where('userId', '==', user.uid), limit(100)))
      ]);

      setDataStats({
        events: events.size,
        registrations: registrations.size,
        communities: communities.size,
        connections: connections.size,
        messages: messages.size
      });
    } catch (error) {
      console.error('Error loading data stats:', error);
    }
  };

  const getDateFilter = () => {
    const now = new Date();
    switch (exportOptions.dateRange) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      case 'year':
        return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      default:
        return null;
    }
  };

  const fetchUserData = async (): Promise<ExportableData> => {
    if (!user) throw new Error('User not authenticated');

    const dateFilter = getDateFilter();
    const data: ExportableData = {
      events: [],
      registrations: [],
      communities: [],
      connections: [],
      messages: [],
      analytics: []
    };

    try {
      // Fetch Events (created by user)
      let eventsQuery = query(
        collection(db, 'events'),
        where('organizerId', '==', user.uid)
      );
      if (dateFilter) {
        eventsQuery = query(eventsQuery, where('createdAt', '>=', dateFilter));
      }
      const eventsSnapshot = await getDocs(eventsQuery);
      data.events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        startTime: doc.data().startTime?.toDate?.()?.toISOString() || null,
        endTime: doc.data().endTime?.toDate?.()?.toISOString() || null
      }));

      // Fetch Registrations
      let registrationsQuery = query(
        collection(db, 'registrations'),
        where('userId', '==', user.uid)
      );
      if (dateFilter) {
        registrationsQuery = query(registrationsQuery, where('registeredAt', '>=', dateFilter));
      }
      const registrationsSnapshot = await getDocs(registrationsQuery);
      data.registrations = registrationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        registeredAt: doc.data().registeredAt?.toDate?.()?.toISOString() || null
      }));

      // Fetch Communities
      const communitiesSnapshot = await getDocs(query(
        collection(db, 'communities'),
        where('members', 'array-contains', user.uid)
      ));
      data.communities = communitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        description: doc.data().description,
        category: doc.data().category,
        memberCount: doc.data().memberCount,
        joinedAt: doc.data().members?.find((m: any) => m.userId === user.uid)?.joinedAt?.toDate?.()?.toISOString() || null
      }));

      // Fetch Connections
      const connectionsSnapshot = await getDocs(query(
        collection(db, 'connections'),
        where('userId', '==', user.uid)
      ));
      data.connections = connectionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        connectedAt: doc.data().connectedAt?.toDate?.()?.toISOString() || null
      }));

      // Fetch Messages (limited for privacy)
      if (exportOptions.includePrivate) {
        let messagesQuery = query(
          collection(db, 'messages'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(1000)
        );
        if (dateFilter) {
          messagesQuery = query(messagesQuery, where('timestamp', '>=', dateFilter));
        }
        const messagesSnapshot = await getDocs(messagesQuery);
        data.messages = messagesSnapshot.docs.map(doc => ({
          id: doc.id,
          content: doc.data().content,
          timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || null,
          roomId: doc.data().roomId,
          type: doc.data().type
        }));
      }

      return data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  };

  const convertToCSV = (data: ExportableData): string => {
    const sections = [];

    // Events CSV
    if (data.events.length > 0) {
      sections.push('=== EVENTS ===');
      const eventHeaders = ['ID', 'Title', 'Description', 'Category', 'Location', 'Start Time', 'End Time', 'Created At'];
      sections.push(eventHeaders.join(','));
      data.events.forEach(event => {
        const row = [
          event.id,
          `"${event.title || ''}"`,
          `"${event.description || ''}"`,
          event.category || '',
          `"${event.location || ''}"`,
          event.startTime || '',
          event.endTime || '',
          event.createdAt || ''
        ];
        sections.push(row.join(','));
      });
      sections.push('');
    }

    // Registrations CSV
    if (data.registrations.length > 0) {
      sections.push('=== REGISTRATIONS ===');
      const regHeaders = ['ID', 'Event ID', 'Status', 'Registered At'];
      sections.push(regHeaders.join(','));
      data.registrations.forEach(reg => {
        const row = [
          reg.id,
          reg.eventId || '',
          reg.status || '',
          reg.registeredAt || ''
        ];
        sections.push(row.join(','));
      });
      sections.push('');
    }

    // Communities CSV
    if (data.communities.length > 0) {
      sections.push('=== COMMUNITIES ===');
      const commHeaders = ['ID', 'Name', 'Description', 'Category', 'Member Count', 'Joined At'];
      sections.push(commHeaders.join(','));
      data.communities.forEach(comm => {
        const row = [
          comm.id,
          `"${comm.name || ''}"`,
          `"${comm.description || ''}"`,
          comm.category || '',
          comm.memberCount || 0,
          comm.joinedAt || ''
        ];
        sections.push(row.join(','));
      });
      sections.push('');
    }

    return sections.join('\n');
  };

  const convertToJSON = (data: ExportableData): string => {
    const exportData = {
      exportDate: new Date().toISOString(),
      userId: user?.uid,
      options: exportOptions,
      data: {
        events: data.events,
        registrations: data.registrations,
        communities: data.communities,
        connections: data.connections,
        messages: exportOptions.includePrivate ? data.messages : []
      },
      summary: {
        totalEvents: data.events.length,
        totalRegistrations: data.registrations.length,
        totalCommunities: data.communities.length,
        totalConnections: data.connections.length,
        totalMessages: data.messages.length
      }
    };

    return JSON.stringify(exportData, null, 2);
  };

  const generatePDF = async (data: ExportableData): Promise<Blob> => {
    // This is a simplified PDF generation example
    // In a real implementation, you would use a library like jsPDF or Puppeteer
    const content = `
      EventOS Data Export
      Generated: ${new Date().toLocaleString()}
      User: ${user?.email}
      
      SUMMARY:
      - Events Created: ${data.events.length}
      - Event Registrations: ${data.registrations.length}
      - Communities Joined: ${data.communities.length}
      - Connections Made: ${data.connections.length}
      - Messages Sent: ${data.messages.length}
      
      EVENTS:
      ${data.events.map(event => `
        • ${event.title} (${event.startTime})
          Location: ${event.location}
          Category: ${event.category}
      `).join('')}
      
      REGISTRATIONS:
      ${data.registrations.map(reg => `
        • Event ${reg.eventId} - ${reg.status}
          Registered: ${reg.registeredAt}
      `).join('')}
      
      COMMUNITIES:
      ${data.communities.map(comm => `
        • ${comm.name} (${comm.memberCount} members)
          Category: ${comm.category}
      `).join('')}
    `;

    return new Blob([content], { type: 'application/pdf' });
  };

  const downloadFile = (content: string | Blob, filename: string, mimeType: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await fetchUserData();
      const timestamp = new Date().toISOString().split('T')[0];
      
      let filename: string;
      let content: string | Blob;
      let mimeType: string;

      switch (exportOptions.format) {
        case 'csv':
          filename = `eventos-data-${timestamp}.csv`;
          content = convertToCSV(data);
          mimeType = 'text/csv';
          break;
        
        case 'json':
          filename = `eventos-data-${timestamp}.json`;
          content = convertToJSON(data);
          mimeType = 'application/json';
          break;
        
        case 'pdf':
          filename = `eventos-data-${timestamp}.pdf`;
          content = await generatePDF(data);
          mimeType = 'application/pdf';
          break;
        
        default:
          throw new Error('Invalid export format');
      }

      downloadFile(content, filename, mimeType);

      toast({
        title: "Export Complete",
        description: `Your data has been exported as ${filename}`,
      });

    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportOptions_items = [
    {
      type: 'events',
      label: 'My Events',
      description: 'Events you\'ve created and organized',
      count: dataStats.events,
      icon: Calendar
    },
    {
      type: 'registrations',
      label: 'Event Registrations',
      description: 'Events you\'ve registered for',
      count: dataStats.registrations,
      icon: FileText
    },
    {
      type: 'communities',
      label: 'Communities',
      description: 'Communities you\'ve joined',
      count: dataStats.communities,
      icon: Users
    },
    {
      type: 'connections',
      label: 'Connections',
      description: 'Your professional connections',
      count: dataStats.connections,
      icon: Users
    },
    {
      type: 'messages',
      label: 'Messages',
      description: 'Your chat messages (private data)',
      count: dataStats.messages,
      icon: FileText
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Export Your Data</h2>
        <p className="text-muted-foreground">
          Download your EventOS data in various formats for backup or analysis
        </p>
      </div>

      {/* Data Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exportOptions_items.map((item) => (
          <Card key={item.type}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{item.label}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <Badge variant="secondary">{item.count}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Export Format</label>
              <Select 
                value={exportOptions.format}
                onValueChange={(value: 'csv' | 'json' | 'pdf') => 
                  setExportOptions(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <Table className="h-4 w-4" />
                      CSV (Spreadsheet)
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-4 w-4" />
                      JSON (Structured Data)
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      PDF (Document)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select 
                value={exportOptions.dateRange}
                onValueChange={(value: 'all' | 'year' | 'month' | 'week') => 
                  setExportOptions(prev => ({ ...prev, dateRange: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="year">Past Year</SelectItem>
                  <SelectItem value="month">Past Month</SelectItem>
                  <SelectItem value="week">Past Week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Privacy</label>
              <Select 
                value={exportOptions.includePrivate ? 'include' : 'exclude'}
                onValueChange={(value) => 
                  setExportOptions(prev => ({ ...prev, includePrivate: value === 'include' }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exclude">Exclude Private Data</SelectItem>
                  <SelectItem value="include">Include Messages & Private Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Export Descriptions */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium">What will be exported:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Your created events and their details</li>
              <li>• Event registrations and attendance history</li>
              <li>• Communities you've joined and participation data</li>
              <li>• Professional connections and networking activity</li>
              {exportOptions.includePrivate && (
                <li>• Private messages and chat history (if enabled)</li>
              )}
              <li>• Account settings and preferences</li>
            </ul>
          </div>

          {/* Export Button */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Ready to Export</h4>
              <p className="text-sm text-muted-foreground">
                Export format: {exportOptions.format.toUpperCase()} • 
                Range: {exportOptions.dateRange === 'all' ? 'All time' : `Past ${exportOptions.dateRange}`} • 
                Privacy: {exportOptions.includePrivate ? 'Include private' : 'Public data only'}
              </p>
            </div>
            <Button onClick={handleExport} disabled={loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle>Data Usage & Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium">What we collect:</h4>
              <p className="text-muted-foreground">
                We collect only the data necessary to provide our services, including events you create, 
                registrations, community participation, and communication preferences.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium">Your exported data:</h4>
              <p className="text-muted-foreground">
                The exported file contains your personal data in a machine-readable format. 
                Please store it securely and delete it when no longer needed.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium">Data retention:</h4>
              <p className="text-muted-foreground">
                You can request deletion of your account and data at any time through your account settings. 
                Some data may be retained for legal or security purposes as outlined in our privacy policy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}