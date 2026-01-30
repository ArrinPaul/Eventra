'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Filter, Download, Mail, UserPlus, 
  CheckCircle, XCircle, Clock, Loader2, MoreVertical,
  MessageSquare, Calendar, Star, MapPin, Building, GraduationCap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/core/utils/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/core/config/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// Types
interface Attendee {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  department?: string;
  year?: string;
  company?: string;
  bio?: string;
  interests?: string[];
  registrationDate: Date;
  checkInStatus: 'checked-in' | 'not-checked-in' | 'no-show';
  checkInTime?: Date;
  ticketType?: string;
  isVIP?: boolean;
  connectionStatus?: 'connected' | 'pending' | 'none';
}

interface AttendeeStats {
  total: number;
  checkedIn: number;
  notCheckedIn: number;
  vipCount: number;
  checkInRate: number;
}

interface AttendeesDisplayProps {
  eventId: string;
  eventTitle?: string;
  isOrganizer?: boolean;
  maxDisplay?: number;
  showStats?: boolean;
  allowConnect?: boolean;
  compact?: boolean;
}

const CHECK_IN_STATUS_CONFIG = {
  'checked-in': { label: 'Checked In', color: 'bg-green-500', icon: CheckCircle },
  'not-checked-in': { label: 'Not Checked In', color: 'bg-yellow-500', icon: Clock },
  'no-show': { label: 'No Show', color: 'bg-red-500', icon: XCircle },
};

// Helper function to convert Firestore Timestamp to Date
const toDate = (timestamp: Timestamp | Date | undefined): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp);
};

