'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Download, Search, X, LayoutDashboard, Users, Calendar, Settings, BarChart3, Flag } from 'lucide-react';
import type { User, UserRole } from '@/types';
import { Badge } from '@/components/ui/badge';
import AnalyticsCharts from './analytics-charts';
import BroadcastForm from './broadcast-form';
import UserManagement from './user-management';
import EventModeration from './event-moderation';
import SystemSettings from './system-settings';
import AdminAnalyticsOverview from './admin-analytics-overview';

function downloadCSV(data: User[], filename: string) {
    const csvRows = [];
    const headers = ['Name', 'Email', 'Role', 'Organization/College', 'Checked In'];
    csvRows.push(headers.join(','));

    for (const user of data) {
        const orgOrCollege = user.role === 'student' ? user.college : (user.role === 'professional' ? user.company : 'N/A');
        const values = [user.name, user.email, user.role, orgOrCollege, user.checkedIn ? 'Yes' : 'No'].map(v => `"${v}"`);
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
    const { users } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const attendeeUsers = users.filter(user => user.role !== 'organizer');
    
    const filteredUsers = attendeeUsers
        .filter(user => filterRole === 'all' || user.role === filterRole)
        .filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleExport = () => {
        downloadCSV(filteredUsers, 'ipx_hub_attendees.csv');
    };

    return (
        <div className="container py-8 space-y-6">
            <div>
                <h1 className="text-4xl font-bold font-headline mb-2">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage platform settings, users, events, and analytics.</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
                    <TabsTrigger value="dashboard" className="gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="users" className="gap-2">
                        <Users className="w-4 h-4" />
                        Users
                    </TabsTrigger>
                    <TabsTrigger value="moderation" className="gap-2">
                        <Flag className="w-4 h-4" />
                        Moderation
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Analytics
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                    </TabsTrigger>
                </TabsList>

                {/* Dashboard Tab - Original Content */}
                <TabsContent value="dashboard" className="space-y-8">
                    <AnalyticsCharts allUsers={users} />
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold font-headline mb-4">Participants</h2>
                                <div className="flex flex-col md:flex-row gap-4 mb-6">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            placeholder="Search by name or email..." 
                                            className="pl-10"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <Select onValueChange={(value) => setFilterRole(value as UserRole | 'all')} defaultValue="all">
                                        <SelectTrigger className="w-full md:w-[180px]">
                                            <SelectValue placeholder="Filter by role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Roles</SelectItem>
                                            <SelectItem value="student">Student</SelectItem>
                                            <SelectItem value="professional">Professional</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={handleExport}>
                                        <Download className="mr-2 h-4 w-4" /> Export CSV
                                    </Button>
                                </div>
                                
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Organization/College</TableHead>
                                                <TableHead className="text-center">Checked In</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredUsers.length > 0 ? filteredUsers.map(user => (
                                                <TableRow key={user.id}>
                                                    <TableCell className="font-medium">{user.name}</TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={user.role === 'student' ? 'default' : 'secondary'} className="capitalize">{user.role}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {user.role === 'student' ? user.college : (user.role === 'professional' ? user.company : 'N/A')}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {user.checkedIn ? 
                                                            <Check className="h-5 w-5 text-green-500 mx-auto" /> : 
                                                            <X className="h-5 w-5 text-red-500 mx-auto" />
                                                        }
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center h-24">No participants found.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <BroadcastForm recipients={attendeeUsers} />
                        </div>
                    </div>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users">
                    <UserManagement />
                </TabsContent>

                {/* Moderation Tab */}
                <TabsContent value="moderation">
                    <EventModeration />
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics">
                    <AdminAnalyticsOverview />
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings">
                    <SystemSettings />
                </TabsContent>
            </Tabs>
        </div>
    );
}
