'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, Send, Search, Phone, Video, MoreVertical,
  Smile, Paperclip, Image as ImageIcon, Mic, X, Check, CheckCheck,
  Clock, Calendar, Star, Pin, Archive, Trash2, Bell, BellOff,
  User, Users, ChevronLeft, Settings, Filter, Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

// Types
export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'meeting-invite' | 'system';
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: string;
  attachments?: MessageAttachment[];
  meetingInvite?: MeetingInvite;
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'video';
  url: string;
  size: number;
}

export interface MeetingInvite {
  id: string;
  title: string;
  dateTime: Date;
  duration: number; // minutes
  type: 'video' | 'phone' | 'in-person';
  location?: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  lastMessage?: DirectMessage;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  userId: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
  role?: string;
  company?: string;
}

interface ConnectionMessagingProps {
  selectedConversationId?: string;
  onClose?: () => void;
  isFullPage?: boolean;
}

// Mock data for conversations
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    participants: [
      { userId: 'user-1', name: 'Sarah Chen', isOnline: true, role: 'Product Manager', company: 'TechCorp' },
    ],
    lastMessage: {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'user-1',
      content: 'That sounds great! Let me check my calendar.',
      type: 'text',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      status: 'read',
    },
    unreadCount: 0,
    isPinned: true,
    isMuted: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: 'conv-2',
    participants: [
      { userId: 'user-2', name: 'Michael Rodriguez', isOnline: false, lastSeen: new Date(Date.now() - 30 * 60 * 1000), role: 'Software Engineer', company: 'StartupXYZ' },
    ],
    lastMessage: {
      id: 'msg-2',
      conversationId: 'conv-2',
      senderId: 'current-user',
      content: 'Looking forward to our meeting tomorrow!',
      type: 'text',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'delivered',
    },
    unreadCount: 2,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'conv-3',
    participants: [
      { userId: 'user-3', name: 'Emily Watson', isOnline: true, role: 'UX Designer', company: 'DesignStudio' },
    ],
    lastMessage: {
      id: 'msg-3',
      conversationId: 'conv-3',
      senderId: 'user-3',
      content: 'Thanks for connecting! Would love to chat about the project.',
      type: 'text',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'read',
    },
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: 'conv-4',
    participants: [
      { userId: 'user-4', name: 'David Kim', isOnline: false, lastSeen: new Date(Date.now() - 3 * 60 * 60 * 1000), role: 'Founder', company: 'InnovateTech' },
    ],
    lastMessage: {
      id: 'msg-4',
      conversationId: 'conv-4',
      senderId: 'user-4',
      content: "I've sent you the meeting invite. See you there!",
      type: 'meeting-invite',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: 'read',
      meetingInvite: {
        id: 'meet-1',
        title: 'Coffee Chat',
        dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        duration: 30,
        type: 'video',
        status: 'accepted',
      },
    },
    unreadCount: 0,
    isPinned: false,
    isMuted: true,
    isArchived: false,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
];

// Mock messages for a conversation
const MOCK_MESSAGES: DirectMessage[] = [
  {
    id: 'msg-1-1',
    conversationId: 'conv-1',
    senderId: 'current-user',
    content: 'Hi Sarah! Great connecting with you at the conference.',
    type: 'text',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'read',
  },
  {
    id: 'msg-1-2',
    conversationId: 'conv-1',
    senderId: 'user-1',
    content: 'Hey! Yes, it was great meeting you too! Your talk on AI was really insightful.',
    type: 'text',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
    status: 'read',
  },
  {
    id: 'msg-1-3',
    conversationId: 'conv-1',
    senderId: 'current-user',
    content: 'Thanks! Would you be interested in grabbing a virtual coffee sometime? Would love to hear more about your product roadmap.',
    type: 'text',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: 'read',
  },
  {
    id: 'msg-1-4',
    conversationId: 'conv-1',
    senderId: 'user-1',
    content: 'That sounds great! Let me check my calendar.',
    type: 'text',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    status: 'read',
  },
];

