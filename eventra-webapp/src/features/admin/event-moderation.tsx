'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// // 
import { useToast } from '@/hooks/use-toast';
import { Check, X, ShieldAlert, Loader2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function EventModeration() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  const pageSize = 10;
  
  const events: any[] = []; // Placeholder for events
  const paginationStatus = 'Exhausted';
  const loadMore = (num: number) => {
    // TODO: Implement pagination via server action
  };
  const moderateMutation = async (args: any) => {};

  const handleModerate = async (eventId: string, action: 'approve' | 'reject' | 'suspend') => {
    try {
      await moderateMutation({ eventId, action });
      toast({ title: `Event ${action}ed` });
    } catch (e) {
      toast({ title: 'Moderation failed', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 text-white pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Event Moderation</h2>
        <p className="text-muted-foreground">Review and moderate published events for community safety</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/40 border-border text-white p-1">
          <TabsTrigger value="pending" className="gap-2"><Clock size={16} /> Needs Review</TabsTrigger>
          <TabsTrigger value="all" className="gap-2"><ShieldAlert size={16} /> All Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          {events.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground border border-dashed border-border rounded-2xl bg-muted/40">
              <Check size={48} className="mx-auto mb-4 opacity-20" />
              <p>No events found for moderation.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {events.map((e: any) => (
                <Card key={e._id} className="bg-muted/40 border-border text-white overflow-hidden hover:border-primary/30 transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/30">{e.category}</Badge>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground border-border">{e.status}</Badge>
                        </div>
                        <h3 className="text-xl font-bold">{e.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{e.description}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground pt-2 font-mono">
                          <span>By: {e.organizerId}</span>
                          <span>Capacity: {e.capacity}</span>
                        </div>
                      </div>
                      <div className="flex md:flex-col gap-2 justify-end min-w-[120px]">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-500" 
                          onClick={() => handleModerate(e._id, 'approve')}
                          disabled={e.status === 'published'}
                        >
                          <Check className="w-4 h-4 mr-2" /> Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          onClick={() => handleModerate(e._id, 'reject')}
                        >
                          <X className="w-4 h-4 mr-2" /> Reject
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-muted-foreground hover:text-white"
                          onClick={() => handleModerate(e._id, 'suspend')}
                        >
                          <ShieldAlert className="w-4 h-4 mr-2" /> Suspend
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {false && (
                <div className="flex justify-center pt-2">
                  <Button variant="outline" className="border-border" onClick={() => loadMore(pageSize)}>
                    Load More Events
                  </Button>
                </div>
              )}

              {false && (
                <div className="py-4 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto text-primary" /></div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

