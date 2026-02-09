'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, UserMinus, UserPlus, Mail, ShieldCheck } from 'lucide-react';

interface CoOrganizerManagerProps {
  eventId: Id<"events">;
  organizerId: Id<"users">;
  coOrganizerIds?: Id<"users">[];
}

export function CoOrganizerManager({ eventId, organizerId, coOrganizerIds = [] }: CoOrganizerManagerProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateEventMutation = useMutation(api.events.update);
  
  // To show co-organizer details, we fetch them
  // In a real app, a dedicated query for multiple IDs is better
  const allUsers = useQuery(api.users.list) || [];
  const coOrganizers = allUsers.filter(u => coOrganizerIds.includes(u._id));
  const mainOrganizer = allUsers.find(u => u._id === organizerId);

  const handleAddByEmail = async () => {
    if (!email.trim()) return;
    setIsSearching(true);
    try {
      // Find user by email
      const targetUser = allUsers.find(u => u.email === email.trim());
      
      if (!targetUser) {
        toast({ title: "User not found", description: "No user found with this email address.", variant: "destructive" });
        return;
      }

      if (targetUser._id === organizerId) {
        toast({ title: "Invalid action", description: "You are already the main organizer." });
        return;
      }

      if (coOrganizerIds.includes(targetUser._id)) {
        toast({ title: "Already added", description: "This user is already a co-organizer." });
        return;
      }

      setIsUpdating(true);
      await updateEventMutation({
        id: eventId,
        updates: {
          coOrganizerIds: [...coOrganizerIds, targetUser._id]
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
    <Card className="bg-white/5 border-white/10 text-white">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <ShieldCheck className="text-cyan-400" />
          Co-Organizers
        </CardTitle>
        <CardDescription className="text-gray-400">
          Share management permissions with other team members.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Organizer */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Main Organizer</p>
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
            <Avatar className="h-10 w-10 border border-cyan-500/30">
              <AvatarImage src={mainOrganizer?.image} />
              <AvatarFallback className="bg-cyan-500/10 text-cyan-500">{mainOrganizer?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{mainOrganizer?.name} (You)</p>
              <p className="text-xs text-gray-500">{mainOrganizer?.email}</p>
            </div>
            <Badge className="ml-auto bg-cyan-600">Owner</Badge>
          </div>
        </div>

        {/* Co-Organizers List */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Team Members</p>
          <div className="space-y-2">
            {coOrganizers.length === 0 ? (
              <p className="text-sm text-gray-500 italic p-4 text-center border border-dashed border-white/10 rounded-xl">
                No co-organizers added yet.
              </p>
            ) : (
              coOrganizers.map(co => (
                <div key={co._id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 group">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={co.image} />
                    <AvatarFallback className="bg-purple-500/10 text-purple-500">{co.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{co.name}</p>
                    <p className="text-xs text-gray-500">{co.email}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-auto text-gray-500 hover:text-red-400 hover:bg-red-400/10"
                    onClick={() => handleRemove(co._id)}
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
        <div className="pt-4 border-t border-white/5 space-y-3">
          <Label className="text-sm">Add by Email</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="colleague@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 focus-visible:ring-cyan-500"
              />
            </div>
            <Button 
              onClick={handleAddByEmail} 
              disabled={isSearching || isUpdating || !email}
              className="bg-cyan-600 hover:bg-cyan-500 text-white"
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
