'use client';

import React, { useState } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// // 
// import { useMutation, usePaginatedQuery } from 'convex/react';
// import { api } from '../../../convex/_generated/api';
// import { useToast } from '@/hooks/use-toast';
// import { Check, X, ShieldAlert, Loader2, Clock } from 'lucide-react';
// import { Badge } from '@/components/ui/badge';
// // import { Id } from '../../../convex/_generated/dataModel';

export default function EventModeration() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  const pageSize = 10;
  
  const {
    results: events,
    status: paginationStatus,
    loadMore,
  } = usePaginatedQuery(
    api.admin.getEventsForModeration,
    {
      status: activeTab === 'pending' ? 'published' : 'all',
    },
    { initialNumItems: pageSize }
  );
//   
//   const moderateMutation = useMutation(api.admin.moderateEvent);

  const handleModerate = async (eventId: Id<'events'>, action: 'approve' | 'reject' | 'suspend') => {
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
        <p className="text-gray-400">Review and moderate published events for community safety</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 border-white/10 text-white p-1">
          <TabsTrigger value="pending" className="gap-2"><Clock size={16} /> Needs Review</TabsTrigger>
          <TabsTrigger value="all" className="gap-2"><ShieldAlert size={16} /> All Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          {paginationStatus === 'LoadingFirstPage' ? (
            <div className="py-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-cyan-500" /></div>
          ) : events.length === 0 ? (
            <div className="py-20 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl bg-white/5">
              <Check size={48} className="mx-auto mb-4 opacity-20" />
              <p>No events found for moderation.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {events.map((e: any) => (
                <Card key={e._id} className="bg-white/5 border-white/10 text-white overflow-hidden hover:border-cyan-500/30 transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase font-bold text-cyan-400 border-cyan-500/30">{e.category}</Badge>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold text-gray-400 border-white/10">{e.status}</Badge>
                        </div>
                        <h3 className="text-xl font-bold">{e.title}</h3>
                        <p className="text-sm text-gray-400 line-clamp-2">{e.description}</p>
                        <div className="flex gap-4 text-xs text-gray-500 pt-2 font-mono">
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
                          className="text-gray-500 hover:text-white"
                          onClick={() => handleModerate(e._id, 'suspend')}
                        >
                          <ShieldAlert className="w-4 h-4 mr-2" /> Suspend
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {paginationStatus === 'CanLoadMore' && (
                <div className="flex justify-center pt-2">
                  <Button variant="outline" className="border-white/10" onClick={() => loadMore(pageSize)}>
                    Load More Events
                  </Button>
                </div>
              )}

              {paginationStatus === 'LoadingMore' && (
                <div className="py-4 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto text-cyan-500" /></div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
