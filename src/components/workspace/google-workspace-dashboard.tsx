'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Table, 
  Calendar,
  Plus, 
  ExternalLink,
  Users,
  Clock,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  PenTool
} from 'lucide-react';

interface GoogleWorkspaceDashboardProps {
  className?: string;
}

const GoogleWorkspaceDashboard: React.FC<GoogleWorkspaceDashboardProps> = ({ className }) => {
  // Mock data for demonstration - in real app this would come from Firebase
  const recentDocuments = [
    {
      id: '1',
      title: 'Tech Summit 2024 - Planning Document',
      type: 'event_planning',
      lastModified: 'Yesterday',
      collaborators: 5
    },
    {
      id: '2',
      title: 'Innovation Workshop Agenda',
      type: 'agenda',
      lastModified: '2 days ago',
      collaborators: 3
    },
    {
      id: '3',
      title: 'Networking Session Feedback',
      type: 'feedback',
      lastModified: '1 week ago',
      collaborators: 8
    }
  ];

  const recentSpreadsheets = [
    {
      id: '1',
      title: 'Tech Summit 2024 - Registrations',
      type: 'registrations',
      lastModified: 'Today',
      collaborators: 4
    },
    {
      id: '2',
      title: 'Event Analytics Dashboard',
      type: 'analytics',
      lastModified: 'Yesterday',
      collaborators: 6
    }
  ];

  const stats = {
    totalDocuments: 12,
    totalSpreadsheets: 8,
    activeCollaborators: 15,
    documentsThisWeek: 5
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Google Workspace</h2>
          <p className="text-sm text-muted-foreground">Collaborative documents and spreadsheets</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Document
          </Button>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            New Sheet
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Documents</p>
                <p className="text-2xl font-bold">{stats.totalDocuments}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600 opacity-60" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Spreadsheets</p>
                <p className="text-2xl font-bold">{stats.totalSpreadsheets}</p>
              </div>
              <Table className="h-8 w-8 text-green-600 opacity-60" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Collaborators</p>
                <p className="text-2xl font-bold">{stats.activeCollaborators}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600 opacity-60" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{stats.documentsThisWeek}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600 opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Documents and Spreadsheets */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Recent Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{doc.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {doc.type.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {doc.lastModified}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {doc.collaborators}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" className="w-full" size="sm">
              View All Documents
            </Button>
          </CardContent>
        </Card>

        {/* Recent Spreadsheets */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Table className="h-5 w-5 text-green-600" />
              Recent Spreadsheets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSpreadsheets.map((sheet) => (
              <div key={sheet.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{sheet.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {sheet.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {sheet.lastModified}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {sheet.collaborators}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" className="w-full" size="sm">
              View All Spreadsheets
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="flex-col h-20 gap-2">
              <PenTool className="h-6 w-6 text-blue-600" />
              <span className="text-xs">Event Planning</span>
            </Button>
            <Button variant="outline" className="flex-col h-20 gap-2">
              <Calendar className="h-6 w-6 text-purple-600" />
              <span className="text-xs">Create Agenda</span>
            </Button>
            <Button variant="outline" className="flex-col h-20 gap-2">
              <FileSpreadsheet className="h-6 w-6 text-green-600" />
              <span className="text-xs">Registration Sheet</span>
            </Button>
            <Button variant="outline" className="flex-col h-20 gap-2">
              <BarChart3 className="h-6 w-6 text-orange-600" />
              <span className="text-xs">Analytics Dashboard</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleWorkspaceDashboard;