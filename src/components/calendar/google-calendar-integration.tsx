'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Calendar, Clock, CheckCircle, XCircle, RefreshCw, Settings, ExternalLink } from 'lucide-react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';

interface GoogleCalendarSync {
  googleEventId: string;
  syncedAt: any;
  lastAction: string;
}

interface CalendarSettings {
  autoSync: boolean;
  reminderSettings: {
    email24h: boolean;
    popup1h: boolean;
    popup15min: boolean;
  };
  syncPastEvents: boolean;
  syncPrivateEvents: boolean;
}

interface SyncedEvent {
  id: string;
  title: string;
  startTime: Date;
  googleEventId?: string;
  syncStatus: 'synced' | 'pending' | 'error';
  lastSynced?: Date;
}

export default function GoogleCalendarIntegration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedEvents, setSyncedEvents] = useState<SyncedEvent[]>([]);
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings>({
    autoSync: true,
    reminderSettings: {
      email24h: true,
      popup1h: true,
      popup15min: true,
    },
    syncPastEvents: false,
    syncPrivateEvents: true,
  });
  const [loading, setLoading] = useState(true);

  // Check connection status
  useEffect(() => {
    checkConnectionStatus();
  }, [user]);

  // Load synced events
  useEffect(() => {
    if (isConnected) {
      loadSyncedEvents();
    }
  }, [isConnected]);

  const checkConnectionStatus = async () => {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      if (userData?.googleCalendar?.connected) {
        setIsConnected(true);
        
        // Load settings if they exist
        if (userData.googleCalendar.settings) {
          setCalendarSettings({ ...calendarSettings, ...userData.googleCalendar.settings });
        }
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSyncedEvents = async () => {
    if (!user) return;

    try {
      // Get user's registered events
      const registrationsQuery = query(
        collection(db, 'registrations'),
        where('userId', '==', user.uid),
        where('status', '==', 'registered')
      );
      const registrationsSnapshot = await getDocs(registrationsQuery);
      
      const eventIds = registrationsSnapshot.docs.map(doc => doc.data().eventId);
      
      if (eventIds.length === 0) {
        setSyncedEvents([]);
        return;
      }

      // Get event details
      const events: SyncedEvent[] = [];
      for (const eventId of eventIds) {
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (eventDoc.exists()) {
          const eventData = eventDoc.data();
          const googleSync = eventData.googleCalendarSync?.[user.uid];
          
          events.push({
            id: eventId,
            title: eventData.title,
            startTime: eventData.startTime.toDate(),
            googleEventId: googleSync?.googleEventId,
            syncStatus: googleSync ? 'synced' : 'pending',
            lastSynced: googleSync?.syncedAt?.toDate(),
          });
        }
      }
      
      setSyncedEvents(events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime()));
    } catch (error) {
      console.error('Error loading synced events:', error);
      toast({
        title: "Error",
        description: "Failed to load synced events",
        variant: "destructive",
      });
    }
  };

  const handleConnect = async () => {
    if (!user) return;

    setIsConnecting(true);
    try {
      const getAuthUrl = httpsCallable(functions, 'getGoogleCalendarAuthUrl');
      const result = await getAuthUrl();
      const data = result.data as { authUrl: string };
      
      // Open Google OAuth in new window
      const authWindow = window.open(
        data.authUrl,
        'google_auth',
        'width=600,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for the OAuth completion
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
          // Check if connection was successful
          setTimeout(() => checkConnectionStatus(), 1000);
        }
      }, 1000);

    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Google Calendar. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;

    try {
      const disconnect = httpsCallable(functions, 'disconnectGoogleCalendar');
      await disconnect();
      
      setIsConnected(false);
      setSyncedEvents([]);
      
      toast({
        title: "Disconnected",
        description: "Google Calendar has been disconnected successfully.",
      });
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect Google Calendar",
        variant: "destructive",
      });
    }
  };

  const handleSyncAll = async () => {
    if (!user) return;

    setIsSyncing(true);
    try {
      const syncAll = httpsCallable(functions, 'autoSyncUserEvents');
      const result = await syncAll();
      const data = result.data as { message: string; results: any[] };
      
      toast({
        title: "Sync Complete",
        description: data.message,
      });
      
      // Reload synced events
      await loadSyncedEvents();
    } catch (error) {
      console.error('Error syncing events:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync events to Google Calendar",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncEvent = async (eventId: string, action: 'create' | 'update' | 'delete') => {
    if (!user) return;

    try {
      const syncEvent = httpsCallable(functions, 'syncEventToGoogleCalendar');
      await syncEvent({ eventId, action });
      
      toast({
        title: "Event Synced",
        description: `Event ${action}d in Google Calendar successfully`,
      });
      
      // Reload synced events
      await loadSyncedEvents();
    } catch (error) {
      console.error('Error syncing event:', error);
      toast({
        title: "Sync Failed",
        description: `Failed to ${action} event in Google Calendar`,
        variant: "destructive",
      });
    }
  };

  const updateSettings = async (newSettings: Partial<CalendarSettings>) => {
    if (!user) return;

    try {
      const updatedSettings = { ...calendarSettings, ...newSettings };
      setCalendarSettings(updatedSettings);

      await updateDoc(doc(db, 'users', user.uid), {
        'googleCalendar.settings': updatedSettings,
      });

      toast({
        title: "Settings Updated",
        description: "Google Calendar settings have been saved",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Google Calendar Integration</h2>
          <p className="text-muted-foreground">
            Sync your IPX Hub events with Google Calendar for reminders and better organization
          </p>
        </div>
        <Badge variant={isConnected ? "default" : "secondary"} className="ml-4">
          {isConnected ? (
            <>
              <CheckCircle className="h-4 w-4 mr-1" />
              Connected
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 mr-1" />
              Not Connected
            </>
          )}
        </Badge>
      </div>

      {/* Connection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <div className="text-center py-6">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Connect Google Calendar</p>
              <p className="text-muted-foreground mb-6">
                Automatically sync your registered events to Google Calendar and get reminders
              </p>
              <Button 
                onClick={handleConnect}
                disabled={isConnecting}
                size="lg"
                className="min-w-[200px]"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Connect Google Calendar
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">
                    ✅ Google Calendar Connected
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your events will be automatically synced to Google Calendar
                  </p>
                </div>
                <Button variant="outline" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </div>

              <Separator />

              <div className="flex gap-4">
                <Button
                  onClick={handleSyncAll}
                  disabled={isSyncing}
                  className="flex-1"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync All Events
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Card */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Sync Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-sync new events</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync events when you register for them
                  </p>
                </div>
                <Switch
                  checked={calendarSettings.autoSync}
                  onCheckedChange={(checked) => updateSettings({ autoSync: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sync past events</p>
                  <p className="text-sm text-muted-foreground">
                    Include events that have already ended
                  </p>
                </div>
                <Switch
                  checked={calendarSettings.syncPastEvents}
                  onCheckedChange={(checked) => updateSettings({ syncPastEvents: checked })}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Reminder Settings
              </h4>
              
              <div className="space-y-3 pl-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email reminder (24 hours before)</span>
                  <Switch
                    checked={calendarSettings.reminderSettings.email24h}
                    onCheckedChange={(checked) => 
                      updateSettings({ 
                        reminderSettings: { 
                          ...calendarSettings.reminderSettings, 
                          email24h: checked 
                        }
                      })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Popup reminder (1 hour before)</span>
                  <Switch
                    checked={calendarSettings.reminderSettings.popup1h}
                    onCheckedChange={(checked) => 
                      updateSettings({ 
                        reminderSettings: { 
                          ...calendarSettings.reminderSettings, 
                          popup1h: checked 
                        }
                      })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Popup reminder (15 minutes before)</span>
                  <Switch
                    checked={calendarSettings.reminderSettings.popup15min}
                    onCheckedChange={(checked) => 
                      updateSettings({ 
                        reminderSettings: { 
                          ...calendarSettings.reminderSettings, 
                          popup15min: checked 
                        }
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Synced Events */}
      {isConnected && syncedEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Synced Events</CardTitle>
            <p className="text-sm text-muted-foreground">
              Events that have been synced with your Google Calendar
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {syncedEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {event.startTime.toLocaleDateString()} at {event.startTime.toLocaleTimeString()}
                    </p>
                    {event.lastSynced && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last synced: {event.lastSynced.toLocaleString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant={event.syncStatus === 'synced' ? 'default' : 'secondary'}>
                      {event.syncStatus === 'synced' ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Synced
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </>
                      )}
                    </Badge>
                    
                    <div className="flex gap-1">
                      {event.syncStatus === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSyncEvent(event.id, 'create')}
                        >
                          Sync
                        </Button>
                      )}
                      
                      {event.syncStatus === 'synced' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSyncEvent(event.id, 'update')}
                          >
                            Update
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSyncEvent(event.id, 'delete')}
                          >
                            Remove
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {isConnected && syncedEvents.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No Events to Sync</p>
            <p className="text-muted-foreground">
              Register for events to see them appear here for Google Calendar sync
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}