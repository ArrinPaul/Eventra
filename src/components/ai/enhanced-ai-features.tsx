/**
 * EventOS Enhanced AI Features
 * Multi-provider AI with conversation memory and intelligent automation
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/core/config/firebase';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, limit as firestoreLimit, getDoc } from 'firebase/firestore';
import {
  Brain,
  MessageCircle,
  Sparkles,
  Zap,
  Settings,
  Users,
  Calendar,
  TrendingUp,
  Target,
  Lightbulb,
  Mic,
  MicOff,
  Play,
  Pause,
  Send,
  RefreshCw,
  Download,
  Upload,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Star,
  Heart,
  Share2,
  Bookmark,
  Clock,
  Globe,
  Shield,
  Database,
  Code,
  Image,
  FileText,
  BarChart3,
  PieChart,
  Filter,
  Search,
  Plus,
  Minus,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  Bot,
  Wand2,
  Cpu,
  Network,
  CloudLightning,
  Fingerprint,
  Lock,
  DollarSign
} from 'lucide-react';
import { EVENTOS_CONFIG } from '@/core/config/eventos-config';
import type { Event, User, Organization } from '@/types';

// AI Types
interface AIProvider {
  id: string;
  name: string;
  logo: string;
  description: string;
  models: AIModel[];
  capabilities: string[];
  regions: string[];
  pricing: {
    inputTokens: number; // per 1M tokens
    outputTokens: number; // per 1M tokens
  };
  limits: {
    contextWindow: number;
    maxTokens: number;
    requestsPerMinute: number;
  };
}

interface AIModel {
  id: string;
  name: string;
  description: string;
  type: 'text' | 'multimodal' | 'embedding' | 'image' | 'audio';
  contextWindow: number;
  capabilities: string[];
  specialties: string[];
}

interface Conversation {
  id: string;
  title: string;
  userId: string;
  organizationId: string;
  provider: string;
  model: string;
  messages: Message[];
  metadata: {
    eventId?: string;
    category: 'planning' | 'analysis' | 'content' | 'support' | 'automation';
    tags: string[];
    participants: string[];
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  settings: {
    temperature: number;
    maxTokens: number;
    systemPrompt?: string;
    memoryEnabled: boolean;
    autoSave: boolean;
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    tokens?: number;
    cost?: number;
    processingTime?: number;
    model?: string;
    attachments?: string[];
    actions?: string[];
  };
}

interface AIWorkflow {
  id: string;
  name: string;
  description: string;
  category: string;
  trigger: 'manual' | 'scheduled' | 'event' | 'condition';
  steps: WorkflowStep[];
  isActive: boolean;
  executionCount: number;
  lastRun?: Date;
  nextRun?: Date;
}

interface WorkflowStep {
  id: string;
  type: 'ai_generation' | 'data_analysis' | 'notification' | 'integration' | 'condition';
  name: string;
  config: Record<string, any>;
  outputs: string[];
}

interface AIInsight {
  id: string;
  type: 'recommendation' | 'prediction' | 'alert' | 'trend' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  category: string;
  data: Record<string, any>;
  actionable: boolean;
  actions?: string[];
  createdAt: Date;
  expiresAt?: Date;
}

interface AIUsageMetrics {
  totalTokens: number;
  totalCost: number;
  requestCount: number;
  avgResponseTime: number;
  errorRate: number;
  topModels: Array<{ model: string; usage: number }>;
  costBreakdown: Array<{ provider: string; cost: number }>;
  period: {
    start: Date;
    end: Date;
  };
}

// AI Providers Configuration
const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    logo: 'ðŸ¤–',
    description: 'Advanced language models including GPT-4 and GPT-4 Vision',
    models: [
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: 'Most advanced model with 128k context',
        type: 'multimodal',
        contextWindow: 128000,
        capabilities: ['text', 'image', 'code', 'analysis'],
        specialties: ['complex reasoning', 'creative writing', 'code generation']
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
        description: 'Powerful model for complex tasks',
        type: 'text',
        contextWindow: 8192,
        capabilities: ['text', 'code', 'analysis'],
        specialties: ['reasoning', 'accuracy', 'problem solving']
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and efficient for most tasks',
        type: 'text',
        contextWindow: 16385,
        capabilities: ['text', 'code', 'conversation'],
        specialties: ['speed', 'cost-effectiveness', 'general tasks']
      }
    ],
    capabilities: ['text generation', 'code completion', 'image analysis', 'function calling'],
    regions: ['global'],
    pricing: {
      inputTokens: 10.00, // $10 per 1M input tokens (GPT-4)
      outputTokens: 30.00, // $30 per 1M output tokens (GPT-4)
    },
    limits: {
      contextWindow: 128000,
      maxTokens: 4096,
      requestsPerMinute: 500,
    }
  },
  {
    id: 'google',
    name: 'Google AI',
    logo: 'ðŸŸ¡',
    description: 'Gemini models with multimodal capabilities',
    models: [
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        description: 'Advanced multimodal model',
        type: 'multimodal',
        contextWindow: 32768,
        capabilities: ['text', 'image', 'video', 'audio', 'code'],
        specialties: ['multimodal understanding', 'reasoning', 'safety']
      },
      {
        id: 'gemini-pro-vision',
        name: 'Gemini Pro Vision',
        description: 'Specialized for vision tasks',
        type: 'multimodal',
        contextWindow: 16384,
        capabilities: ['image', 'text', 'analysis'],
        specialties: ['image understanding', 'visual reasoning']
      }
    ],
    capabilities: ['multimodal processing', 'safety filtering', 'code generation'],
    regions: ['global'],
    pricing: {
      inputTokens: 0.50, // $0.50 per 1M input tokens
      outputTokens: 1.50, // $1.50 per 1M output tokens
    },
    limits: {
      contextWindow: 32768,
      maxTokens: 2048,
      requestsPerMinute: 60,
    }
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    logo: 'ðŸ”¶',
    description: 'Claude models focused on safety and helpfulness',
    models: [
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        description: 'Most powerful Claude model',
        type: 'multimodal',
        contextWindow: 200000,
        capabilities: ['text', 'image', 'analysis', 'reasoning'],
        specialties: ['long context', 'complex analysis', 'safety']
      },
      {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        description: 'Balanced performance and speed',
        type: 'multimodal',
        contextWindow: 200000,
        capabilities: ['text', 'image', 'code'],
        specialties: ['balanced performance', 'reliability', 'instruction following']
      }
    ],
    capabilities: ['long context', 'safety alignment', 'complex reasoning'],
    regions: ['us', 'eu'],
    pricing: {
      inputTokens: 15.00, // $15 per 1M input tokens (Opus)
      outputTokens: 75.00, // $75 per 1M output tokens (Opus)
    },
    limits: {
      contextWindow: 200000,
      maxTokens: 4096,
      requestsPerMinute: 40,
    }
  }
];

// Form schemas
const conversationSchema = z.object({
  title: z.string().min(1, 'Title required'),
  provider: z.string().min(1, 'Provider required'),
  model: z.string().min(1, 'Model required'),
  category: z.enum(['planning', 'analysis', 'content', 'support', 'automation']),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(4096).default(1000),
  memoryEnabled: z.boolean().default(true),
});

const workflowSchema = z.object({
  name: z.string().min(1, 'Name required'),
  description: z.string().min(1, 'Description required'),
  category: z.string().min(1, 'Category required'),
  trigger: z.enum(['manual', 'scheduled', 'event', 'condition']),
});

export function EnhancedAIFeatures() {
  const [activeTab, setActiveTab] = useState('conversations');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [workflows, setWorkflows] = useState<AIWorkflow[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [usageMetrics, setUsageMetrics] = useState<AIUsageMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationForm = useForm({
    resolver: zodResolver(conversationSchema),
    defaultValues: {
      provider: 'openai',
      model: 'gpt-4-turbo',
      category: 'planning' as const,
      temperature: 0.7,
      maxTokens: 1000,
      memoryEnabled: true,
    },
  });

  const workflowForm = useForm({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      trigger: 'manual' as const,
    },
  });

  useEffect(() => {
    loadAIData();
    setSelectedProvider(AI_PROVIDERS[0]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  const loadAIData = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      // Load conversations from Firestore
      const conversationsQuery = query(
        collection(db, 'ai_conversations'),
        where('userId', '==', user.uid),
        orderBy('updatedAt', 'desc'),
        firestoreLimit(50)
      );
      
      const conversationsSnapshot = await getDocs(conversationsQuery);
      const loadedConversations: Conversation[] = conversationsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          userId: data.userId,
          organizationId: data.organizationId,
          provider: data.provider,
          model: data.model,
          messages: (data.messages || []).map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp),
          })),
          metadata: {
            ...data.metadata,
            createdAt: data.metadata?.createdAt?.toDate ? data.metadata.createdAt.toDate() : new Date(),
            updatedAt: data.metadata?.updatedAt?.toDate ? data.metadata.updatedAt.toDate() : new Date(),
          },
          settings: data.settings || {
            temperature: 0.7,
            maxTokens: 1000,
            memoryEnabled: true,
            autoSave: true,
          },
        } as Conversation;
      });
      
      // Load workflows from Firestore
      const workflowsQuery = query(
        collection(db, 'ai_workflows'),
        where('userId', '==', user.uid)
      );
      
      const workflowsSnapshot = await getDocs(workflowsQuery);
      const loadedWorkflows: AIWorkflow[] = workflowsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          lastRun: data.lastRun?.toDate ? data.lastRun.toDate() : null,
        } as AIWorkflow;
      });
      
      // Load insights from Firestore
      const insightsQuery = query(
        collection(db, 'ai_insights'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        firestoreLimit(20)
      );
      
      const insightsSnapshot = await getDocs(insightsQuery);
      const loadedInsights: AIInsight[] = insightsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : undefined,
        } as AIInsight;
      });
      
      // Load usage metrics from Firestore
      const metricsDoc = await getDoc(doc(db, 'ai_usage_metrics', user.uid));
      let loadedMetrics: AIUsageMetrics | null = null;
      if (metricsDoc.exists()) {
        const data = metricsDoc.data();
        loadedMetrics = {
          totalTokens: data.totalTokens || 0,
          totalCost: data.totalCost || 0,
          requestCount: data.requestCount || 0,
          avgResponseTime: data.avgResponseTime || 0,
          errorRate: data.errorRate || 0,
          topModels: data.topModels || [],
          costBreakdown: data.costBreakdown || [],
          period: {
            start: data.period?.start?.toDate ? data.period.start.toDate() : new Date(),
            end: data.period?.end?.toDate ? data.period.end.toDate() : new Date(),
          },
        } as AIUsageMetrics;
      }

      setConversations(loadedConversations);
      setWorkflows(loadedWorkflows);
      setInsights(loadedInsights);
      if (loadedMetrics) setUsageMetrics(loadedMetrics);
      if (loadedConversations.length > 0) {
        setActiveConversation(loadedConversations[0]);
      }
    } catch (error) {
      console.error('Failed to load AI data:', error);
      toast({
        title: 'Error Loading Data',
        description: 'Unable to load AI features data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createConversation = async (data: any) => {
    try {
      const newConversation: Conversation = {
        id: `conv_${Date.now()}`,
        title: data.title,
        userId: user?.id || 'user1',
        organizationId: user?.organizationId || 'org1',
        provider: data.provider,
        model: data.model,
        messages: [],
        metadata: {
          category: data.category,
          tags: [],
          participants: [user?.id || 'user1'],
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        settings: {
          temperature: data.temperature,
          maxTokens: data.maxTokens,
          systemPrompt: data.systemPrompt,
          memoryEnabled: data.memoryEnabled,
          autoSave: true,
        },
      };

      setConversations(prev => [newConversation, ...prev]);
      setActiveConversation(newConversation);
      setShowNewConversationDialog(false);
      conversationForm.reset();

      toast({
        title: 'Conversation Created',
        description: 'New AI conversation started successfully.',
      });
    } catch (error) {
      toast({
        title: 'Creation Failed',
        description: 'Unable to create conversation.',
        variant: 'destructive',
      });
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !activeConversation || isGenerating) return;

    setIsGenerating(true);
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: currentMessage.trim(),
      timestamp: new Date(),
    };

    // Add user message
    const updatedConversation = {
      ...activeConversation,
      messages: [...activeConversation.messages, userMessage],
    };
    setActiveConversation(updatedConversation);
    setCurrentMessage('');

    try {
      const startTime = Date.now();
      
      // Call real AI API route
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage.content,
          eventId: activeConversation.metadata.eventId,
          provider: activeConversation.provider,
          model: activeConversation.model
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to get AI response');

      const aiMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: data.answer || "I'm sorry, I couldn't process that.",
        timestamp: new Date(),
        metadata: {
          tokens: Math.floor(userMessage.content.length * 1.5), // Estimate if not returned
          cost: 0.001 * (userMessage.content.length / 100),
          processingTime: (Date.now() - startTime) / 1000,
          model: activeConversation.model,
        },
      };

      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, aiMessage],
        metadata: {
          ...updatedConversation.metadata,
          updatedAt: new Date(),
        },
      };

      setActiveConversation(finalConversation);
      
      // Update conversations list
      setConversations(prev => prev.map(conv => 
        conv.id === activeConversation.id ? finalConversation : conv
      ));
      
      // Save conversation to Firestore
      if (user?.uid && !activeConversation.id.startsWith('conv_')) {
        await updateDoc(doc(db, 'ai_conversations', activeConversation.id), {
          messages: finalConversation.messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp
          })),
          'metadata.updatedAt': serverTimestamp()
        });
      }
    } catch (error) {
      toast({
        title: 'Message Failed',
        description: 'Unable to send message.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate contextual mock response (replace with real AI API in production)
  const generateContextualResponse = (userInput: string, conversation: Conversation): string => {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('event') || lowerInput.includes('schedule')) {
      return `Based on your event management needs, I can help you with scheduling, attendee management, and analytics. Here are some suggestions for "${userInput}":\n\n1. Consider creating a detailed agenda\n2. Set up automated reminders\n3. Use the analytics dashboard to track engagement\n\nWould you like me to elaborate on any of these?`;
    }
    
    if (lowerInput.includes('help') || lowerInput.includes('how')) {
      return `I'd be happy to help! Based on your question "${userInput}", here are some relevant features:\n\nâ€¢ Event creation and management\nâ€¢ Attendee tracking and engagement\nâ€¢ AI-powered recommendations\nâ€¢ Analytics and reporting\n\nWhat specific aspect would you like to explore?`;
    }
    
    return `Thank you for your message: "${userInput}". I'm your AI assistant using the ${conversation.model} model. I can help you with event planning, attendee management, analytics, and more. How can I assist you further?`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const renderConversations = () => (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
      {/* Conversations Sidebar */}
      <div className="col-span-3">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Conversations</CardTitle>
              <Button size="sm" onClick={() => setShowNewConversationDialog(true)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100%-80px)]">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                    activeConversation?.id === conversation.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => setActiveConversation(conversation)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      conversation.provider === 'openai' ? 'bg-green-100 text-green-700' :
                      conversation.provider === 'google' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {conversation.provider === 'openai' ? 'ðŸ¤–' :
                       conversation.provider === 'google' ? 'ðŸŸ¡' : 'ðŸ”¶'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{conversation.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {conversation.messages.length} messages
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {conversation.metadata.updatedAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Main Chat Area */}
      <div className="col-span-9">
        {activeConversation ? (
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>{activeConversation.title}</span>
                    <Badge variant="outline">
                      {AI_PROVIDERS.find(p => p.id === activeConversation.provider)?.name}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Model: {activeConversation.model} â€¢ 
                    Temperature: {activeConversation.settings.temperature} â€¢ 
                    Max Tokens: {activeConversation.settings.maxTokens}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {/* Messages Area */}
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[calc(100%-140px)] px-4">
                <div className="space-y-4 py-4">
                  {activeConversation.messages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                        <div className={`rounded-lg px-4 py-2 ${
                          message.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          {message.metadata && (
                            <div className="text-xs opacity-70 mt-2 flex items-center space-x-3">
                              {message.metadata.tokens && (
                                <span>ðŸª™ {message.metadata.tokens} tokens</span>
                              )}
                              {message.metadata.cost && (
                                <span>ðŸ’° {formatCurrency(message.metadata.cost)}</span>
                              )}
                              {message.metadata.processingTime && (
                                <span>â±ï¸ {message.metadata.processingTime}s</span>
                              )}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      
                      <Avatar className={`w-8 h-8 ${message.role === 'user' ? 'order-1 ml-3' : 'order-2 mr-3'}`}>
                        <AvatarFallback className={message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}>
                          {message.role === 'user' ? user?.name?.[0] || 'U' : 'ðŸ¤–'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  ))}
                  
                  {isGenerating && (
                    <div className="flex justify-start">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-secondary">ðŸ¤–</AvatarFallback>
                        </Avatar>
                        <div className="bg-muted rounded-lg px-4 py-2">
                          <div className="flex items-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Generating response...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <Textarea
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="pr-20"
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <div className="absolute right-2 bottom-2 flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsListening(!isListening)}
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button 
                    onClick={sendMessage} 
                    disabled={!currentMessage.trim() || isGenerating}
                    className="self-end"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center">
              <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Conversation Selected</h3>
              <p className="text-muted-foreground mb-4">
                Select a conversation from the sidebar or create a new one to start chatting with AI.
              </p>
              <Button onClick={() => setShowNewConversationDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Conversation
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderWorkflows = () => (
    <div className="space-y-6">
      {/* Workflows Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">AI Workflows</h3>
          <p className="text-sm text-muted-foreground">
            Automated AI-powered processes for your events
          </p>
        </div>
        <Button onClick={() => setShowWorkflowDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((workflow) => (
          <Card key={workflow.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${workflow.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <CardTitle className="text-base">{workflow.name}</CardTitle>
                </div>
                <Switch checked={workflow.isActive} />
              </div>
              <CardDescription>{workflow.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Trigger:</span>
                  <Badge variant="outline">{workflow.trigger}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Executions:</span>
                  <span>{workflow.executionCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last run:</span>
                  <span>{workflow.lastRun?.toLocaleDateString() || 'Never'}</span>
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" className="flex-1">
                    <Play className="w-4 h-4 mr-1" />
                    Run
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-6">
      {/* Insights Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">AI Insights</h3>
          <p className="text-sm text-muted-foreground">
            Intelligent recommendations and predictions for your events
          </p>
        </div>
        <Button variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Insights
        </Button>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {insights.map((insight) => (
          <Card key={insight.id}>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  insight.type === 'recommendation' ? 'bg-blue-100 text-blue-600' :
                  insight.type === 'prediction' ? 'bg-purple-100 text-purple-600' :
                  insight.type === 'alert' ? 'bg-red-100 text-red-600' :
                  insight.type === 'trend' ? 'bg-green-100 text-green-600' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  {insight.type === 'recommendation' ? <Lightbulb className="w-5 h-5" /> :
                   insight.type === 'prediction' ? <TrendingUp className="w-5 h-5" /> :
                   insight.type === 'alert' ? <AlertCircle className="w-5 h-5" /> :
                   insight.type === 'trend' ? <BarChart3 className="w-5 h-5" /> :
                   <Target className="w-5 h-5" />}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-semibold">{insight.title}</h4>
                      <Badge variant={insight.impact === 'high' ? 'default' : insight.impact === 'medium' ? 'secondary' : 'outline'}>
                        {insight.impact} impact
                      </Badge>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Target className="w-3 h-3" />
                        <span>{Math.round(insight.confidence * 100)}% confidence</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {insight.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-2">{insight.description}</p>
                  
                  {insight.actionable && insight.actions && (
                    <div className="flex space-x-2 mt-3">
                      {insight.actions.map((action, index) => (
                        <Button key={index} size="sm" variant="outline">
                          {action}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderUsageAnalytics = () => (
    <div className="space-y-6">
      {usageMetrics && (
        <>
          {/* Usage Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Tokens</p>
                    <p className="text-2xl font-bold">{(usageMetrics.totalTokens / 1000000).toFixed(1)}M</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                    <p className="text-2xl font-bold">{formatCurrency(usageMetrics.totalCost)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Requests</p>
                    <p className="text-2xl font-bold">{usageMetrics.requestCount.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                    <p className="text-2xl font-bold">{usageMetrics.avgResponseTime}s</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Model Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Model Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {usageMetrics.topModels.map((model) => (
                  <div key={model.model} className="flex items-center justify-between">
                    <span className="font-medium">{model.model}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${model.usage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {model.usage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {usageMetrics.costBreakdown.map((provider) => (
                  <div key={provider.provider} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {AI_PROVIDERS.find(p => p.id === provider.provider)?.logo}
                      </span>
                      <span className="font-medium capitalize">{provider.provider}</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(provider.cost)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">AI-Powered Features</h1>
          <p className="text-muted-foreground">
            Advanced AI capabilities with multi-provider support and intelligent automation
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-1" />
            AI Settings
          </Button>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
            <Sparkles className="w-4 h-4 mr-1" />
            New AI Feature
          </Button>
        </div>
      </div>

      {/* AI Provider Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Brain className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-semibold">AI Providers Status</h3>
                <p className="text-sm text-muted-foreground">
                  {AI_PROVIDERS.length} providers configured â€¢ All systems operational
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              {AI_PROVIDERS.map((provider) => (
                <div key={provider.id} className="flex items-center space-x-2 px-3 py-2 rounded-lg border">
                  <span>{provider.logo}</span>
                  <span className="text-sm font-medium">{provider.name}</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="analytics">Usage Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="conversations">
          {renderConversations()}
        </TabsContent>

        <TabsContent value="workflows">
          {renderWorkflows()}
        </TabsContent>

        <TabsContent value="insights">
          {renderInsights()}
        </TabsContent>

        <TabsContent value="analytics">
          {renderUsageAnalytics()}
        </TabsContent>
      </Tabs>

      {/* New Conversation Dialog */}
      <Dialog open={showNewConversationDialog} onOpenChange={setShowNewConversationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New AI Conversation</DialogTitle>
            <DialogDescription>
              Start a new conversation with AI assistant
            </DialogDescription>
          </DialogHeader>
          
          <Form {...conversationForm}>
            <form onSubmit={conversationForm.handleSubmit(createConversation)} className="space-y-4">
              <FormField
                control={conversationForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conversation Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Event Planning Discussion" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={conversationForm.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AI Provider</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AI_PROVIDERS.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            <div className="flex items-center space-x-2">
                              <span>{provider.logo}</span>
                              <span>{provider.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowNewConversationDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  Create Conversation
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}