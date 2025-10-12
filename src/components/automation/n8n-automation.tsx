/**
 * N8N Automation Component
 * Placeholder for workflow automation and integration
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Workflow, Zap, Settings, Play } from 'lucide-react';

export default function N8nAutomation() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Automation</h2>
          <p className="text-muted-foreground">
            Automate your event management workflows with n8n integration
          </p>
        </div>
        <Badge variant="secondary">Beta</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Workflow className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-lg">Workflow Builder</CardTitle>
            </div>
            <CardDescription>
              Create custom automation workflows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Build powerful automation workflows to streamline your event management processes.
            </p>
            <Button variant="outline" className="w-full" disabled>
              Create Workflow
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <CardTitle className="text-lg">Triggers & Actions</CardTitle>
            </div>
            <CardDescription>
              Set up automated triggers and actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure automatic responses to events, registrations, and other activities.
            </p>
            <Button variant="outline" className="w-full" disabled>
              Configure Triggers
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-gray-500" />
              <CardTitle className="text-lg">Integration Settings</CardTitle>
            </div>
            <CardDescription>
              Manage your n8n connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure connections to external services and manage your automation settings.
            </p>
            <Button variant="outline" className="w-full" disabled>
              Manage Integrations
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Play className="w-5 h-5 text-green-500" />
              <CardTitle className="text-lg">Active Workflows</CardTitle>
            </div>
            <CardDescription>
              Monitor running automations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View and manage your currently active automation workflows.
            </p>
            <Button variant="outline" className="w-full" disabled>
              View Workflows
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Automation Templates</CardTitle>
          <CardDescription>
            Pre-built workflows for common event management tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Event Registration Workflow</h4>
              <p className="text-sm text-muted-foreground">Automatically send welcome emails and create calendar entries for new registrations.</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Payment Processing Workflow</h4>
              <p className="text-sm text-muted-foreground">Handle payment confirmations and update registration status automatically.</p>
            </div>
          </div>
          <div className="text-center py-4">
            <Button variant="outline" disabled>
              Browse All Templates
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}