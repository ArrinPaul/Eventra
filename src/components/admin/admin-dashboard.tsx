'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Download, Search, X, LayoutDashboard, Users, Settings, BarChart3, Flag, Loader2 } from 'lucide-react';
import type { User, UserRole } from '@/types';
import { Badge } from '@/components/ui/badge';
import UserManagement from './user-management';
import EventModeration from './event-moderation';
import SystemSettings from './system-settings';
import AdminAnalyticsOverview from './admin-analytics-overview';

function downloadCSV(data: any[], filename: string) {
    const csvRows = [];
    const headers = ['Name', 'Email', 'Role', 'Organization/College', 'Checked In'];
    csvRows.push(headers.join(','));

    for (const user of data) {
        const orgOrCollege = user.role === 'student' ? user.college : (user.role === 'professional' ? user.company : 'N/A');
        const values = [user.name || '', user.email || '', user.role || '', orgOrCollege || '', user.checkedIn ? 'Yes' : 'No'].map(v => `"${v}"`);
        csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


export default function AdminDashboardClient() {
    const { user: adminUser } = useAuth();
    const allUsersRaw = useQuery(api.users.list);
    
    const [activeTab, setActiveTab] = useState('dashboard');
    const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const loading = allUsersRaw === undefined;
    const users = (allUsersRaw || []).map((u: any) => ({ ...u, id: u._id }));

    const attendeeUsers = users.filter((user: any) => user.role !== 'organizer' && user.role !== 'admin');
    
    const filteredUsers = attendeeUsers
        .filter((user: any) => filterRole === 'all' || user.role === filterRole)
        .filter((user: any) => (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()));

    const handleExport = () => {
        downloadCSV(filteredUsers, 'eventra_attendees.csv');
    };

    if (adminUser?.role !== 'admin' && adminUser !== undefined) {
        return <div className="container py-20 text-center text-white">Unauthorized Access</div>;
    }

    return (
        <div className="container py-8 space-y-6 text-white">
            <div>
                <h1 className="text-4xl font-bold font-headline mb-2 text-white">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage platform settings, users, events, and analytics.</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
                    <TabsTrigger value="dashboard" className="gap-2"><LayoutDashboard className="w-4 h-4" /> Dashboard</TabsTrigger>
                    <TabsTrigger value="users" className="gap-2"><Users className="w-4 h-4" /> Users</TabsTrigger>
                    <TabsTrigger value="moderation" className="gap-2"><Flag className="w-4 h-4" /> Moderation</TabsTrigger>
                    <TabsTrigger value="analytics" className="gap-2"><BarChart3 className="w-4 h-4" /> Analytics</TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2"><Settings className="w-4 h-4" /> Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-8">
                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                    ) : (
                        <div className="grid grid-cols-1 gap-8">
                            <div>
                                <h2 className="text-2xl font-bold font-headline mb-4 text-white">Participants</h2>
                                <div className="flex flex-col md:flex-row gap-4 mb-6">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Search attendees..." className="pl-10 text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                    </div>
                                    <Button onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
                                </div>
                                
                                <div className="border rounded-lg overflow-hidden bg-white/5 border-white/10">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-white/10">
                                                <TableHead className="text-white">Name</TableHead>
                                                <TableHead className="text-white">Email</TableHead>
                                                <TableHead className="text-white">Role</TableHead>
                                                <TableHead className="text-center text-white">Checked In</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredUsers.length > 0 ? filteredUsers.map((user: any) => (
                                                <TableRow key={user.id} className="border-white/10">
                                                    <TableCell className="font-medium text-white">{user.name}</TableCell>
                                                    <TableCell className="text-gray-300">{user.email}</TableCell>
                                                    <TableCell><Badge className="capitalize">{user.role}</Badge></TableCell>
                                                    <TableCell className="text-center">
                                                        {user.checkedIn ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-red-500 mx-auto" />}
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow><TableCell colSpan={4} className="text-center h-24 text-gray-400">No participants found.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="users"><UserManagement /></TabsContent>
                <TabsContent value="moderation"><EventModeration /></TabsContent>
                <TabsContent value="analytics"><AdminAnalyticsOverview /></TabsContent>
                <TabsContent value="settings"><SystemSettings /></TabsContent>
            </Tabs>
        </div>
    );
}