export default function ConnectionMessaging({
  selectedConversationId,
  onClose,
  isFullPage = false,
}: ConnectionMessagingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'pinned'>('all');

  // Initialize with selected conversation
  useEffect(() => {
    if (selectedConversationId) {
      const conv = conversations.find(c => c.id === selectedConversationId);
      if (conv) {
        setActiveConversation(conv);
        setShowMobileChat(true);
      }
    }
  }, [selectedConversationId, conversations]);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversation) {
      // In real app, fetch messages from API
      setMessages(MOCK_MESSAGES.filter(m => m.conversationId === activeConversation.id));
    }
  }, [activeConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.participants.some(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesFilter =
      filter === 'all' ||
      (filter === 'unread' && conv.unreadCount > 0) ||
      (filter === 'pinned' && conv.isPinned);
    return matchesSearch && matchesFilter && !conv.isArchived;
  });

  // Sort: pinned first, then by last message time
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !activeConversation) return;

    const message: DirectMessage = {
      id: `msg-${Date.now()}`,
      conversationId: activeConversation.id,
      senderId: 'current-user',
      content: newMessage.trim(),
      type: 'text',
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulate message being sent
    setTimeout(() => {
      setMessages(prev =>
        prev.map(m => m.id === message.id ? { ...m, status: 'sent' } : m)
      );
    }, 500);

    // Simulate delivery
    setTimeout(() => {
      setMessages(prev =>
        prev.map(m => m.id === message.id ? { ...m, status: 'delivered' } : m)
      );
    }, 1500);

    // Update conversation's last message
    setConversations(prev =>
      prev.map(c =>
        c.id === activeConversation.id
          ? { ...c, lastMessage: message, updatedAt: new Date() }
          : c
      )
    );
  }, [newMessage, activeConversation]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const togglePin = (convId: string) => {
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, isPinned: !c.isPinned } : c)
    );
  };

  const toggleMute = (convId: string) => {
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, isMuted: !c.isMuted } : c)
    );
  };

  const archiveConversation = (convId: string) => {
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, isArchived: true } : c)
    );
    if (activeConversation?.id === convId) {
      setActiveConversation(null);
    }
    toast({
      title: 'Conversation archived',
      description: 'You can find it in your archived messages.',
    });
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase();

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderMessageStatus = (status: DirectMessage['status']) => {
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-muted-foreground" />;
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-primary" />;
    }
  };

  return (
    <TooltipProvider>
      <div className={cn(
        "flex bg-background rounded-lg border overflow-hidden",
        isFullPage ? "h-[calc(100vh-120px)]" : "h-[600px]"
      )}>
        {/* Conversations List */}
        <div className={cn(
          "border-r flex flex-col",
          showMobileChat && activeConversation ? "hidden md:flex" : "flex",
          "w-full md:w-80 lg:w-96"
        )}>
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Messages</h2>
              <Button variant="ghost" size="icon">
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 mt-3">
              {(['all', 'unread', 'pinned'] as const).map(f => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className="text-xs"
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Conversations */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {sortedConversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No conversations found</p>
                </div>
              ) : (
                sortedConversations.map(conv => {
                  const participant = conv.participants[0];
                  const isActive = activeConversation?.id === conv.id;

                  return (
                    <motion.button
                      key={conv.id}
                      onClick={() => {
                        setActiveConversation(conv);
                        setShowMobileChat(true);
                        // Mark as read
                        setConversations(prev =>
                          prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c)
                        );
                      }}
                      className={cn(
                        "w-full p-3 rounded-lg flex items-start gap-3 transition-colors text-left",
                        isActive ? "bg-primary/10" : "hover:bg-muted"
                      )}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      {/* Avatar */}
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={participant.avatar} />
                          <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
                        </Avatar>
                        {participant.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium truncate flex items-center gap-1">
                            {participant.name}
                            {conv.isPinned && <Pin className="h-3 w-3 text-muted-foreground" />}
                            {conv.isMuted && <BellOff className="h-3 w-3 text-muted-foreground" />}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {conv.lastMessage && formatTime(conv.lastMessage.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className={cn(
                            "text-sm truncate",
                            conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                          )}>
                            {conv.lastMessage?.senderId === 'current-user' && (
                              <span className="text-muted-foreground">You: </span>
                            )}
                            {conv.lastMessage?.type === 'meeting-invite'
                              ? '📅 Meeting invite'
                              : conv.lastMessage?.content}
                          </p>
                          {conv.unreadCount > 0 && (
                            <Badge className="ml-2 h-5 min-w-5 px-1.5">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col",
          !showMobileChat && !activeConversation ? "hidden md:flex" : "flex"
        )}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setShowMobileChat(false)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getInitials(activeConversation.participants[0].name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{activeConversation.participants[0].name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {activeConversation.participants[0].isOnline
                        ? 'Online'
                        : activeConversation.participants[0].lastSeen
                          ? `Last seen ${formatTime(activeConversation.participants[0].lastSeen)}`
                          : 'Offline'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Phone className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Voice call</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Video className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Video call</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Calendar className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Schedule meeting</TooltipContent>
                  </Tooltip>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => togglePin(activeConversation.id)}>
                        <Pin className="h-4 w-4 mr-2" />
                        {activeConversation.isPinned ? 'Unpin' : 'Pin'} conversation
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleMute(activeConversation.id)}>
                        {activeConversation.isMuted ? (
                          <><Bell className="h-4 w-4 mr-2" /> Unmute</>
                        ) : (
                          <><BellOff className="h-4 w-4 mr-2" /> Mute</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => archiveConversation(activeConversation.id)}>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive conversation
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete conversation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isOwn = message.senderId === 'current-user';
                    const showAvatar = !isOwn && (
                      index === 0 ||
                      messages[index - 1].senderId !== message.senderId
                    );

                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex gap-2",
                          isOwn ? "justify-end" : "justify-start"
                        )}
                      >
                        {!isOwn && showAvatar && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarFallback className="text-xs">
                              {getInitials(activeConversation.participants[0].name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        {!isOwn && !showAvatar && <div className="w-8" />}

                        <div className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-2",
                          isOwn
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        )}>
                          {message.type === 'meeting-invite' && message.meetingInvite ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span className="font-medium">{message.meetingInvite.title}</span>
                              </div>
                              <p className="text-sm opacity-90">
                                {message.meetingInvite.dateTime.toLocaleDateString()} at{' '}
                                {message.meetingInvite.dateTime.toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                              <p className="text-sm opacity-90">
                                Duration: {message.meetingInvite.duration} minutes
                              </p>
                              {!isOwn && message.meetingInvite.status === 'pending' && (
                                <div className="flex gap-2 mt-2">
                                  <Button size="sm" variant="secondary" className="h-7">
                                    Accept
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7">
                                    Decline
                                  </Button>
                                </div>
                              )}
                              {message.meetingInvite.status !== 'pending' && (
                                <Badge variant={message.meetingInvite.status === 'accepted' ? 'default' : 'secondary'}>
                                  {message.meetingInvite.status}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          )}
                          <div className={cn(
                            "flex items-center gap-1 mt-1",
                            isOwn ? "justify-end" : "justify-start"
                          )}>
                            <span className="text-xs opacity-70">
                              {formatTime(message.timestamp)}
                            </span>
                            {isOwn && renderMessageStatus(message.status)}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(activeConversation.participants[0].name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t">
                <div className="flex items-end gap-2">
                  <div className="flex gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <Paperclip className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Attach file</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <ImageIcon className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Send image</TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="flex-1 relative">
                    <Textarea
                      ref={inputRef}
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="min-h-[44px] max-h-32 resize-none pr-10"
                      rows={1}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 bottom-1 h-8 w-8"
                    >
                      <Smile className="h-5 w-5" />
                    </Button>
                  </div>

                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    size="icon"
                    className="h-10 w-10"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">Your Messages</h3>
                <p className="text-muted-foreground max-w-sm">
                  Select a conversation to start chatting with your connections
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
