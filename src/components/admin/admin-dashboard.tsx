'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Download, Search, X } from 'lucide-react';
import type { User, UserRole } from '@/types';
import { Badge } from '@/components/ui/badge';

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
    const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter(user => user.role !== 'organizer')
        .filter(user => filterRole === 'all' || user.role === filterRole)
        .filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleExport = () => {
        downloadCSV(filteredUsers, 'ipx_hub_attendees.csv');
    };

    return (
        <div className="container py-8">
            <h1 className="text-4xl font-bold font-headline mb-4">Organizer Dashboard</h1>
            <p className="text-muted-foreground mb-8">Manage and view event participants.</p>

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
    );
}
