'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, usePaginatedQuery } from 'convex/react';
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
  Loader2,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import { useToast } from '@/hooks/use-toast';
import { UserPicker } from './user-picker';

export default function EnhancedChatClient({ initialRoomId }: { initialRoomId?: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const chatRooms = useQuery(api.chat.getRooms) || [];
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(initialRoomId || null);
  
  const { results: messages, status, loadMore } = usePaginatedQuery(
    api.chat.listMessages,
    selectedRoomId ? { roomId: selectedRoomId as any } : "skip" as any,
    { initialNumItems: 20 }
  );

  const sendMessageMutation = useMutation(api.chat.sendMessage);
  const createRoomMutation = useMutation(api.chat.createRoom);
  
  const [newMessage, setNewMessage] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isStartingDM, setIsStartingDM] = useState(false);
  const [uploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ url: string, type: string, name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [newRoom, setNewRoom] = useState({ name: '', type: 'group' as const });

  // ... (rest of helper functions)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      const url = `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${storageId}`;
      setPendingFile({ url, type: file.type, name: file.name });
    } catch (e) {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartDM = async (otherUserId: any, name: string) => {
    if (!user) return;
    try {
      const roomId = await createRoomMutation({
        name: `${user.name} & ${name}`,
        type: 'direct',
        participants: [user._id || user.id, otherUserId] as any
      });
      setSelectedRoomId(roomId);
      setIsStartingDM(false);
    } catch (e) {
      toast({ title: 'Failed to start message', variant: 'destructive' });
    }
  };

  // Order messages chronologically for display
  const sortedMessages = [...(messages || [])].sort((a, b) => a.sentAt - b.sentAt);

  useEffect(() => {
    if (status === "LoadingFirstPage") return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.length, status]);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !pendingFile) || !selectedRoomId) return;
    const content = newMessage.trim();
    const file = pendingFile;
    
    setNewMessage('');
    setPendingFile(null);
    
    try {
      await sendMessageMutation({ 
        roomId: selectedRoomId as any, 
        content: content || (file ? `Shared a ${file.type.startsWith('image/') ? 'photo' : 'file'}` : ''),
        fileUrl: file?.url,
        fileType: file?.type
      });
    } catch (e) {
      toast({ title: 'Failed to send', variant: 'destructive' });
      setNewMessage(content);
      setPendingFile(file);
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
          <div className="flex gap-1">
            <Dialog open={isStartingDM} onOpenChange={setIsStartingDM}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="New Direct Message">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 text-white border-white/10">
                <DialogHeader><DialogTitle>New Message</DialogTitle></DialogHeader>
                <UserPicker onSelect={handleStartDM} excludeIds={[user?._id || user?.id || '']} />
              </DialogContent>
            </Dialog>

            <Dialog open={isCreatingRoom} onOpenChange={setIsCreatingRoom}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="New Group Room">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 text-white border-white/10">
                <DialogHeader><DialogTitle>New Room</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input 
                    placeholder="Room Name (e.g. general-chat)" 
                    value={newRoom.name} 
                    onChange={e => setNewRoom({...newRoom, name: e.target.value})} 
                    className="bg-white/5 border-white/10"
                  />
                  <Button onClick={handleCreateRoom} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white">Create Room</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
                {status === "CanLoadMore" && (
                  <div className="flex justify-center py-2">
                    <Button variant="ghost" size="xs" onClick={() => loadMore(20)} className="text-[10px] h-7">
                      <ChevronUp className="w-3 h-3 mr-1" /> Load earlier messages
                    </Button>
                  </div>
                )}
                
                {status === "LoadingMore" && (
                  <div className="flex justify-center py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
                  </div>
                )}

                {sortedMessages.map((m: any) => {
                  const isMe = m.senderId === (user?._id || user?.id);
                  return (
                    <div key={m._id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                      {!isMe && m.senderName && (
                        <p className="text-xs text-gray-500 mb-1 ml-1">{m.senderName}</p>
                      )}
                      <div className={cn("p-3 rounded-lg max-w-[70%]", isMe ? "bg-cyan-600" : "bg-white/10")}>
                        <p className="text-sm">{m.content}</p>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 mx-1">
                        {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  );
                })}
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
