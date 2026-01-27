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
  Paperclip
} from 'lucide-react';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../../hooks/use-toast';
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

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  context?: any;
  actions?: Array<{ 
    label: string;
    action: string;
    data?: any;
  }>;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastActivity: Date;
  eventId?: string;
  context: {
    userRole: string;
    eventTitle?: string;
    currentPage?: string;
  };
}

interface AIChatbotProps {
  eventId?: string;
  eventTitle?: string;
  userRole: 'student' | 'professional' | 'organizer';
  isFloating?: boolean;
  onClose?: () => void;
}

export default function AIChatbot({ 
  eventId, 
  eventTitle, 
  userRole, 
  isFloating = false, 
  onClose 
}: AIChatbotProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings
  const [aiModel, setAiModel] = useState('gpt-3.5-turbo');
  const [contextAware, setContextAware] = useState(true);
  const [quickActions, setQuickActions] = useState(true);
  const [voiceInput, setVoiceInput] = useState(false);
  
  // Voice recognition
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadChatSessions();
    initializeSpeechRecognition();
    
    // Load initial welcome message
    if (messages.length === 0) {
      addWelcomeMessage();
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatSessions = async () => {
    try {
      const response = await fetch('/api/ai-chatbot/sessions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      
      const data = await response.json();
      if (data.sessions) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  };

  const initializeSpeechRecognition = () => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };
      
      recognition.onerror = () => {
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognition);
    }
  };

  const addWelcomeMessage = () => {
    const welcomeMessage: ChatMessage = {
      id: `welcome_${Date.now()}`,
      type: 'assistant',
      content: `Hello! I'm your EventOS AI Assistant. I can help you with:
      
• Event planning and management
• Registration assistance
• Schedule and agenda queries
• Networking recommendations
• Technical support
• General event information

${eventTitle ? `I see you're working with "${eventTitle}". ` : ''}What would you like to know?`,
      timestamp: new Date(),
      actions: quickActions ? [
        { label: 'View Event Schedule', action: 'view_schedule', data: { eventId } },
        { label: 'Registration Help', action: 'registration_help' },
        { label: 'Networking Tips', action: 'networking_tips' },
        { label: 'Technical Support', action: 'tech_support' },
      ] : undefined,
    };
    
    setMessages([welcomeMessage]);
  };

  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || inputMessage.trim();
    if (!content || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          message: content,
          sessionId: currentSession?.id,
          context: {
            userRole,
            eventId,
            eventTitle,
            currentPage: window.location.pathname,
            previousMessages: messages.slice(-5), // Last 5 messages for context
          },
          settings: {
            model: aiModel,
            contextAware,
          },
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: `assistant_${Date.now()}`,
          type: 'assistant',
          content: data.message,
          timestamp: new Date(),
          actions: data.actions,
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Update or create session
        if (data.sessionId) {
          // Session management logic here
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeQuickAction = async (action: string, data?: any) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/ai-chatbot/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          action,
          data,
          context: {
            userRole,
            eventId,
            eventTitle,
          },
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        if (result.message) {
          const actionMessage: ChatMessage = {
            id: `action_${Date.now()}`,
            type: 'assistant',
            content: result.message,
            timestamp: new Date(),
            actions: result.actions,
          };
          
          setMessages(prev => [...prev, actionMessage]);
        }
        
        if (result.redirect) {
          // Handle navigation
          window.location.href = result.redirect;
        }
      }
    } catch (error) {
      console.error('Error executing action:', error);
      toast({
        title: "Error",
        description: "Failed to execute action.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceInput = () => {
    if (!recognition) {
      toast({
        title: "Voice Input Not Available",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const clearChat = () => {
    setMessages([]);
    addWelcomeMessage();
    setCurrentSession(null);
  };

  const exportChat = () => {
    const chatText = messages.map(msg => 
      `[${msg.timestamp.toLocaleTimeString()}] ${msg.type === 'user' ? 'You' : 'AI Assistant'}: ${msg.content}`
    ).join('\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eventos-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    // Simple markdown-like formatting
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
            <Bot className="w-5 h-5" />
            AI Assistant
            {eventTitle && (
              <Badge variant="outline" className="text-xs">
                {eventTitle}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            {isFloating && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={clearChat}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear Chat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportChat}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Chat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowSettings(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {isFloating && onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0">
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="flex-shrink-0">
                    {message.type === 'user' ? (
                      <User className="w-6 h-6 p-1 bg-primary text-primary-foreground rounded-full" />
                    ) : message.type === 'assistant' ? (
                      <Bot className="w-6 h-6 p-1 bg-secondary text-secondary-foreground rounded-full" />
                    ) : (
                      <div className="w-6 h-6 p-1 bg-muted rounded-full" />
                    )}
                  </div>
                  
                  <div className={`rounded-lg p-3 ${ 
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : message.type === 'assistant'
                      ? 'bg-secondary'
                      : 'bg-muted'
                  }`}>
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: formatMessageContent(message.content) 
                      }}
                    />
                    
                    {message.actions && message.actions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.actions.map((action, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => executeQuickAction(action.action, action.data)}
                            className="mr-2 mb-2"
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                    
                    <div className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                  <Bot className="w-6 h-6 p-1 bg-secondary text-secondary-foreground rounded-full" />
                  <div className="bg-secondary rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Textarea
                ref={inputRef}
                placeholder="Ask me anything about EventOS..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[40px] max-h-32 resize-none"
                disabled={isLoading}
              />
              
              <div className="flex flex-col gap-1">
                {recognition && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleVoiceInput}
                    disabled={isLoading}
                    className={isListening ? 'bg-red-50 border-red-200' : ''}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                )}
                
                <Button
                  onClick={() => sendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </>
  );

  if (isFloating) {
    return (
      <Card className="fixed bottom-4 right-4 w-96 z-50 shadow-2xl">
        {chatContent}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-effect">
        {chatContent}
      </Card>

      {/* Settings Dialog would go here */}
    </div>
  );
}
