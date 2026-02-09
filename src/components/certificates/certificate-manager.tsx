'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  Users, 
  CheckCircle2, 
  Loader2, 
  RefreshCw,
  Send,
  Search,
  ChevronRight,
  FileText
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Id } from '../../../convex/_generated/dataModel';

export function CertificateManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedEventId, setSelectedEventId] = useState<Id<"events"> | null>(null);
  const [isIssuing, setIsIssuing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch events organized by current user
  const events = useQuery(api.events.getByOrganizer, user ? { organizerId: user._id || user.id as any } : "skip" as any) || [];
  
  // Fetch registrations for selected event
  const attendees = useQuery(api.registrations.getByEvent, selectedEventId ? { eventId: selectedEventId } : "skip" as any) || [];
  
  // Fetch already issued certificates
  const issuedCertificates = useQuery(api.certificates.getByEvent, selectedEventId ? { eventId: selectedEventId } : "skip" as any) || [];
  
  const bulkIssueMutation = useMutation(api.certificates.bulkIssue);

  const selectedEvent = events.find(e => e._id === selectedEventId);
  const issuedUserIds = new Set(issuedCertificates.map(c => c.userId));
  
  const filteredAttendees = attendees.filter((a: any) => 
    a.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const eligibleCount = attendees.filter((a: any) => a.status === 'confirmed' && !issuedUserIds.has(a.userId)).length;

  const handleBulkIssue = async () => {
    if (!selectedEventId) return;
    setIsIssuing(true);
    try {
      const result = await bulkIssueMutation({ eventId: selectedEventId });
      toast({
        title: "Certificates Issued",
        description: `Successfully issued ${result.issued} new certificates.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to issue certificates",
        variant: "destructive"
      });
    } finally {
      setIsIssuing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Selection */}
        <Card className="bg-white/5 border-white/10 text-white lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              Select Event
            </CardTitle>
            <CardDescription className="text-gray-500">Choose an event to manage certificates</CardDescription>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1">
              {events.length === 0 ? (
                <p className="text-center py-10 text-gray-500 text-sm">No events found.</p>
              ) : (
                events.map(event => (
                  <button
                    key={event._id}
                    onClick={() => setSelectedEventId(event._id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${
                      selectedEventId === event._id ? 'bg-cyan-600 text-white' : 'hover:bg-white/5 text-gray-400'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <p className="font-medium truncate">{event.title}</p>
                      <p className={`text-xs ${selectedEventId === event._id ? 'text-cyan-100' : 'text-gray-500'}`}>
                        {event.registeredCount} attendees
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${selectedEventId === event._id ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Manager Main Area */}
        <Card className="bg-white/5 border-white/10 text-white lg:col-span-2">
          {selectedEventId ? (
            <>
              <CardHeader className="border-b border-white/5 pb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-cyan-500/20 p-3 rounded-2xl">
                      <Award className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{selectedEvent?.title}</CardTitle>
                      <CardDescription className="text-gray-500">
                        {issuedCertificates.length} issued • {eligibleCount} pending
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    onClick={handleBulkIssue} 
                    disabled={isIssuing || eligibleCount === 0}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white"
                  >
                    {isIssuing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Issue {eligibleCount} Certificates
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 border-b border-white/5">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input 
                      type="text"
                      placeholder="Search attendees..." 
                      className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-gray-500 uppercase text-[10px] tracking-wider border-b border-white/5">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Attendee</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold">Certificate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredAttendees.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-10 text-center text-gray-500">No attendees found matching search.</td>
                        </tr>
                      ) : (
                        filteredAttendees.map((attendee: any) => (
                          <tr key={attendee._id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-medium text-white">{attendee.userName || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{attendee.userEmail}</p>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="outline" className={
                                attendee.status === 'confirmed' 
                                  ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                  : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                              }>
                                {attendee.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              {issuedUserIds.has(attendee.userId) ? (
                                <div className="flex items-center gap-1.5 text-green-500">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span className="text-xs font-medium">Issued</span>
                                </div>
                              ) : attendee.status === 'confirmed' ? (
                                <span className="text-xs text-gray-500 italic">Ready to issue</span>
                              ) : (
                                <span className="text-xs text-red-400/50">Ineligible</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center px-10">
              <div className="bg-white/5 p-6 rounded-full mb-6">
                <FileText className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Event Selected</h3>
              <p className="text-gray-500 max-w-sm">Select an event from the list on the left to start issuing and managing certificates for your attendees.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
