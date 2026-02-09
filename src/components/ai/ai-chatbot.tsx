'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Settings,
  Sparkles,
  Calendar,
  Users,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Minimize2,
  Maximize2,
  RotateCcw,
  Download,
  Share2,
  Mic,
  MicOff,
  Image,
  Paperclip,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '../../hooks/use-toast';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

// Web Speech API types
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}

interface WebkitSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface window {
    webkitSpeechRecognition: new () => WebkitSpeechRecognition;
  }
}

import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface AIChatbotProps {
  eventId?: string;
  eventTitle?: string;
  userRole?: 'student' | 'professional' | 'organizer';
  isFloating?: boolean;
  onClose?: () => void;
}

export default function AIChatbot({ 
  eventId, 
  eventTitle, 
  userRole = 'student', 
  isFloating = false, 
  onClose 
}: AIChatbotProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const sessions = useQuery(api.aiChat.getSessions) || [];
  const createSession = useMutation(api.aiChat.createSession);
  const deleteSession = useMutation(api.aiChat.deleteSession);
  const addMessageMutation = useMutation(api.aiChat.addMessage);
  
  const [currentSessionId, setCurrentSessionId] = useState<Id<"ai_chat_sessions"> | null>(null);
  const messages = useQuery(api.aiChat.getSessionMessages, currentSessionId ? { sessionId: currentSessionId } : "skip" as any) || [];
  
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Settings
  const [aiModel, setAiModel] = useState('gemini-1.5-flash');
  const [contextAware, setContextAware] = useState(true);
  const [quickActions, setQuickActions] = useState(true);
  
  // Voice recognition
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    initializeSpeechRecognition();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeSpeechRecognition = () => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in (window as any)) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      setRecognition(recognition);
    }
  };

  const startNewSession = async () => {
    try {
      const sessionId = await createSession({
        title: eventTitle ? `Chat about ${eventTitle}` : `Chat ${new Date().toLocaleString()}`,
        eventId: eventId as any,
        context: {
          userRole,
          eventTitle,
          currentPage: window.location.pathname,
        }
      });
      setCurrentSessionId(sessionId);
      
      // Add welcome message
      await addMessageMutation({
        sessionId,
        role: 'assistant',
        content: `Hello! I'm your Eventra AI Assistant. How can I help you today?`,
        actions: quickActions ? [
          { label: 'View Event Schedule', action: 'view_schedule' },
          { label: 'Networking Tips', action: 'networking_tips' },
        ] : undefined
      });
      
      setShowHistory(false);
    } catch (error) {
      console.error("Error creating session:", error);
      toast({ title: "Error", description: "Failed to start new chat", variant: "destructive" });
    }
  };

  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || inputMessage.trim();
    if (!content || isLoading) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      try {
        sessionId = await createSession({
          title: content.substring(0, 30) + "...",
          eventId: eventId as any,
          context: {
            userRole,
            eventTitle,
            currentPage: window.location.pathname,
          }
        });
        setCurrentSessionId(sessionId);
      } catch (error) {
        console.error("Error creating session:", error);
        return;
      }
    }

    // Add user message to Convex
    await addMessageMutation({
      sessionId: sessionId!,
      role: 'user',
      content,
    });

    setInputMessage('');
    setIsLoading(true);

    try {
      // Fetch history for AI context
      const history = messages.map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/ai/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          sessionId,
          history,
          context: {
            userRole,
            eventId,
            eventTitle,
            currentPage: window.location.pathname,
          },
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Add assistant message to Convex
        await addMessageMutation({
          sessionId: sessionId!,
          role: 'assistant',
          content: data.message,
          actions: data.actions,
        });
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      await addMessageMutation({
        sessionId: sessionId!,
        role: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeQuickAction = async (action: string, data?: any) => {
    // Implement quick action logic here
    toast({ title: "Action", description: `Executing: ${action}` });
    if (action === 'view_schedule' && eventId) {
      window.location.href = `/events/${eventId}`;
    }
  };

  const toggleVoiceInput = () => {
    if (!recognition) {
      toast({ title: "Not Supported", description: "Speech recognition not supported", variant: "destructive" });
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleDeleteSession = async (id: Id<"ai_chat_sessions">) => {
    await deleteSession({ sessionId: id });
    if (currentSessionId === id) setCurrentSessionId(null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  };

  const chatContent = (
    <>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-500" />
            AI Assistant
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)}>
              <Clock className="w-4 h-4" />
            </Button>
            {isFloating && (
              <Button variant="ghost" size="sm" onClick={() => setIsMinimized(!isMinimized)}>
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm"><Settings className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={startNewSession}><RotateCcw className="w-4 h-4 mr-2" /> New Chat</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowSettings(true)}><Settings className="w-4 h-4 mr-2" /> Settings</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {isFloating && onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
            )}
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0">
          {showHistory ? (
            <div className="h-96 overflow-y-auto p-4 space-y-2 bg-white/5">
              <h3 className="text-xs font-semibold uppercase text-gray-500 mb-4">Previous Chats</h3>
              {sessions.length === 0 ? (
                <p className="text-sm text-center py-10 text-gray-500">No chat history found.</p>
              ) : (
                sessions.map(s => (
                  <div key={s._id} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg group">
                    <button 
                      className="flex-1 text-left text-sm truncate" 
                      onClick={() => { setCurrentSessionId(s._id); setShowHistory(false); }}
                    >
                      {s.title}
                    </button>
                    <button onClick={() => handleDeleteSession(s._id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
              <Button variant="outline" className="w-full mt-4 border-white/10" onClick={startNewSession}>
                Start New Chat
              </Button>
            </div>
          ) : (
            <>
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                    <Sparkles className="w-12 h-12 text-cyan-500" />
                    <p className="text-sm max-w-[200px]">Ask anything about Eventra, your schedule, or networking.</p>
                  </div>
                )}
                {messages.map((message) => (
                  <div key={message._id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-2 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="flex-shrink-0">
                        {message.role === 'user' ? (
                          <div className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center"><User className="w-3.5 h-3.5" /></div>
                        ) : (
                          <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center"><Bot className="w-3.5 h-3.5 text-cyan-400" /></div>
                        )}
                      </div>
                      <div className={`rounded-2xl p-3 text-sm ${message.role === 'user' ? 'bg-cyan-600' : 'bg-white/10'}`}>
                        <div dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }} />
                        {message.actions && message.actions.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.actions.map((action, index) => (
                              <Button key={index} variant="secondary" size="xs" onClick={() => executeQuickAction(action.action, action.data)} className="text-[10px] h-7">
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-2">
                      <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center"><Bot className="w-3.5 h-3.5 text-cyan-400" /></div>
                      <div className="bg-white/10 rounded-2xl p-3 flex gap-1">
                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="border-t border-white/5 p-4">
                <div className="flex gap-2">
                  <Textarea
                    ref={inputRef}
                    placeholder="Type a message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="min-h-[40px] max-h-32 resize-none bg-white/5 border-white/10 focus-visible:ring-cyan-500"
                    disabled={isLoading}
                  />
                  <div className="flex flex-col gap-1">
                    {recognition && (
                      <Button variant="ghost" size="sm" onClick={toggleVoiceInput} disabled={isLoading} className={isListening ? 'text-red-400' : ''}>
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </Button>
                    )}
                    <Button onClick={() => sendMessage()} disabled={!inputMessage.trim() || isLoading} size="sm" className="bg-cyan-600 hover:bg-cyan-500">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </>
  );

  if (isFloating) {
    return (
      <Card className="fixed bottom-4 right-4 w-96 z-50 shadow-2xl bg-[#0f172a]/95 border-white/10 backdrop-blur-md">
        {chatContent}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[#0f172a]/60 border-white/10 backdrop-blur-md">
        {chatContent}
      </Card>
    </div>
  );
}