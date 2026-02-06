'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Plus, 
  Shield, 
  Send,
  Loader2
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import { useToast } from '@/hooks/use-toast';

export default function EnhancedChatClient({ initialRoomId }: { initialRoomId?: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const chatRooms = useQuery(api.chat.getRooms) || [];
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(initialRoomId || null);
  const messages = useQuery(api.chat.getMessages, selectedRoomId ? { roomId: selectedRoomId as any } : "skip") || [];
  const sendMessageMutation = useMutation(api.chat.sendMessage);
  const createRoomMutation = useMutation(api.chat.createRoom);
  
  const [newMessage, setNewMessage] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [newRoom, setNewRoom] = useState({ name: '', type: 'group' });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoomId) return;
    const content = newMessage.trim();
    setNewMessage('');
    try {
      await sendMessageMutation({ roomId: selectedRoomId as any, content });
    } catch (e) {
      toast({ title: 'Failed to send', variant: 'destructive' });
      setNewMessage(content);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoom.name.trim() || !user) return;
    try {
      await createRoomMutation({ name: newRoom.name, type: newRoom.type, participants: [user._id || user.id] as any });
      setIsCreatingRoom(false);
      setNewRoom({ name: '', type: 'group' });
    } catch (e) {
      toast({ title: 'Failed to create room', variant: 'destructive' });
    }
  };

  const selectedRoom = chatRooms.find((r: any) => r._id === selectedRoomId);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-black text-white">
      <div className="w-80 bg-white/5 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Chats</h2>
          <Dialog open={isCreatingRoom} onOpenChange={setIsCreatingRoom}>
            <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-4 w-4" /></Button></DialogTrigger>
            <DialogContent className="bg-gray-900 text-white">
              <DialogHeader><DialogTitle>New Room</DialogTitle></DialogHeader>
              <Input placeholder="Room Name" value={newRoom.name} onChange={e => setNewRoom({...newRoom, name: e.target.value})} />
              <Button onClick={handleCreateRoom} className="mt-4">Create</Button>
            </DialogContent>
          </Dialog>
        </div>
        <ScrollArea className="flex-1">
          {chatRooms.map((room: any) => (
            <div key={room._id} className={cn("p-4 cursor-pointer hover:bg-white/10", selectedRoomId === room._id && "bg-white/10")} onClick={() => setSelectedRoomId(room._id)}>
              <p className="font-medium"># {room.name}</p>
            </div>
          ))}
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            <div className="p-4 border-b border-white/10">
              <h2 className="font-bold"># {selectedRoom.name}</h2>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((m: any) => (
                  <div key={m._id} className={cn("flex flex-col", m.senderId === (user?._id || user?.id) ? "items-end" : "items-start")}>
                    <div className={cn("p-3 rounded-lg max-w-[70%]", m.senderId === (user?._id || user?.id) ? "bg-cyan-600" : "bg-white/10")}>
                      <p className="text-sm">{m.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-white/10 flex gap-2">
              <Input placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} className="bg-white/5 border-white/10" />
              <Button onClick={handleSendMessage} size="icon"><Send className="h-4 w-4" /></Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">Select a room to start chatting</div>
        )}
      </div>
    </div>
  );
}
