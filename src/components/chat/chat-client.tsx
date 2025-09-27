'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
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


const EMOJIS = ['😀', '😂', '😍', '🤔', '👍', '🎉', '🚀', '💻'];

export default function ChatClient() {
  const { user, users, awardPoints } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>('ipx-chat', []);
  const [newMessage, setNewMessage] = useState('');
  const [privateTo, setPrivateTo] = useState<string>('all');
  const [botLoading, setBotLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { organizers, attendees } = useMemo(() => {
    const organizers = users.filter(u => u.role === 'organizer' && u.id !== user?.id);
    const attendees = users.filter(u => u.role !== 'organizer' && u.id !== user?.id);
    return { organizers, attendees };
  }, [users, user]);
  
  const allUsersMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);

  useEffect(() => {
    // Scroll to bottom on new message
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  // Simulate real-time updates by re-reading from localStorage
  useEffect(() => {
    const interval = setInterval(() => {
        const storedMessages = window.localStorage.getItem('ipx-chat');
        if (storedMessages) {
            const parsedMessages = JSON.parse(storedMessages);
            if(JSON.stringify(parsedMessages) !== JSON.stringify(messages)) {
                setMessages(parsedMessages);
            }
        }
    }, 2000);
    return () => clearInterval(interval);
  }, [messages, setMessages]);


  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      user: { id: user.id, name: user.name, role: user.role as UserRole },
      content: newMessage,
      timestamp: Date.now(),
      ...(privateTo !== 'all' && { to: privateTo }),
    };
    setMessages([...messages, message]);
    setNewMessage('');
    if (privateTo === 'all') {
        awardPoints(5, 'for sending a message');
    }
  };

  const handleBotMessage = async () => {
    setBotLoading(true);
    try {
        const result = await getBotAnnouncement();
        const botMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            user: { id: 'bot-1', name: 'Announcer Bot', role: 'organizer', isBot: true },
            content: result.announcement,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, botMessage]);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Bot Error',
            description: 'The announcer bot is taking a break. Please try again later.',
        });
    } finally {
        setBotLoading(false);
    }
  }


  if (!user) return null;

  const visibleMessages = messages.filter(msg => {
    // Public messages
    if (!msg.to) return true;
    // Private messages to me
    if (msg.to === user.id) return true;
    // My private messages to others
    if (msg.user.id === user.id) return true;
    return false;
  });

  const isLoading = botLoading;

  return (
    <div className="container py-8 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-4xl font-bold font-headline">Group Chat</h1>
            <p className="text-muted-foreground">Connect with attendees and organizers.</p>
        </div>
        {user.role === 'organizer' && (
          <Button onClick={handleBotMessage} disabled={isLoading} variant="outline" className="interactive-element">
              {botLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-primary" />}
              Send Session Alert
          </Button>
        )}
      </div>
      
      <div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {visibleMessages.map(msg => {
              const isMe = msg.user.id === user.id;
              const isBot = !!msg.user.isBot;
              const isPrivate = !!msg.to;
              const isAssistant = msg.user.id === 'bot-2';
              const isOrganizerMessage = msg.user.role === 'organizer';

              return (
                <div key={msg.id} className={cn('flex items-start gap-3', isMe ? 'justify-end' : 'justify-start')}>
                  {!isMe && (
                    <Avatar className="h-8 w-8">
                       {isBot ? <Bot /> : <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>}
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
                        {!isMe && <p className="font-bold text-sm">{msg.user.name}</p>}
                        {!isMe && !isBot && (
                            <Button variant="ghost" size="sm" className="h-auto px-1 py-0" onClick={() => setPrivateTo(msg.user.id)}>
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
            <Select onValueChange={setPrivateTo} value={privateTo} disabled={isLoading}>
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
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                    placeholder="Type a message..."
                    disabled={isLoading}
                />
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" disabled={isLoading}>
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
            <Button onClick={handleSendMessage} disabled={isLoading}><Send className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
