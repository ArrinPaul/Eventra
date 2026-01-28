'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { getKnowledgeBotAnswer } from '@/lib/actions';
import { AGENDA_STRING } from '@/lib/data';
import { cn } from '@/lib/utils';

type Message = {
    sender: 'user' | 'bot';
    text: string;
};

const initialBotMessage: Message = {
    sender: 'bot',
    text: "Hello! I'm here to help with questions about EventOS events and features. What can I assist you with today?",
};


export default function FloatingAiChat() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([initialBotMessage]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
          // Reset to initial state when opening
          setMessages([initialBotMessage]);
          setInput('');
          setLoading(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const result = await getKnowledgeBotAnswer({ question: input, agenda: AGENDA_STRING });
            const botMessage: Message = { sender: 'bot', text: result.answer };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorMessage: Message = { sender: 'bot', text: "Sorry, I'm having trouble connecting. Please try again later." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };
    
    if (!user || user.role === 'organizer') return null;

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50">
                <Button onClick={() => setIsOpen(!isOpen)} size="icon" className="rounded-full w-14 h-14 shadow-lg interactive-element">
                    {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
                </Button>
            </div>
            
            {isOpen && (
                 <Card className="fixed bottom-24 right-6 z-50 w-full max-w-sm shadow-2xl glass-effect flex flex-col h-[60vh]">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="font-headline flex items-center gap-2">
                            <Bot className="text-primary"/> AI Assistant
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0">
                        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                             <div className="space-y-4">
                                {messages.map((message, index) => (
                                    <div key={index} className={cn('flex items-start gap-3', message.sender === 'user' ? 'justify-end' : 'justify-start')}>
                                         {message.sender === 'bot' && (
                                            <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center">
                                               <Bot className="h-5 w-5"/>
                                            </Avatar>
                                        )}
                                        <div className={cn(
                                            'max-w-xs p-3 rounded-lg', 
                                            message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted',
                                        )}>
                                            <p className="text-sm">{message.text}</p>
                                        </div>
                                         {message.sender === 'user' && (
                                            <Avatar className="h-8 w-8">
                                               <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex items-start gap-3 justify-start">
                                        <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center"><Bot className="h-5 w-5"/></Avatar>
                                        <div className="max-w-xs p-3 rounded-lg bg-muted">
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin"/>
                                                <p className="text-sm italic">Thinking...</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                             </div>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter className="p-4 border-t">
                        <div className="flex w-full items-center gap-2">
                            <Input 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()}
                                placeholder="Ask about the event..."
                                disabled={loading}
                            />
                            <Button onClick={handleSend} disabled={loading} size="icon">
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            )}
        </>
    );
}
