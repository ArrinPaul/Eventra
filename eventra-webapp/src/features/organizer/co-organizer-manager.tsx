'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserMinus, UserPlus, Mail, ShieldCheck } from 'lucide-react';
import type { Id } from '@/types';

interface CoOrganizerManagerProps {
  eventId: Id<"events">;
  organizerId: Id<"users">;
  coOrganizerIds?: Id<"users">[];
}

export function CoOrganizerManager({ eventId, organizerId, coOrganizerIds = [] }: CoOrganizerManagerProps) {
  const { toast } = useToast();
  
  // Backlog(P3.1): integrate user search and event mutation actions for co-organizer lifecycle.
  const allUsers: any[] = [];
  const coOrganizers = allUsers.filter((u: any) => coOrganizerIds.includes(u.id));
  const updateEventMutation = async (_args: any) => Promise.resolve();
  const [email, setEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const mainOrganizer = allUsers.find((u: any) => u.id === organizerId);

  const handleAddByEmail = async () => {
    if (!email.trim()) return;
    setIsSearching(true);
    try {
      // Find user by email
      const targetUser = allUsers.find((u: any) => u.email === email.trim());
      
      if (!targetUser) {
        toast({ title: "User not found", description: "No user found with this email address.", variant: "destructive" });
        return;
      }

      if (targetUser.id === organizerId) {
        toast({ title: "Invalid action", description: "You are already the main organizer." });
        return;
      }

      if (coOrganizerIds.includes(targetUser.id)) {
        toast({ title: "Already added", description: "This user is already a co-organizer." });
        return;
      }

      setIsUpdating(true);
      await updateEventMutation({
        id: eventId,
        updates: {
          coOrganizerIds: [...coOrganizerIds, targetUser.id]
        }
      });

      toast({ title: "Co-organizer added", description: `${targetUser.name} can now manage this event.` });
      setEmail('');
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to add co-organizer.", variant: "destructive" });
    } finally {
      setIsSearching(false);
      setIsUpdating(false);
    }
  };

  const handleRemove = async (userId: Id<"users">) => {
    setIsUpdating(true);
    try {
      await updateEventMutation({
        id: eventId,
        updates: {
          coOrganizerIds: coOrganizerIds.filter(id => id !== userId)
        }
      });
      toast({ title: "Co-organizer removed" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove co-organizer.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="bg-card border-border text-foreground">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <ShieldCheck className="text-primary" />
          Co-Organizers
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Share management permissions with other team members.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Organizer */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Main Organizer</p>
          <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50">
            <Avatar className="h-10 w-10 border border-primary/30">
              <AvatarImage src={mainOrganizer?.image} />
              <AvatarFallback className="bg-primary/10 text-primary">{mainOrganizer?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{mainOrganizer?.name} (You)</p>
              <p className="text-xs text-muted-foreground">{mainOrganizer?.email}</p>
            </div>
            <Badge className="ml-auto bg-primary">Owner</Badge>
          </div>
        </div>

        {/* Co-Organizers List */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Team Members</p>
          <div className="space-y-2">
            {coOrganizers.length === 0 ? (
              <p className="text-sm text-muted-foreground italic p-4 text-center border border-dashed border-border rounded-xl">
                No co-organizers added yet.
              </p>
            ) : (
              coOrganizers.map((co: any) => (
                <div key={co.id} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50 group">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={co.image} />
                    <AvatarFallback className="bg-purple-500/10 text-purple-500">{co.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{co.name}</p>
                    <p className="text-xs text-muted-foreground">{co.email}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-auto text-muted-foreground hover:text-destructive hover:bg-red-400/10"
                    onClick={() => handleRemove(co.id)}
                    disabled={isUpdating}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add New */}
        <div className="pt-4 border-t border-border/50 space-y-3">
          <Label className="text-sm">Add by Email</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="colleague@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 bg-card border-border focus-visible:ring-cyan-500"
              />
            </div>
            <Button 
              onClick={handleAddByEmail} 
              disabled={isSearching || isUpdating || !email}
              className="bg-primary hover:bg-primary/90 text-foreground"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Invite
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
