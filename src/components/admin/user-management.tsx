'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
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
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  UserPlus,
  Mail,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Ban,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
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
  UserX,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { userManagementService, type UserData, type UserFilters } from '@/lib/user-management-service';

export default function UserManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    loadUsers();
  }, [filters.role, filters.status, filters.sortBy, filters.sortOrder]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await userManagementService.getUsers(
        {
          role: filters.role,
          status: filters.status,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          search: filters.search,
        },
        50 // Get more for client-side filtering
      );
      
      setUsers(result.data);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load users. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(user =>
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.department?.toLowerCase().includes(search)
      );
    }

    // Role filter
    if (filters.role !== 'all') {
      result = result.filter(user => user.role === filters.role);
    }

    // Status filter
    if (filters.status !== 'all') {
      result = result.filter(user => user.status === filters.status);
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'lastActive':
          comparison = new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
          break;
        case 'points':
          comparison = b.points - a.points;
          break;
        case 'eventsAttended':
          comparison = b.eventsAttended - a.eventsAttended;
          break;
      }
      return filters.sortOrder === 'asc' ? -comparison : comparison;
    });

    return result;
  }, [users, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    pending: users.filter(u => u.status === 'pending').length,
    banned: users.filter(u => u.status === 'banned').length,
    organizers: users.filter(u => u.role === 'organizer').length,
    admins: users.filter(u => u.role === 'admin').length
  }), [users]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'suspended': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'pending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'banned': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case 'organizer': return <ShieldCheck className="w-4 h-4 text-blue-500" />;
      default: return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(paginatedUsers.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    // In production, update Firestore
    setUsers(users.map(u => 
      u.id === userId ? { ...u, role: newRole as UserData['role'] } : u
    ));
    toast({
      title: 'Role Updated',
      description: `User role has been changed to ${newRole}.`
    });
  };

  const handleChangeStatus = async (userId: string, newStatus: string) => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, status: newStatus as UserData['status'] } : u
    ));
    toast({
      title: 'Status Updated',
      description: `User status has been changed to ${newStatus}.`
    });
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banReason) return;

    setUsers(users.map(u => 
      u.id === selectedUser.id ? { 
        ...u, 
        status: 'banned' as const, 
        isBanned: true, 
        banReason 
      } : u
    ));
    
    toast({
      title: 'User Banned',
      description: `${selectedUser.name} has been banned.`,
      variant: 'destructive'
    });
    
    setShowBanDialog(false);
    setBanReason('');
    setSelectedUser(null);
  };

  const handleUnbanUser = async (userId: string) => {
    setUsers(users.map(u => 
      u.id === userId ? { 
        ...u, 
        status: 'active' as const, 
        isBanned: false, 
        banReason: undefined 
      } : u
    ));
    
    toast({
      title: 'User Unbanned',
      description: 'User has been unbanned and can now access the platform.'
    });
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;

    switch (action) {
      case 'activate':
        setUsers(users.map(u => 
          selectedUsers.includes(u.id) ? { ...u, status: 'active' as const } : u
        ));
        toast({ title: 'Users Activated', description: `${selectedUsers.length} users have been activated.` });
        break;
      case 'suspend':
        setUsers(users.map(u => 
          selectedUsers.includes(u.id) ? { ...u, status: 'suspended' as const } : u
        ));
        toast({ title: 'Users Suspended', description: `${selectedUsers.length} users have been suspended.` });
        break;
      case 'delete':
        setUsers(users.filter(u => !selectedUsers.includes(u.id)));
        toast({ title: 'Users Deleted', description: `${selectedUsers.length} users have been deleted.`, variant: 'destructive' });
        break;
    }
    setSelectedUsers([]);
  };

  const exportUsers = () => {
    const csvRows = [];
    const headers = ['Name', 'Email', 'Role', 'Status', 'Department', 'Events Attended', 'Points', 'Created At'];
    csvRows.push(headers.join(','));

    for (const user of filteredUsers) {
      const values = [
        user.name,
        user.email,
        user.role,
        user.status,
        user.department || 'N/A',
        user.eventsAttended,
        user.points,
        user.createdAt.toISOString()
      ].map(v => `"${v}"`);
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'users_export.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast({ title: 'Export Complete', description: `${filteredUsers.length} users exported to CSV.` });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{stats.suspended}</p>
              <p className="text-xs text-muted-foreground">Suspended</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{stats.banned}</p>
              <p className="text-xs text-muted-foreground">Banned</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.organizers}</p>
              <p className="text-xs text-muted-foreground">Organizers</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{stats.admins}</p>
              <p className="text-xs text-muted-foreground">Admins</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters & Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="flex flex-1 flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <Select 
                value={filters.role} 
                onValueChange={(v) => setFilters({ ...filters, role: v })}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="organizer">Organizer</SelectItem>
                  <SelectItem value="attendee">Attendee</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={filters.status} 
                onValueChange={(v) => setFilters({ ...filters, status: v })}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={filters.sortBy} 
                onValueChange={(v) => setFilters({ ...filters, sortBy: v })}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Join Date</SelectItem>
                  <SelectItem value="lastActive">Last Active</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="points">Points</SelectItem>
                  <SelectItem value="eventsAttended">Events Attended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              {selectedUsers.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Bulk Actions ({selectedUsers.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkAction('activate')}>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                      Activate Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('suspend')}>
                      <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                      Suspend Selected
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleBulkAction('delete')}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button variant="outline" onClick={exportUsers}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="icon" onClick={loadUsers}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-center">Activity</TableHead>
                <TableHead className="text-center">Points</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.photoURL} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.name}</p>
                          {user.isVerified && (
                            <CheckCircle2 className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.role)}
                      <span className="capitalize">{user.role}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{user.department || 'N/A'}</p>
                      {user.year && (
                        <p className="text-xs text-muted-foreground">{user.year}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-medium">{user.eventsAttended}</span>
                      <span className="text-xs text-muted-foreground">events</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-medium">{user.points.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">XP</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(user.lastActive, { addSuffix: true })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => {
                          setSelectedUser(user);
                          setShowUserDialog(true);
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'attendee')}>
                          <Shield className="w-4 h-4 mr-2" />
                          Set as Attendee
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'organizer')}>
                          <ShieldCheck className="w-4 h-4 mr-2" />
                          Set as Organizer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'admin')}>
                          <ShieldAlert className="w-4 h-4 mr-2" />
                          Set as Admin
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleChangeStatus(user.id, 'active')}>
                          <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                          Activate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeStatus(user.id, 'suspended')}>
                          <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                          Suspend
                        </DropdownMenuItem>
                        {user.isBanned ? (
                          <DropdownMenuItem onClick={() => handleUnbanUser(user.id)}>
                            <UserCheck className="w-4 h-4 mr-2 text-green-500" />
                            Unban User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedUser(user);
                              setShowBanDialog(true);
                            }}
                            className="text-red-600"
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Ban User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* User Details Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedUser.photoURL} />
                  <AvatarFallback className="text-2xl">{selectedUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                    {selectedUser.isVerified && (
                      <CheckCircle2 className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getStatusColor(selectedUser.status)}>
                      {selectedUser.status}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {getRoleIcon(selectedUser.role)}
                      <span className="ml-1">{selectedUser.role}</span>
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <Calendar className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                  <p className="text-2xl font-bold">{selectedUser.eventsAttended}</p>
                  <p className="text-xs text-muted-foreground">Events Attended</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <Activity className="w-5 h-5 mx-auto mb-1 text-green-500" />
                  <p className="text-2xl font-bold">{selectedUser.eventsOrganized}</p>
                  <p className="text-xs text-muted-foreground">Events Organized</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <TrendingUp className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                  <p className="text-2xl font-bold">{selectedUser.points.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Points</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <Award className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                  <p className="text-2xl font-bold">{selectedUser.badges}</p>
                  <p className="text-xs text-muted-foreground">Badges</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Department</Label>
                  <p className="font-medium">{selectedUser.department || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Year</Label>
                  <p className="font-medium">{selectedUser.year || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Joined</Label>
                  <p className="font-medium">{selectedUser.createdAt.toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Active</Label>
                  <p className="font-medium">{formatDistanceToNow(selectedUser.lastActive, { addSuffix: true })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Connections</Label>
                  <p className="font-medium">{selectedUser.connections}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Verified</Label>
                  <p className="font-medium">{selectedUser.isVerified ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {selectedUser.isBanned && selectedUser.banReason && (
                <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-900">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300 mb-2">
                    <Ban className="w-5 h-5" />
                    <span className="font-semibold">Ban Reason</span>
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400">{selectedUser.banReason}</p>
                </div>
              )}

              {selectedUser.notes && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-900">
                  <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300 mb-2">
                    <MessageSquare className="w-5 h-5" />
                    <span className="font-semibold">Admin Notes</span>
                  </div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">{selectedUser.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              // Open edit mode or navigate to user profile
              setShowUserDialog(false);
            }}>
              <Edit className="w-4 h-4 mr-2" />
              Edit User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban {selectedUser?.name}? They will not be able to access the platform until unbanned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="banReason">Ban Reason (required)</Label>
            <Textarea
              id="banReason"
              placeholder="Enter the reason for banning this user..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setBanReason('');
              setSelectedUser(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanUser}
              disabled={!banReason}
              className="bg-red-600 hover:bg-red-700"
            >
              <Ban className="w-4 h-4 mr-2" />
              Ban User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
