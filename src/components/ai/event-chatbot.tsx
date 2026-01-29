'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  Loader2, 
  X, 
  Maximize2, 
  Minimize2,
  MessageCircle,
  Calendar,
  MapPin,
  Clock,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface EventContext {
  id: string;
  title: string;
  description?: string;
  agenda?: Array<{
    time: string;
    title: string;
    description?: string;
    speaker?: string;
  }>;
  location?: string;
  date?: string;
  speakers?: string[];
  faqs?: Array<{ question: string; answer: string }>;
}

interface EventChatbotProps {
  event: EventContext;
  onClose?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
}

const QUICK_QUESTIONS = [
  { icon: Calendar, label: 'Schedule', question: 'What is the event schedule?' },
  { icon: MapPin, label: 'Location', question: 'Where is the event located?' },
  { icon: Clock, label: 'Timing', question: 'What time does the event start?' },
  { icon: HelpCircle, label: 'Help', question: 'What should I know before attending?' },
];

export function EventChatbot({
  event,
  onClose,
  isExpanded = false,
  onToggleExpand,
  className,
}: EventChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! 👋 I'm your AI assistant for "${event.title}". I can help you with questions about the schedule, speakers, location, and more. What would you like to know?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Build context string for the AI
  const buildAgendaContext = useCallback(() => {
    let context = `Event: ${event.title}\n`;
    
    if (event.description) {
      context += `Description: ${event.description}\n`;
    }
    
    if (event.date) {
      context += `Date: ${event.date}\n`;
    }
    
    if (event.location) {
      context += `Location: ${event.location}\n`;
    }
    
    if (event.speakers && event.speakers.length > 0) {
      context += `Speakers: ${event.speakers.join(', ')}\n`;
    }
    
    if (event.agenda && event.agenda.length > 0) {
      context += '\nAgenda:\n';
      event.agenda.forEach((item, index) => {
        context += `${index + 1}. ${item.time} - ${item.title}`;
        if (item.speaker) context += ` (Speaker: ${item.speaker})`;
        if (item.description) context += `\n   ${item.description}`;
        context += '\n';
      });
    }
    
    if (event.faqs && event.faqs.length > 0) {
      context += '\nFAQs:\n';
      event.faqs.forEach((faq, index) => {
        context += `Q${index + 1}: ${faq.question}\nA: ${faq.answer}\n`;
      });
    }
    
    return context;
  }, [event]);

  const handleSend = async (question?: string) => {
    const messageText = question || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: Message = {
      id: 'typing',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: messageText,
          agenda: buildAgendaContext(),
          eventId: event.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      // Remove typing indicator and add response
      setMessages(prev => [
        ...prev.filter(m => m.id !== 'typing'),
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.answer || "I'm sorry, I couldn't find an answer to that question.",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev.filter(m => m.id !== 'typing'),
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className={cn(
      'flex flex-col',
      isExpanded ? 'fixed inset-4 z-50' : 'h-[500px]',
      className
    )}>
      {/* Header */}
      <CardHeader className="flex-shrink-0 pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-9 w-9 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Event Assistant
                <Badge variant="secondary" className="text-xs font-normal">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">Ask me anything about this event</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onToggleExpand && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleExpand}>
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="space-y-4 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2.5',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted rounded-bl-md',
                  message.isTyping && 'animate-pulse'
                )}
              >
                {message.isTyping ? (
                  <div className="flex items-center gap-1 py-1">
                    <span className="h-2 w-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
              {message.role === 'user' && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-secondary">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Quick questions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((q, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleSend(q.question)}
                disabled={isLoading}
              >
                <q.icon className="h-3 w-3 mr-1" />
                {q.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <CardContent className="flex-shrink-0 pt-3 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Floating chat button component
export function ChatbotTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40"
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  );
}

export default EventChatbot;
