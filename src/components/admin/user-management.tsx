'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Search,
  MoreHorizontal,
  Mail,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Ban,
  CheckCircle2,
  Edit,
  Download,
  RefreshCw,
  Eye,
  Calendar,
  Activity,
  TrendingUp,
  Award,
  MessageSquare,
  AlertTriangle,
  UserCheck,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { cn } from '@/core/utils/utils';

interface UserFilters {
  search: string;
  role: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default function UserManagement() {
  const { toast } = useToast();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banReason, setBanReason] = useState('');
  const itemsPerPage = 10;

  // Use Convex hooks
  const convexUsers = useQuery(api.admin.getUsers, {
    role: filters.role,
    search: filters.search,
  });
  
  const updateRoleMutation = useMutation(api.admin.updateUserRole);
  const updateStatusMutation = useMutation(api.admin.updateUserStatus);

  const loading = convexUsers === undefined;
  const users = convexUsers || [];

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    let result = [...users].map((u: any) => ({
      ...u,
      id: u._id,
      createdAt: new Date(u._creationTime),
      lastActive: new Date(u._creationTime),
      eventsAttended: u.eventsAttended || 0,
      points: u.points || 0,
      status: u.status || 'active',
      photoURL: u.image || u.photoURL,
    }));

    if (filters.status !== 'all') {
      result = result.filter(user => user.status === filters.status);
    }

    return result;
  }, [users, filters]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u: any) => u.status === 'active' || !u.status).length,
    suspended: users.filter((u: any) => u.status === 'suspended').length,
    pending: users.filter((u: any) => u.status === 'pending').length,
    banned: users.filter((u: any) => u.status === 'banned').length,
    organizers: users.filter((u: any) => u.role === 'organizer').length,
    admins: users.filter((u: any) => u.role === 'admin').length
  }), [users]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'banned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleChangeRole = async (userId: string, newRole: any) => {
    try {
      await updateRoleMutation({ userId: userId as any, role: newRole });
      toast({ title: 'Role Updated' });
    } catch (e) {
      toast({ title: 'Update Failed', variant: 'destructive' });
    }
  };

  const handleChangeStatus = async (userId: string, newStatus: string) => {
    try {
      await updateStatusMutation({ userId: userId as any, status: newStatus });
      toast({ title: 'Status Updated' });
    } catch (e) {
      toast({ title: 'Update Failed', variant: 'destructive' });
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banReason) return;
    await handleChangeStatus(selectedUser.id, 'banned');
    setShowBanDialog(false);
    setBanReason('');
    setSelectedUser(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="p-4 text-white">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground text-white">Total Users</p>
        </Card>
        <Card className="p-4 bg-green-500/10 text-white">
            <p className="text-2xl font-bold">{stats.active}</p>
            <p className="text-xs text-muted-foreground text-white">Active</p>
        </Card>
        <Card className="p-4 bg-red-500/10 text-white">
            <p className="text-2xl font-bold">{stats.banned}</p>
            <p className="text-xs text-muted-foreground text-white">Banned</p>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search users..." className="pl-10 text-white" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            </div>
            <Select value={filters.role} onValueChange={(v) => setFilters({ ...filters, role: v })}>
                <SelectTrigger className="w-[140px] text-white"><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Roles</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="organizer">Organizer</SelectItem><SelectItem value="attendee">Attendee</SelectItem></SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <Table>
            <TableHeader><TableRow><TableHead className="text-white">User</TableHead><TableHead className="text-white">Role</TableHead><TableHead className="text-white">Status</TableHead><TableHead className="text-white text-right">Points</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
            <TableBody>
                {paginatedUsers.map((user) => (
                <TableRow key={user.id} className="border-white/10">
                    <TableCell>
                        <div className="flex items-center gap-3 text-white">
                            <Avatar className="h-9 w-9"><AvatarImage src={user.photoURL} /><AvatarFallback>{user.name.charAt(0)}</AvatarFallback></Avatar>
                            <div><p className="font-medium">{user.name}</p><p className="text-xs text-gray-400">{user.email}</p></div>
                        </div>
                    </TableCell>
                    <TableCell className="text-white capitalize">{user.role}</TableCell>
                    <TableCell><Badge className={cn("capitalize", getStatusColor(user.status))}>{user.status}</Badge></TableCell>
                    <TableCell className="text-right text-white font-mono">{user.points}</TableCell>
                    <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4 text-white" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'admin')}>Set as Admin</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'organizer')}>Set as Organizer</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleChangeStatus(user.id, 'suspended')}>Suspend</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedUser(user); setShowBanDialog(true); }} className="text-red-600">Ban User</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between text-white">
        <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</p>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Ban User</AlertDialogTitle><AlertDialogDescription>Are you sure you want to ban {selectedUser?.name}?</AlertDialogDescription></AlertDialogHeader>
          <div className="py-4"><Label>Ban Reason</Label><Textarea placeholder="Reason..." value={banReason} onChange={(e) => setBanReason(e.target.value)} className="mt-2" /></div>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleBanUser} disabled={!banReason} className="bg-red-600">Ban User</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}