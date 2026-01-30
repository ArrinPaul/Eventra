'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { ChatMessage, UserRole, User as UserType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Smile, Bot, Sparkles, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getBotAnnouncement } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  limit,
  where,
  or,
  Timestamp
} from 'firebase/firestore';
import { db, FIRESTORE_COLLECTIONS } from '@/lib/firebase';


const EMOJIS = ['😀', '😂', '😍', '🤔', '👍', '🎉', '🚀', '💻'];
const CHAT_ROOM_ID = 'global-chat'; // Default global chat room

export default function ChatClient() {
  const { user, users, awardPoints } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [privateTo, setPrivateTo] = useState<string>('all');
  const [botLoading, setBotLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { organizers, attendees } = useMemo(() => {
    const organizers = users.filter(u => u.role === 'organizer' && u.id !== user?.id);
    const attendees = users.filter(u => u.role !== 'organizer' && u.id !== user?.id);
    return { organizers, attendees };
  }, [users, user]);
  
  const allUsersMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);

  // Real-time Firestore listener for messages
  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    const messagesRef = collection(db, FIRESTORE_COLLECTIONS.MESSAGES);
    
    // Query messages for global chat room
    // Include public messages and private messages involving the current user
    const q = query(
      messagesRef,
      where('chatRoomId', '==', CHAT_ROOM_ID),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newMessages: ChatMessage[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Filter private messages on client side for security
          const isPublic = !data.to;
          const isForMe = data.to === user.id;
          const isFromMe = data.senderId === user.id;
          
          if (isPublic || isForMe || isFromMe) {
            newMessages.push({
              id: doc.id,
              chatRoomId: data.chatRoomId,
              senderId: data.senderId,
              user: data.user || {
                id: data.senderId,
                name: data.senderName || 'Unknown',
                role: data.senderRole || 'attendee',
                isBot: data.isBot || false,
              },
              to: data.to,
              content: data.content,
              timestamp: data.timestamp instanceof Timestamp 
                ? data.timestamp.toMillis() 
                : data.timestamp,
              createdAt: data.createdAt?.toDate?.() || new Date(),
            });
          }
        });
        
        setMessages(newMessages);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error listening to messages:', error);
        setIsLoading(false);
        toast({
          variant: 'destructive',
          title: 'Connection Error',
          description: 'Failed to load messages. Please refresh the page.',
        });
      }
    );

    return () => unsubscribe();
  }, [user, toast]);

  useEffect(() => {
    // Scroll to bottom on new message
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !user) return;
    
    const messageData = {
      chatRoomId: CHAT_ROOM_ID,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      user: { 
        id: user.id, 
        name: user.name, 
        role: user.role as UserRole 
      },
      content: newMessage,
      timestamp: serverTimestamp(),
      ...(privateTo !== 'all' && { to: privateTo }),
    };

    // Clear input immediately for better UX
    const messageContent = newMessage;
    setNewMessage('');

    try {
      await addDoc(collection(db, FIRESTORE_COLLECTIONS.MESSAGES), messageData);
      
      if (privateTo === 'all') {
        awardPoints(5, 'for sending a message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message on error
      setNewMessage(messageContent);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send message. Please try again.',
      });
    }
  }, [newMessage, user, privateTo, awardPoints, toast]);

  const handleBotMessage = async () => {
    setBotLoading(true);
    try {
      const result = await getBotAnnouncement();
      
      const botMessageData = {
        chatRoomId: CHAT_ROOM_ID,
        senderId: 'bot-1',
        senderName: 'Announcer Bot',
        senderRole: 'organizer',
        isBot: true,
        user: { 
          id: 'bot-1', 
          name: 'Announcer Bot', 
          role: 'organizer' as UserRole, 
          isBot: true 
        },
        content: result.announcement,
        timestamp: serverTimestamp(),
      };
      
      await addDoc(collection(db, FIRESTORE_COLLECTIONS.MESSAGES), botMessageData);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Bot Error',
        description: 'The announcer bot is taking a break. Please try again later.',
      });
    } finally {
      setBotLoading(false);
    }
  };


  if (!user) return null;

  const visibleMessages = messages; // Already filtered by Firestore query + client-side filter

  const chatIsLoading = botLoading || isLoading;

  return (
    <div className="container py-8 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-4xl font-bold font-headline">Group Chat</h1>
            <p className="text-muted-foreground">Connect with attendees and organizers.</p>
        </div>
        {user.role === 'organizer' && (
          <Button onClick={handleBotMessage} disabled={chatIsLoading} variant="outline" className="interactive-element">
              {botLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-primary" />}
              Send Session Alert
          </Button>
        )}
      </div>
      
      <div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {visibleMessages.map(msg => {
              const isMe = msg.user?.id === user.id;
              const isBot = !!msg.user?.isBot;
              const isPrivate = !!msg.to;
              const isAssistant = msg.user?.id === 'bot-2';
              const isOrganizerMessage = msg.user?.role === 'organizer';

              return (
                <div key={msg.id} className={cn('flex items-start gap-3', isMe ? 'justify-end' : 'justify-start')}>
                  {!isMe && (
                    <Avatar className="h-8 w-8">
                       {isBot ? <Bot /> : <AvatarFallback>{msg.user?.name?.charAt(0) || '?'}</AvatarFallback>}
                    </Avatar>
                  )}
                  <div className={cn(
                    'max-w-xs md:max-w-md p-3 rounded-lg flex flex-col', 
                    isMe ? 'bg-primary text-primary-foreground' : 'bg-muted',
                    isPrivate ? 'border-l-4 border-fuchsia-500' : '',
                    isAssistant ? 'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500' : 
                    isBot ? 'bg-purple-100 dark:bg-purple-900/30 border-l-4 border-purple-500' : ''
                  )}>
                    <div className="flex items-center justify-between gap-4 mb-1">
                        {!isMe && <p className="font-bold text-sm">{msg.user?.name}</p>}
                        {!isMe && !isBot && msg.user?.id && (
                            <Button variant="ghost" size="sm" className="h-auto px-1 py-0" onClick={() => setPrivateTo(msg.user!.id)}>
                                <MessageSquare className="h-4 w-4 text-muted-foreground hover:text-primary"/>
                            </Button>
                        )}
                    </div>
                    <p className="text-sm">{msg.content}</p>
                    {isPrivate && (
                        <p className="text-xs mt-2 opacity-70 italic">
                            {isMe ? `Private to ${allUsersMap.get(msg.to!) || 'a user'}` : 'Private message'}
                        </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-background flex items-center gap-2">
            <Select onValueChange={setPrivateTo} value={privateTo} disabled={chatIsLoading}>
                <SelectTrigger className="w-full md:w-[220px]">
                    <SelectValue placeholder="Send to..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    {organizers.length > 0 && (
                        <SelectGroup>
                            <SelectLabel>Organizers</SelectLabel>
                            {organizers.map(org => <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>)}
                        </SelectGroup>
                    )}
                    {attendees.length > 0 && (
                         <SelectGroup>
                            <SelectLabel>Attendees</SelectLabel>
                            {attendees.map(attendee => <SelectItem key={attendee.id} value={attendee.id}>{attendee.name}</SelectItem>)}
                        </SelectGroup>
                    )}
                </SelectContent>
            </Select>
            <div className="relative flex-1">
                <Input 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !chatIsLoading && handleSendMessage()}
                    placeholder="Type a message..."
                    disabled={chatIsLoading}
                />
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" disabled={chatIsLoading}>
                            <Smile />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                        <div className="grid grid-cols-4 gap-2">
                            {EMOJIS.map(emoji => (
                                <Button key={emoji} variant="ghost" size="icon" onClick={() => setNewMessage(prev => prev + emoji)}>
                                    {emoji}
                                </Button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            <Button onClick={handleSendMessage} disabled={chatIsLoading}><Send className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
