'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Plus, 
  Hash, 
  Users, 
  Settings, 
  Phone, 
  Video, 
  Smile, 
  Paperclip, 
  Send,
  Crown,
  Shield,
  Mic,
  MicOff,
  VideoOff,
  Loader2
} from 'lucide-react';
import { ChatRoom, ChatMessage, User } from '@/types';
import { chatService } from '@/lib/firestore-services';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Mock data
const mockChatRooms: ChatRoom[] = [
  {
    id: 'general',
    name: 'General Discussion',
    description: 'General chat for all event participants',
    type: 'group',
    participants: ['user-1', 'user-2', 'user-3', 'admin-1'],
    createdBy: 'admin-1',
    createdAt: new Date('2024-10-01'),
    lastActivity: new Date('2024-10-10'),
    isArchived: false,
    avatar: '💬',
    settings: {
      allowFiles: true,
      allowVideoCalls: true,
      isPrivate: false
    }
  },
  {
    id: 'ai-enthusiasts',
    name: 'AI Enthusiasts',
    description: 'Chat about AI and machine learning',
    type: 'community',
    participants: ['user-1', 'user-2', 'user-4', 'user-5'],
    createdBy: 'user-2',
    createdAt: new Date('2024-10-03'),
    lastActivity: new Date('2024-10-10'),
    isArchived: false,
    avatar: '🤖',
    settings: {
      allowFiles: true,
      allowVideoCalls: true,
      isPrivate: false
    }
  },
  {
    id: 'startup-founders',
    name: 'Startup Founders',
    description: 'Private group for startup founders',
    type: 'group',
    participants: ['user-2', 'user-3', 'user-6'],
    createdBy: 'user-2',
    createdAt: new Date('2024-10-05'),
    lastActivity: new Date('2024-10-09'),
    isArchived: false,
    avatar: '🚀',
    settings: {
      allowFiles: true,
      allowVideoCalls: true,
      isPrivate: true
    }
  }
];

const mockMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    chatRoomId: 'general',
    senderId: 'user-2',
    content: 'Hey everyone! Excited for today\'s AI workshop. Anyone else attending?',
    type: 'text',
    createdAt: new Date('2024-10-10T09:00:00'),
    isDeleted: false,
    reactions: { '👍': ['user-1', 'user-3'], '🔥': ['user-1'] }
  },
  {
    id: 'msg-2',
    chatRoomId: 'general',
    senderId: 'user-1',
    content: 'Absolutely! Looking forward to the hands-on session.',
    type: 'text',
    createdAt: new Date('2024-10-10T09:05:00'),
    isDeleted: false,
    reactions: {}
  },
  {
    id: 'msg-3',
    chatRoomId: 'general',
    senderId: 'ai-assistant',
    content: 'Hello! I\'m your AI event assistant. Feel free to ask me any questions about today\'s schedule, speakers, or venue information! 🤖',
    type: 'ai_response',
    createdAt: new Date('2024-10-10T09:10:00'),
    isDeleted: false,
    reactions: { '🤖': ['user-1', 'user-2'] }
  }
];

const mockUsers: { [key: string]: User } = {
  'user-1': { id: 'user-1', name: 'Alice Johnson', email: 'alice@example.com' } as User,
  'user-2': { id: 'user-2', name: 'Bob Smith', email: 'bob@example.com' } as User,
  'user-3': { id: 'user-3', name: 'Carol Davis', email: 'carol@example.com' } as User,
  'ai-assistant': { id: 'ai-assistant', name: 'AI Assistant', email: 'ai@ipxhub.com' } as User,
};

interface EnhancedChatClientProps {
  initialRoomId?: string;
}

