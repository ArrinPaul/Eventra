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
  ChevronUp,
  Image as ImageIcon,
  Paperclip,
  FileIcon,
  X,
  FileText
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import { useToast } from '@/hooks/use-toast';
import { UserPicker } from './user-picker';

export default function EnhancedChatClient({ initialRoomId }: { initialRoomId?: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  
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
      await createRoomMutation({ 
        name: newRoom.name, 
        type: newRoom.type, 
        participants: [user._id || user.id] as any 
      });
      setIsCreatingRoom(false);
      setNewRoom({ name: '', type: 'group' });
    } catch (e) {
      toast({ title: 'Failed to create room', variant: 'destructive' });
    }
  };

  const selectedRoom = chatRooms.find((r: any) => r._id === selectedRoomId);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-black text-white">
      {/* Sidebar */}
      <div className="w-80 bg-white/5 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-cyan-400">Conversations</h2>
          <div className="flex gap-1">
            <Dialog open={isStartingDM} onOpenChange={setIsStartingDM}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="New DM">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 text-white border-white/10">
                <DialogHeader><DialogTitle>Start a conversation</DialogTitle></DialogHeader>
                <UserPicker onSelect={handleStartDM} excludeIds={[user?._id || user?.id || '']} />
              </DialogContent>
            </Dialog>

            <Dialog open={isCreatingRoom} onOpenChange={setIsCreatingRoom}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="New Room">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 text-white border-white/10">
                <DialogHeader><DialogTitle>Create Room</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input 
                    placeholder="Room Name" 
                    value={newRoom.name} 
                    onChange={e => setNewRoom({...newRoom, name: e.target.value})} 
                    className="bg-white/5 border-white/10"
                  />
                  <Button onClick={handleCreateRoom} className="w-full bg-cyan-600">Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {chatRooms.map((room: any) => (
              <button 
                key={room._id} 
                className={cn(
                  "w-full text-left p-3 rounded-xl transition-all flex items-center gap-3", 
                  selectedRoomId === room._id ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5"
                )} 
                onClick={() => setSelectedRoomId(room._id)}
              >
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0 font-bold">
                  {room.type === 'direct' ? room.participantNames?.[0]?.[0] || '?' : '#'}
                </div>
                <div className="truncate">
                  <p className="font-medium truncate text-sm">
                    {room.type === 'direct' ? (room.participantNames?.join(', ') || 'Direct Message') : room.name}
                  </p>
                  {room.lastMessagePreview && (
                    <p className="text-xs text-gray-500 truncate">{room.lastMessagePreview}</p>
                  )}
                </div>
                {room.unreadCount > 0 && (
                  <Badge className="ml-auto bg-cyan-600 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                    {room.unreadCount}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                  {selectedRoom.type === 'direct' ? <MessageCircle size={16} /> : <Shield size={16} />}
                </div>
                <h2 className="font-bold text-white">
                  {selectedRoom.type === 'direct' ? (selectedRoom.participantNames?.join(', ') || 'Direct Message') : selectedRoom.name}
                </h2>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6">
                {status === "CanLoadMore" && (
                  <div className="flex justify-center py-2">
                    <Button variant="ghost" size="xs" onClick={() => loadMore(20)} className="text-[10px] h-7 text-gray-500 hover:text-cyan-400">
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
                    <div key={m._id} className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "items-start")}>
                      {!isMe && m.senderName && (
                        <p className="text-[10px] font-bold text-gray-500 mb-1 ml-1 uppercase tracking-tighter">{m.senderName}</p>
                      )}
                      
                      <div className={cn(
                        "p-3 rounded-2xl text-sm relative group", 
                        isMe ? "bg-cyan-600 text-white rounded-tr-none" : "bg-white/10 text-gray-200 rounded-tl-none"
                      )}>
                        {m.fileUrl && (
                          <div className="mb-2">
                            {m.fileType?.startsWith('image/') ? (
                              <img src={m.fileUrl} className="max-w-full rounded-lg cursor-pointer hover:opacity-90" onClick={() => window.open(m.fileUrl)} alt="shared" />
                            ) : (
                              <a href={m.fileUrl} target="_blank" className="flex items-center gap-2 p-2 bg-black/20 rounded-lg hover:bg-black/40 transition-colors">
                                <FileText size={20} className="text-cyan-400" />
                                <span className="text-xs underline truncate max-w-[150px]">View Attachment</span>
                              </a>
                            )}
                          </div>
                        )}
                        <p className="leading-relaxed">{m.content}</p>
                      </div>
                      
                      <p className="text-[9px] text-gray-600 mt-1 mx-1 font-mono">
                        {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Footer */}
            <div className="p-4 border-t border-white/10 bg-black/40">
              {pendingFile && (
                <div className="mb-3 p-2 bg-white/5 rounded-xl border border-cyan-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {pendingFile.type.startsWith('image/') ? <ImageIcon size={16} className="text-cyan-400" /> : <FileIcon size={16} className="text-cyan-400" />}
                    <span className="text-xs text-gray-300 truncate">{pendingFile.name}</span>
                  </div>
                  <button onClick={() => setPendingFile(null)} className="text-gray-500 hover:text-red-400"><X size={14} /></button>
                </div>
              )}
              
              <div className="flex gap-2 items-end">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 shrink-0 text-gray-400 hover:text-cyan-400" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                </Button>
                
                <Textarea 
                  placeholder="Type a message..." 
                  value={newMessage} 
                  onChange={e => setNewMessage(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                  className="min-h-[40px] max-h-32 resize-none bg-white/5 border-white/10 focus-visible:ring-cyan-500 rounded-xl" 
                />
                
                <Button onClick={handleSendMessage} disabled={!newMessage.trim() && !pendingFile} className="h-10 w-10 shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 space-y-4">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-gray-600">
              <MessageCircle size={40} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Your Messages</h3>
              <p className="text-gray-500 max-w-xs mx-auto mt-2">Select a conversation from the sidebar or start a new one to begin chatting.</p>
            </div>
            <Button variant="outline" className="border-white/10" onClick={() => setIsStartingDM(true)}>Start Chatting</Button>
          </div>
        )}
      </div>
    </div>
  );
}