export default function AttendeesDisplay({ 
  eventId, 
  eventTitle,
  isOrganizer = false,
  maxDisplay,
  showStats = true,
  allowConnect = true,
  compact = false
}: AttendeesDisplayProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTicketType, setFilterTicketType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [stats, setStats] = useState<AttendeeStats>({
    total: 0,
    checkedIn: 0,
    notCheckedIn: 0,
    vipCount: 0,
    checkInRate: 0
  });
  const [ticketTypes, setTicketTypes] = useState<string[]>([]);

  // Load attendees from Firestore
  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    const loadAttendees = async () => {
      setLoading(true);
      
      try {
        // First get the event to get attendee IDs
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (!eventDoc.exists()) {
          setLoading(false);
          return;
        }
        
        const eventData = eventDoc.data();
        const attendeeIds: string[] = eventData.attendees || [];
        
        if (attendeeIds.length === 0) {
          setAttendees([]);
          setLoading(false);
          return;
        }

        // Get tickets for check-in status
        const ticketsRef = collection(db, 'tickets');
        const ticketsQuery = query(ticketsRef, where('eventId', '==', eventId));
        const ticketsSnapshot = await getDocs(ticketsQuery);
        
        const ticketMap: Record<string, { 
          checkInStatus: string; 
          checkInTime?: Date;
          ticketType?: string;
          registrationDate?: Date;
        }> = {};
        
        const ticketTypesSet = new Set<string>();
        
        ticketsSnapshot.forEach((ticketDoc) => {
          const ticket = ticketDoc.data();
          ticketMap[ticket.userId] = {
            checkInStatus: ticket.scannedAt ? 'checked-in' : 'not-checked-in',
            checkInTime: ticket.scannedAt ? toDate(ticket.scannedAt) : undefined,
            ticketType: ticket.ticketType || 'General',
            registrationDate: toDate(ticket.createdAt)
          };
          if (ticket.ticketType) {
            ticketTypesSet.add(ticket.ticketType);
          }
        });
        
        setTicketTypes(Array.from(ticketTypesSet));

        // Get user profiles for attendees
        const attendeesData: Attendee[] = [];
        
        // Batch fetch user profiles (Firestore limits to 10 for 'in' queries)
        const batchSize = 10;
        for (let i = 0; i < attendeeIds.length; i += batchSize) {
          const batch = attendeeIds.slice(i, i + batchSize);
          const usersQuery = query(
            collection(db, 'users'),
            where('__name__', 'in', batch)
          );
          const usersSnapshot = await getDocs(usersQuery);
          
          usersSnapshot.forEach((userDoc) => {
            const userData = userDoc.data();
            const ticketInfo = ticketMap[userDoc.id] || {};
            
            attendeesData.push({
              id: userDoc.id,
              name: userData.name || userData.displayName || 'Unknown',
              email: userData.email || '',
              avatar: userData.photoURL || userData.avatar,
              role: userData.role,
              department: userData.department,
              year: userData.year,
              company: userData.company,
              bio: userData.bio,
              interests: userData.interests || [],
              registrationDate: ticketInfo.registrationDate || new Date(),
              checkInStatus: (ticketInfo.checkInStatus as Attendee['checkInStatus']) || 'not-checked-in',
              checkInTime: ticketInfo.checkInTime,
              ticketType: ticketInfo.ticketType || 'General',
              isVIP: ticketInfo.ticketType?.toLowerCase().includes('vip')
            });
          });
        }
        
        // Check connection status if user is logged in
        if (user?.uid && allowConnect) {
          const connectionsQuery = query(
            collection(db, 'connections'),
            where('userId', '==', user.uid)
          );
          const connectionsSnapshot = await getDocs(connectionsQuery);
          
          const connections: Record<string, string> = {};
          connectionsSnapshot.forEach((connDoc) => {
            const conn = connDoc.data();
            connections[conn.connectedUserId] = conn.status;
          });
          
          attendeesData.forEach(attendee => {
            if (attendee.id === user.uid) {
              attendee.connectionStatus = 'connected'; // Self
            } else if (connections[attendee.id]) {
              attendee.connectionStatus = connections[attendee.id] as 'connected' | 'pending';
            } else {
              attendee.connectionStatus = 'none';
            }
          });
        }
        
        setAttendees(attendeesData);
        
        // Calculate stats
        const checkedIn = attendeesData.filter(a => a.checkInStatus === 'checked-in').length;
        const vipCount = attendeesData.filter(a => a.isVIP).length;
        
        setStats({
          total: attendeesData.length,
          checkedIn,
          notCheckedIn: attendeesData.length - checkedIn,
          vipCount,
          checkInRate: attendeesData.length > 0 ? Math.round((checkedIn / attendeesData.length) * 100) : 0
        });
        
      } catch (error) {
        console.error('Error loading attendees:', error);
        toast({
          title: 'Error',
          description: 'Failed to load attendees',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadAttendees();
  }, [eventId, user?.uid, allowConnect, toast]);

  // Filter and sort attendees
  const filteredAttendees = useMemo(() => {
    let filtered = [...attendees];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.email.toLowerCase().includes(query) ||
        a.department?.toLowerCase().includes(query) ||
        a.company?.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(a => a.checkInStatus === filterStatus);
    }
    
    // Ticket type filter
    if (filterTicketType !== 'all') {
      filtered = filtered.filter(a => a.ticketType === filterTicketType);
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'registration':
          return b.registrationDate.getTime() - a.registrationDate.getTime();
        case 'checkIn':
          const statusOrder = { 'checked-in': 0, 'not-checked-in': 1, 'no-show': 2 };
          return statusOrder[a.checkInStatus] - statusOrder[b.checkInStatus];
        default:
          return 0;
      }
    });
    
    // Apply max display limit
    if (maxDisplay && maxDisplay > 0) {
      filtered = filtered.slice(0, maxDisplay);
    }
    
    return filtered;
  }, [attendees, searchQuery, filterStatus, filterTicketType, sortBy, maxDisplay]);

  // Handle connection request
  const handleConnect = async (attendee: Attendee) => {
    if (!user?.uid || attendee.id === user.uid) return;
    
    try {
      // Create connection request
      await updateDoc(doc(db, 'connections', `${user.uid}_${attendee.id}`), {
        userId: user.uid,
        connectedUserId: attendee.id,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      // Update local state
      setAttendees(prev => prev.map(a => 
        a.id === attendee.id ? { ...a, connectionStatus: 'pending' } : a
      ));
      
      toast({
        title: 'Connection Request Sent',
        description: `Request sent to ${attendee.name}`
      });
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast({
        title: 'Error',
        description: 'Failed to send connection request',
        variant: 'destructive'
      });
    }
  };

  // Handle manual check-in (organizer only)
  const handleManualCheckIn = async (attendeeId: string) => {
    if (!isOrganizer) return;
    
    try {
      // Find and update the ticket
      const ticketsQuery = query(
        collection(db, 'tickets'),
        where('eventId', '==', eventId),
        where('userId', '==', attendeeId)
      );
      const ticketsSnapshot = await getDocs(ticketsQuery);
      
      if (!ticketsSnapshot.empty) {
        const ticketDoc = ticketsSnapshot.docs[0];
        await updateDoc(doc(db, 'tickets', ticketDoc.id), {
          scannedAt: serverTimestamp(),
          manualCheckIn: true
        });
        
        // Update local state
        setAttendees(prev => prev.map(a => 
          a.id === attendeeId ? { ...a, checkInStatus: 'checked-in', checkInTime: new Date() } : a
        ));
        
        // Update stats
        setStats(prev => ({
          ...prev,
          checkedIn: prev.checkedIn + 1,
          notCheckedIn: prev.notCheckedIn - 1,
          checkInRate: Math.round(((prev.checkedIn + 1) / prev.total) * 100)
        }));
        
        toast({
          title: 'Checked In',
          description: 'Attendee has been checked in successfully'
        });
      }
    } catch (error) {
      console.error('Error checking in attendee:', error);
      toast({
        title: 'Error',
        description: 'Failed to check in attendee',
        variant: 'destructive'
      });
    }
  };

  // Export attendees as CSV
  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Department', 'Ticket Type', 'Check-In Status', 'Registration Date'];
    const rows = filteredAttendees.map(a => [
      a.name,
      a.email,
      a.department || '',
      a.ticketType || '',
      a.checkInStatus,
      a.registrationDate.toLocaleDateString()
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendees-${eventId}.csv`;
    link.click();
  };

  // Render attendee card
  const renderAttendeeCard = (attendee: Attendee) => {
    const statusConfig = CHECK_IN_STATUS_CONFIG[attendee.checkInStatus];
    const StatusIcon = statusConfig.icon;
    
    return (
      <motion.div
        key={attendee.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="group"
      >
        <Card className={cn(
          "hover:shadow-md transition-all cursor-pointer",
          attendee.isVIP && "border-yellow-500/50 bg-gradient-to-br from-yellow-50/50 to-transparent dark:from-yellow-950/20",
          selectedAttendees.includes(attendee.id) && "ring-2 ring-primary"
        )}>
          <CardContent className={cn("p-4", compact && "p-3")}>
            <div className="flex items-start gap-3">
              {isOrganizer && (
                <Checkbox
                  checked={selectedAttendees.includes(attendee.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedAttendees(prev => [...prev, attendee.id]);
                    } else {
                      setSelectedAttendees(prev => prev.filter(id => id !== attendee.id));
                    }
                  }}
                  className="mt-1"
                />
              )}
              
              <div className="relative">
                <Avatar className={cn("h-12 w-12", compact && "h-10 w-10")}>
                  <AvatarImage src={attendee.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {attendee.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {attendee.isVIP && (
                  <div className="absolute -top-1 -right-1 p-0.5 bg-yellow-500 rounded-full">
                    <Star className="h-3 w-3 text-white fill-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className={cn("font-semibold truncate", compact && "text-sm")}>
                    {attendee.name}
                  </h3>
                  {attendee.isVIP && (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300 text-xs">
                      VIP
                    </Badge>
                  )}
                </div>
                
                {!compact && (
                  <>
                    <p className="text-sm text-muted-foreground truncate mb-1">
                      {attendee.email}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {attendee.department && (
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {attendee.department}
                        </span>
                      )}
                      {attendee.year && (
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          {attendee.year}
                        </span>
                      )}
                      {attendee.ticketType && (
                        <Badge variant="secondary" className="text-xs">
                          {attendee.ticketType}
                        </Badge>
                      )}
                    </div>
                  </>
                )}
                
                <div className="flex items-center gap-2 mt-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
                          statusConfig.color.replace('bg-', 'bg-opacity-20 bg-'),
                          statusConfig.color.replace('bg-', 'text-').replace('-500', '-700')
                        )}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {attendee.checkInTime 
                          ? `Checked in at ${attendee.checkInTime.toLocaleTimeString()}`
                          : 'Not yet checked in'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {allowConnect && user?.uid && attendee.id !== user.uid && (
                  <>
                    {attendee.connectionStatus === 'none' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConnect(attendee);
                        }}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    )}
                    {attendee.connectionStatus === 'pending' && (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                    {attendee.connectionStatus === 'connected' && (
                      <Badge variant="default">Connected</Badge>
                    )}
                  </>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setSelectedAttendee(attendee);
                      setShowProfileDialog(true);
                    }}>
                      <Users className="h-4 w-4 mr-2" />
                      View Profile
                    </DropdownMenuItem>
                    {attendee.email && (
                      <DropdownMenuItem onClick={() => window.location.href = `mailto:${attendee.email}`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </DropdownMenuItem>
                    )}
                    {isOrganizer && attendee.checkInStatus !== 'checked-in' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleManualCheckIn(attendee.id)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Manual Check-In
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Compact avatar stack view
  const renderCompactView = () => {
    const displayAttendees = maxDisplay ? attendees.slice(0, maxDisplay) : attendees;
    const remaining = attendees.length - displayAttendees.length;
    
    return (
      <div className="flex items-center">
        <div className="flex -space-x-2">
          {displayAttendees.map((attendee, index) => (
            <TooltipProvider key={attendee.id}>
              <Tooltip>
                <TooltipTrigger>
                  <Avatar 
                    className={cn(
                      "h-8 w-8 border-2 border-background ring-2 ring-transparent hover:ring-primary transition-all cursor-pointer",
                      attendee.isVIP && "ring-yellow-500"
                    )}
                    style={{ zIndex: displayAttendees.length - index }}
                  >
                    <AvatarImage src={attendee.avatar} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {attendee.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{attendee.name}</p>
                  {attendee.department && <p className="text-xs text-muted-foreground">{attendee.department}</p>}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {remaining > 0 && (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
              +{remaining}
            </div>
          )}
        </div>
        <span className="ml-3 text-sm text-muted-foreground">
          {attendees.length} attendee{attendees.length !== 1 ? 's' : ''}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Compact mode for embedding
  if (compact && maxDisplay) {
    return renderCompactView();
  }

  return (
    <div className="space-y-4">
      {/* Stats Section */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-xl font-bold">{stats.checkedIn}</p>
                  <p className="text-xs text-muted-foreground">Checked In</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-xl font-bold">{stats.notCheckedIn}</p>
                  <p className="text-xs text-muted-foreground">Not Checked In</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-xl font-bold">{stats.vipCount}</p>
                  <p className="text-xs text-muted-foreground">VIP</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="relative h-10 w-10">
                  <svg className="h-10 w-10 -rotate-90">
                    <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted" />
                    <circle 
                      cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="4" 
                      strokeDasharray={`${stats.checkInRate} 100`}
                      className="text-green-500"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.checkInRate}%</p>
                  <p className="text-xs text-muted-foreground">Check-In Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search attendees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="checked-in">Checked In</SelectItem>
                <SelectItem value="not-checked-in">Not Checked In</SelectItem>
                <SelectItem value="no-show">No Show</SelectItem>
              </SelectContent>
            </Select>
            
            {ticketTypes.length > 0 && (
              <Select value={filterTicketType} onValueChange={setFilterTicketType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Ticket Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tickets</SelectItem>
                  {ticketTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="registration">Registration Date</SelectItem>
                <SelectItem value="checkIn">Check-In Status</SelectItem>
              </SelectContent>
            </Select>
            
            {isOrganizer && (
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
          
          {isOrganizer && selectedAttendees.length > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <span className="text-sm text-muted-foreground">
                {selectedAttendees.length} selected
              </span>
              <Button size="sm" variant="outline" onClick={() => {
                // Bulk email
                const emails = attendees
                  .filter(a => selectedAttendees.includes(a.id))
                  .map(a => a.email)
                  .join(',');
                window.location.href = `mailto:${emails}`;
              }}>
                <Mail className="h-4 w-4 mr-1" />
                Email Selected
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedAttendees([])}>
                Clear Selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendees List */}
      <ScrollArea className="h-[calc(100vh-400px)] min-h-[300px]">
        <AnimatePresence mode="popLayout">
          {filteredAttendees.length === 0 ? (
            <Card className="text-center p-8">
              <CardContent>
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No attendees found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || filterStatus !== 'all' || filterTicketType !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No one has registered for this event yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredAttendees.map(attendee => renderAttendeeCard(attendee))}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-md">
          {selectedAttendee && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedAttendee.avatar} />
                    <AvatarFallback className="text-xl bg-primary/10 text-primary">
                      {selectedAttendee.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="flex items-center gap-2">
                      {selectedAttendee.name}
                      {selectedAttendee.isVIP && (
                        <Badge className="bg-yellow-500">VIP</Badge>
                      )}
                    </DialogTitle>
                    <DialogDescription>{selectedAttendee.email}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-4">
                {selectedAttendee.bio && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">About</h4>
                    <p className="text-sm text-muted-foreground">{selectedAttendee.bio}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  {selectedAttendee.department && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Department</h4>
                      <p className="text-sm text-muted-foreground">{selectedAttendee.department}</p>
                    </div>
                  )}
                  {selectedAttendee.year && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Year</h4>
                      <p className="text-sm text-muted-foreground">{selectedAttendee.year}</p>
                    </div>
                  )}
                  {selectedAttendee.company && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Company</h4>
                      <p className="text-sm text-muted-foreground">{selectedAttendee.company}</p>
                    </div>
                  )}
                  {selectedAttendee.ticketType && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Ticket Type</h4>
                      <Badge variant="secondary">{selectedAttendee.ticketType}</Badge>
                    </div>
                  )}
                </div>
                
                {selectedAttendee.interests && selectedAttendee.interests.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Interests</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAttendee.interests.map(interest => (
                        <Badge key={interest} variant="outline">{interest}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Check-In Status</h4>
                    <div className="flex items-center gap-2 mt-1">
                      {(() => {
                        const StatusIcon = CHECK_IN_STATUS_CONFIG[selectedAttendee.checkInStatus].icon;
                        return <StatusIcon className="h-4 w-4" />;
                      })()}
                      <span className="text-sm">{CHECK_IN_STATUS_CONFIG[selectedAttendee.checkInStatus].label}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <h4 className="text-sm font-medium">Registered</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedAttendee.registrationDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowProfileDialog(false)}>
                  Close
                </Button>
                {allowConnect && user?.uid && selectedAttendee.id !== user.uid && selectedAttendee.connectionStatus === 'none' && (
                  <Button onClick={() => {
                    handleConnect(selectedAttendee);
                    setShowProfileDialog(false);
                  }}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