export default function EnhancedChatClient({ initialRoomId }: EnhancedChatClientProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>(mockChatRooms);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(
    initialRoomId ? mockChatRooms.find(room => room.id === initialRoomId) || null : null
  );
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [newRoom, setNewRoom] = useState({
    name: '',
    description: '',
    type: 'group' as const,
    isPrivate: false
  });

  // Real-time subscription to chat rooms
  useEffect(() => {
    if (!user) return;

    const unsubscribe = chatService.subscribeToChatRooms(
      user.id,
      (rooms) => {
        if (rooms.length > 0) {
          setChatRooms(rooms);
        }
      },
      (error) => {
        console.error('Chat rooms subscription error:', error);
        // Fall back to mock data on error
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Real-time subscription to messages when a room is selected
  useEffect(() => {
    if (!selectedRoom) return;

    setIsLoadingMessages(true);
    
    const unsubscribe = chatService.subscribeToMessages(
      selectedRoom.id,
      (roomMessages) => {
        if (roomMessages.length > 0) {
          setMessages(roomMessages);
        } else {
          // Fall back to mock messages for selected room
          setMessages(mockMessages.filter(msg => msg.chatRoomId === selectedRoom.id));
        }
        setIsLoadingMessages(false);
      },
      (error) => {
        console.error('Messages subscription error:', error);
        setMessages(mockMessages.filter(msg => msg.chatRoomId === selectedRoom.id));
        setIsLoadingMessages(false);
      }
    );

    return () => unsubscribe();
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedRoom || !user || isSending) return;

    setIsSending(true);
    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear immediately for better UX

    const messageData: Omit<ChatMessage, 'id'> = {
      chatRoomId: selectedRoom.id,
      senderId: user.id,
      content: messageContent,
      type: 'text',
      createdAt: new Date(),
      isDeleted: false,
      reactions: {}
    };

    try {
      await chatService.sendMessage(messageData);
      
      // With real-time subscription, the message will appear automatically
      // No need to manually add to local state

      // Check if message mentions AI assistant
      if (messageContent.toLowerCase().includes('@ai') || messageContent.toLowerCase().includes('ai assistant')) {
        // Add AI response
        setTimeout(async () => {
          const aiMessageData: Omit<ChatMessage, 'id'> = {
            chatRoomId: selectedRoom.id,
            senderId: 'ai-assistant',
            content: generateAIResponse(messageContent),
            type: 'ai_response',
            createdAt: new Date(),
            isDeleted: false,
            reactions: {}
          };
          await chatService.sendMessage(aiMessageData);
        }, 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent); // Restore message on error
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send message. Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  }, [newMessage, selectedRoom, user, isSending, toast]);

  const generateAIResponse = (userMessage: string): string => {
    const responses = [
      "I'd be happy to help! Could you be more specific about what you need?",
      "That's a great question! Let me provide you with some information...",
      "Based on today's agenda, I can recommend the following sessions for you.",
      "The event venue has WiFi password: EventGuest2024. Is there anything else I can help with?",
      "For networking opportunities, I suggest checking out the Community section and the Connect feature!",
      "Today's keynote speaker is presenting at 2 PM in the main hall. Don't miss it!"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleCreateRoom = async () => {
    if (!user || !newRoom.name.trim()) return;

    try {
      const roomData: Omit<ChatRoom, 'id'> = {
        name: newRoom.name,
        description: newRoom.description,
        type: newRoom.type,
        participants: [user.id],
        createdBy: user.id,
        createdAt: new Date(),
        lastActivity: new Date(),
        isArchived: false,
        settings: {
          allowFiles: true,
          allowVideoCalls: true,
          isPrivate: newRoom.isPrivate
        }
      };

      await chatService.createChatRoom(roomData);
      setIsCreatingRoom(false);
      setNewRoom({ name: '', description: '', type: 'group', isPrivate: false });
      loadChatRooms();
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const startVideoCall = () => {
    setIsCallActive(true);
    // In a real implementation, this would integrate with WebRTC or a service like Agora/Twilio
  };

  const endCall = () => {
    setIsCallActive(false);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Sidebar - Chat Rooms */}
      <div className="w-80 bg-muted/20 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Chat Rooms</h2>
            <Dialog open={isCreatingRoom} onOpenChange={setIsCreatingRoom}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Chat Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Room name"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    value={newRoom.description}
                    onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="private"
                      checked={newRoom.isPrivate}
                      onChange={(e) => setNewRoom({ ...newRoom, isPrivate: e.target.checked })}
                    />
                    <label htmlFor="private">Private room</label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreatingRoom(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateRoom}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {chatRooms.map((room) => (
              <div
                key={room.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors mb-1",
                  selectedRoom?.id === room.id && "bg-muted"
                )}
                onClick={() => setSelectedRoom(room)}
              >
                <div className="text-2xl">{room.avatar || '#'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{room.name}</h3>
                    {room.settings.isPrivate && (
                      <Shield className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {room.description || `${room.participants.length} members`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{selectedRoom.avatar || '#'}</div>
                  <div>
                    <h2 className="font-semibold">{selectedRoom.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedRoom.participants.length} members
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={startVideoCall}>
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Video Call Overlay */}
            {isCallActive && (
              <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>Video call active</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:text-white hover:bg-white/20"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:text-white hover:bg-white/20"
                    onClick={() => setIsVideoOff(!isVideoOff)}
                  >
                    {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={endCall}
                  >
                    End Call
                  </Button>
                </div>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const sender = mockUsers[message.senderId];
                  const isOwn = message.senderId === user?.id;
                  const isAI = message.senderId === 'ai-assistant';

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        isOwn && "justify-end"
                      )}
                    >
                      {!isOwn && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={isAI ? "bg-primary text-primary-foreground" : ""}>
                            {isAI ? "AI" : getInitials(sender?.name || "U")}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={cn(
                        "max-w-[70%] space-y-1",
                        isOwn && "items-end"
                      )}>
                        {!isOwn && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {sender?.name || "Unknown User"}
                            </span>
                            {isAI && (
                              <Badge variant="secondary" className="text-xs">AI Assistant</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
                        )}
                        
                        <Card className={cn(
                          "p-3",
                          isOwn && "bg-primary text-primary-foreground ml-auto",
                          isAI && "bg-blue-50 border-blue-200"
                        )}>
                          <p className="text-sm">{message.content}</p>
                          
                          {Object.keys(message.reactions).length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {Object.entries(message.reactions).map(([emoji, users]) => (
                                <Badge key={emoji} variant="outline" className="text-xs">
                                  {emoji} {users.length}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </Card>
                        
                        {isOwn && (
                          <div className="text-xs text-muted-foreground text-right">
                            {formatTime(message.createdAt)}
                          </div>
                        )}
                      </div>
                      
                      {isOwn && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {getInitials(user?.name || "U")}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder={`Message #${selectedRoom.name.toLowerCase()}`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="pr-20"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Smile className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={handleSendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Tip: Use @ai to get help from the AI assistant
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Welcome to Chat</h3>
              <p className="text-muted-foreground">
                Select a chat room to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}