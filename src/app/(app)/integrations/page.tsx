'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Github, 
  Slack, 
  MessageSquare, 
  Mail, 
  Calendar as CalendarIcon, 
  ExternalLink,
  Bot,
  Zap,
  CheckCircle2
} from 'lucide-react';

const INTEGRATIONS = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get real-time notifications and event updates directly in your Slack channels.',
    icon: Slack,
    connected: true,
    category: 'Communication'
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync your registered events automatically with your Google Calendar.',
    icon: CalendarIcon,
    connected: false,
    category: 'Productivity'
  },
  {
    id: 'n8n',
    name: 'n8n Automation',
    description: 'Build complex event workflows and automate your management tasks.',
    icon: Bot,
    connected: true,
    category: 'Automation'
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Professional email delivery for confirmations and broadcast messages.',
    icon: Mail,
    connected: true,
    category: 'Communication'
  }
];

export default function IntegrationsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl text-white space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">Integrations</h1>
        <p className="text-gray-400 text-lg max-w-2xl">Connect Eventra with your favorite tools to automate workflows and enhance your event experience.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {INTEGRATIONS.map((integration) => (
          <Card key={integration.id} className="bg-white/5 border-white/10 overflow-hidden hover:border-cyan-500/30 transition-all group">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="bg-white/5 p-3 rounded-2xl group-hover:bg-cyan-500/10 transition-colors">
                <integration.icon className="h-8 w-8 text-cyan-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold">{integration.name}</CardTitle>
                  {integration.connected && (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-gray-500 font-medium">{integration.category}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-400 text-sm leading-relaxed">{integration.description}</p>
              <div className="flex gap-3">
                <Button className={integration.connected ? "bg-white/5 text-white hover:bg-white/10" : "bg-cyan-600 hover:bg-cyan-500"}>
                  {integration.connected ? 'Manage' : 'Connect Now'}
                </Button>
                <Button variant="ghost" className="text-gray-500 hover:text-white">
                  Learn More <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-purple-900/20 to-cyan-900/20 border-cyan-500/30">
        <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8 justify-between">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Custom Webhooks</h3>
            <p className="text-gray-400 max-w-xl">Build your own integrations by listening to platform events in real-time. Supports registration, check-in, and more.</p>
          </div>
          <Button variant="outline" className="border-white/10 whitespace-nowrap">
            <Zap className="h-4 w-4 mr-2 text-yellow-400" /> API Documentation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
