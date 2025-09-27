'use client';
import { useState, useEffect, useRef } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
import { useAuth } from '@/hooks/use-auth';
import type { ChatMessage, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Smile, Bot, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getBotAnnouncement } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';


const EMOJIS = ['😀', '😂', '😍', '🤔', '👍', '🎉', '🚀', '💻'];

export default function ChatClient() {
  const { user, users } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>('ipx-chat', []);
  const [newMessage, setNewMessage] = useState('');
  const [privateTo, setPrivateTo] = useState<string>('all');
  const [botLoading, setBotLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const organizers = users.filter(u => u.role === 'organizer');

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

  return (
    <div className="container py-8 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-4xl font-bold font-headline">Group Chat</h1>
            <p className="text-muted-foreground">Connect with attendees and organizers.</p>
        </div>
        <Button onClick={handleBotMessage} disabled={botLoading} variant="outline" className="interactive-element">
            {botLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-primary" />}
            Ask Bot for Updates
        </Button>
      </div>
      
      <div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {visibleMessages.map(msg => {
              const isMe = msg.user.id === user.id;
              const isBot = msg.user.isBot;
              const isPrivate = !!msg.to;
              return (
                <div key={msg.id} className={cn('flex items-start gap-3', isMe ? 'justify-end' : 'justify-start')}>
                  {!isMe && (
                    <Avatar className="h-8 w-8">
                       {isBot ? <Bot /> : <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>}
                    </Avatar>
                  )}
                  <div className={cn(
                    'max-w-xs md:max-w-md p-3 rounded-lg', 
                    isMe ? 'bg-primary text-primary-foreground' : 'bg-muted',
                    isPrivate ? 'border-l-4 border-accent' : '',
                    isBot ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-primary' : ''
                  )}>
                    {!isMe && <p className="font-bold text-sm mb-1">{msg.user.name}</p>}
                    <p className="text-sm">{msg.content}</p>
                    {isPrivate && (
                        <p className="text-xs mt-2 opacity-70 italic">
                            {isMe ? `Private to ${organizers.find(o => o.id === msg.to)?.name || 'Organizer'}` : 'Private message'}
                        </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-background flex items-center gap-2">
            <Select onValueChange={setPrivateTo} defaultValue="all">
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Send to: Everyone" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    {organizers.map(org => <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>)}
                </SelectContent>
            </Select>
            <div className="relative flex-1">
                <Input 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                />
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
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
            <Button onClick={handleSendMessage}><Send className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
