'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Save, RefreshCw, CheckCircle, XCircle, AlertTriangle,
  Link, Unlink, ExternalLink, Loader2, Shield, Key, Server,
  Mail, Calendar, MessageSquare, Webhook, Zap, Database,
  MoreVertical, Copy, Eye, EyeOff, Clock, Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// Types
interface IntegrationConfig {
  id: string;
  name: string;
  type: IntegrationType;
  description: string;
  icon: React.ElementType;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  enabled: boolean;
  lastSync?: Date;
  errorMessage?: string;
  credentials?: Record<string, string>;
  settings?: Record<string, unknown>;
  webhookUrl?: string;
  scopes?: string[];
}

type IntegrationType = 'google' | 'slack' | 'zoom' | 'n8n' | 'webhook' | 'email' | 'custom';

interface WebhookLog {
  id: string;
  timestamp: Date;
  event: string;
  status: 'success' | 'failed';
  responseCode?: number;
  payload?: object;
}

interface IntegrationSettingsProps {
  organizationId?: string;
  allowedIntegrations?: IntegrationType[];
}

// Default integration templates
const INTEGRATION_TEMPLATES: Partial<IntegrationConfig>[] = [
  {
    type: 'google',
    name: 'Google Workspace',
    description: 'Sync with Google Calendar, Meet, and Drive',
    icon: Calendar,
    scopes: ['calendar.readonly', 'calendar.events', 'drive.readonly']
  },
  {
    type: 'slack',
    name: 'Slack',
    description: 'Send notifications and updates to Slack channels',
    icon: MessageSquare,
    scopes: ['chat:write', 'channels:read', 'users:read']
  },
  {
    type: 'zoom',
    name: 'Zoom',
    description: 'Create and manage Zoom meetings automatically',
    icon: Calendar,
    scopes: ['meeting:write', 'user:read']
  },
  {
    type: 'n8n',
    name: 'n8n Automation',
    description: 'Connect with n8n workflows for advanced automation',
    icon: Zap,
    scopes: []
  },
  {
    type: 'webhook',
    name: 'Custom Webhook',
    description: 'Send events to any webhook endpoint',
    icon: Webhook,
    scopes: []
  },
  {
    type: 'email',
    name: 'Email Service',
    description: 'Configure SMTP or email API settings',
    icon: Mail,
    scopes: []
  }
];

// Helper function to convert Firestore Timestamp
const toDate = (timestamp: Timestamp | Date | undefined): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp);
};

export default function IntegrationSettingsClient({
  organizationId,
  allowedIntegrations
}: IntegrationSettingsProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [activeTab, setActiveTab] = useState('integrations');
  
  // Config form state
  const [configForm, setConfigForm] = useState<{
    enabled: boolean;
    credentials: Record<string, string>;
    settings: Record<string, unknown>;
    webhookUrl: string;
  }>({
    enabled: false,
    credentials: {},
    settings: {},
    webhookUrl: ''
  });

  const orgId = organizationId || user?.uid;

  // Load integrations from Firestore
  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const integrationsRef = collection(db, 'organization_integrations');
    const q = query(integrationsRef, where('organizationId', '==', orgId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const existingIntegrations: Record<string, IntegrationConfig> = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        existingIntegrations[data.type] = {
          id: doc.id,
          name: data.name,
          type: data.type,
          description: data.description || '',
          icon: getIconForType(data.type),
          status: data.status || 'disconnected',
          enabled: data.enabled || false,
          lastSync: data.lastSync ? toDate(data.lastSync) : undefined,
          errorMessage: data.errorMessage,
          credentials: data.credentials || {},
          settings: data.settings || {},
          webhookUrl: data.webhookUrl,
          scopes: data.scopes || []
        };
      });

      // Merge with templates
      const mergedIntegrations = INTEGRATION_TEMPLATES
        .filter(template => !allowedIntegrations || allowedIntegrations.includes(template.type!))
        .map(template => {
          const existing = existingIntegrations[template.type!];
          if (existing) {
            return {
              ...existing,
              icon: template.icon
            };
          }
          return {
            id: `new-${template.type}`,
            ...template,
            status: 'disconnected' as const,
            enabled: false
          } as IntegrationConfig;
        });

      setIntegrations(mergedIntegrations);
      setLoading(false);
    }, (error) => {
      console.error('Error loading integrations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load integration settings',
        variant: 'destructive'
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orgId, allowedIntegrations, toast]);

  // Load webhook logs
  useEffect(() => {
    if (!orgId) return;

    const logsRef = collection(db, 'webhook_logs');
    const q = query(
      logsRef,
      where('organizationId', '==', orgId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs: WebhookLog[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        logs.push({
          id: doc.id,
          timestamp: toDate(data.timestamp),
          event: data.event,
          status: data.status,
          responseCode: data.responseCode,
          payload: data.payload
        });
      });
      logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setWebhookLogs(logs.slice(0, 50)); // Keep last 50 logs
    });

    return () => unsubscribe();
  }, [orgId]);

  // Get icon component for integration type
  function getIconForType(type: IntegrationType): React.ElementType {
    const template = INTEGRATION_TEMPLATES.find(t => t.type === type);
    return template?.icon || Settings;
  }

  // Handle configuration dialog open
  const handleConfigureIntegration = (integration: IntegrationConfig) => {
    setSelectedIntegration(integration);
    setConfigForm({
      enabled: integration.enabled,
      credentials: { ...integration.credentials } || {},
      settings: { ...integration.settings } || {},
      webhookUrl: integration.webhookUrl || ''
    });
    setShowConfigDialog(true);
  };

  // Save integration configuration
  const handleSaveConfiguration = async () => {
    if (!selectedIntegration || !orgId) return;

    setSaving(true);
    try {
      const integrationData = {
        organizationId: orgId,
        name: selectedIntegration.name,
        type: selectedIntegration.type,
        description: selectedIntegration.description,
        enabled: configForm.enabled,
        credentials: configForm.credentials,
        settings: configForm.settings,
        webhookUrl: configForm.webhookUrl,
        scopes: selectedIntegration.scopes,
        status: configForm.enabled ? 'pending' : 'disconnected',
        updatedAt: serverTimestamp()
      };

      if (selectedIntegration.id.startsWith('new-')) {
        // Create new integration
        const docRef = doc(collection(db, 'organization_integrations'));
        await setDoc(docRef, {
          ...integrationData,
          createdAt: serverTimestamp()
        });
      } else {
        // Update existing
        await updateDoc(doc(db, 'organization_integrations', selectedIntegration.id), integrationData);
      }

      toast({
        title: 'Saved',
        description: 'Integration settings saved successfully'
      });
      setShowConfigDialog(false);
    } catch (error) {
      console.error('Error saving integration:', error);
      toast({
        title: 'Error',
        description: 'Failed to save integration settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Test integration connection
  const handleTestConnection = async (integration: IntegrationConfig) => {
    if (!orgId) return;

    try {
      // Update status to pending
      if (!integration.id.startsWith('new-')) {
        await updateDoc(doc(db, 'organization_integrations', integration.id), {
          status: 'pending',
          lastSync: serverTimestamp()
        });
      }

      // Simulate connection test (in production, this would call the actual API)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // For demo, randomly succeed or fail
      const success = Math.random() > 0.3;

      if (!integration.id.startsWith('new-')) {
        await updateDoc(doc(db, 'organization_integrations', integration.id), {
          status: success ? 'connected' : 'error',
          errorMessage: success ? null : 'Connection failed. Please check credentials.',
          lastSync: serverTimestamp()
        });
      }

      toast({
        title: success ? 'Connection Successful' : 'Connection Failed',
        description: success 
          ? `${integration.name} is now connected`
          : 'Please check your credentials and try again',
        variant: success ? 'default' : 'destructive'
      });
    } catch (error) {
      console.error('Error testing connection:', error);
      toast({
        title: 'Error',
        description: 'Failed to test connection',
        variant: 'destructive'
      });
    }
  };

  // Disconnect integration
  const handleDisconnect = async (integration: IntegrationConfig) => {
    if (!orgId || integration.id.startsWith('new-')) return;

    try {
      await updateDoc(doc(db, 'organization_integrations', integration.id), {
        status: 'disconnected',
        enabled: false,
        credentials: {},
        lastSync: serverTimestamp()
      });

      toast({
        title: 'Disconnected',
        description: `${integration.name} has been disconnected`
      });
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect integration',
        variant: 'destructive'
      });
    }
  };

  // Sync integration
  const handleSync = async (integration: IntegrationConfig) => {
    if (!orgId || integration.id.startsWith('new-')) return;

    try {
      await updateDoc(doc(db, 'organization_integrations', integration.id), {
        status: 'pending',
        lastSync: serverTimestamp()
      });

      // Simulate sync
      await new Promise(resolve => setTimeout(resolve, 2000));

      await updateDoc(doc(db, 'organization_integrations', integration.id), {
        status: 'connected',
        lastSync: serverTimestamp()
      });

      toast({
        title: 'Synced',
        description: `${integration.name} has been synced successfully`
      });
    } catch (error) {
      console.error('Error syncing:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync integration',
        variant: 'destructive'
      });
    }
  };

  // Copy webhook URL
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Copied to clipboard'
    });
  };

  // Render status badge
  const renderStatusBadge = (status: IntegrationConfig['status']) => {
    const config = {
      connected: { label: 'Connected', variant: 'default' as const, className: 'bg-green-500' },
      disconnected: { label: 'Disconnected', variant: 'secondary' as const, className: '' },
      error: { label: 'Error', variant: 'destructive' as const, className: '' },
      pending: { label: 'Pending', variant: 'outline' as const, className: '' }
    };

    const statusConfig = config[status];
    return (
      <Badge variant={statusConfig.variant} className={statusConfig.className}>
        {status === 'pending' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
        {status === 'connected' && <CheckCircle className="h-3 w-3 mr-1" />}
        {status === 'error' && <XCircle className="h-3 w-3 mr-1" />}
        {statusConfig.label}
      </Badge>
    );
  };

  // Render integration card
  const renderIntegrationCard = (integration: IntegrationConfig) => {
    const Icon = integration.icon;

    return (
      <motion.div
        key={integration.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group"
      >
        <Card className={cn(
          "hover:shadow-md transition-all",
          integration.status === 'connected' && "border-green-500/50",
          integration.status === 'error' && "border-red-500/50"
        )}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  integration.status === 'connected' ? "bg-green-100 text-green-600" : "bg-muted"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{integration.name}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {integration.description}
                  </CardDescription>
                </div>
              </div>
              {renderStatusBadge(integration.status)}
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            {integration.errorMessage && (
              <Alert variant="destructive" className="mb-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {integration.errorMessage}
                </AlertDescription>
              </Alert>
            )}
            
            {integration.lastSync && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Last synced: {integration.lastSync.toLocaleString()}
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0">
            <div className="flex items-center gap-2 w-full">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleConfigureIntegration(integration)}
              >
                <Settings className="h-4 w-4 mr-1" />
                Configure
              </Button>
              
              {integration.status === 'connected' && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSync(integration)}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDisconnect(integration)}
                        >
                          <Unlink className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Disconnect</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
              
              {integration.status === 'disconnected' && integration.credentials && Object.keys(integration.credentials).length > 0 && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleTestConnection(integration)}
                >
                  <Link className="h-4 w-4 mr-1" />
                  Connect
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    );
  };

  // Render configuration form based on integration type
  const renderConfigurationForm = () => {
    if (!selectedIntegration) return null;

    const commonFields = (
      <>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Integration</Label>
            <p className="text-xs text-muted-foreground">
              Turn on to activate this integration
            </p>
          </div>
          <Switch
            checked={configForm.enabled}
            onCheckedChange={(checked) => 
              setConfigForm(prev => ({ ...prev, enabled: checked }))
            }
          />
        </div>
        <Separator />
      </>
    );

    switch (selectedIntegration.type) {
      case 'google':
        return (
          <div className="space-y-4">
            {commonFields}
            <div className="space-y-2">
              <Label>Client ID</Label>
              <Input
                type={showCredentials['clientId'] ? 'text' : 'password'}
                value={configForm.credentials['clientId'] || ''}
                onChange={(e) => setConfigForm(prev => ({
                  ...prev,
                  credentials: { ...prev.credentials, clientId: e.target.value }
                }))}
                placeholder="Enter Google Client ID"
              />
            </div>
            <div className="space-y-2">
              <Label>Client Secret</Label>
              <div className="relative">
                <Input
                  type={showCredentials['clientSecret'] ? 'text' : 'password'}
                  value={configForm.credentials['clientSecret'] || ''}
                  onChange={(e) => setConfigForm(prev => ({
                    ...prev,
                    credentials: { ...prev.credentials, clientSecret: e.target.value }
                  }))}
                  placeholder="Enter Google Client Secret"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowCredentials(prev => ({
                    ...prev,
                    clientSecret: !prev.clientSecret
                  }))}
                >
                  {showCredentials['clientSecret'] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Scopes</Label>
              <div className="flex flex-wrap gap-2">
                {selectedIntegration.scopes?.map(scope => (
                  <Badge key={scope} variant="outline">{scope}</Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 'slack':
        return (
          <div className="space-y-4">
            {commonFields}
            <div className="space-y-2">
              <Label>Bot Token</Label>
              <div className="relative">
                <Input
                  type={showCredentials['botToken'] ? 'text' : 'password'}
                  value={configForm.credentials['botToken'] || ''}
                  onChange={(e) => setConfigForm(prev => ({
                    ...prev,
                    credentials: { ...prev.credentials, botToken: e.target.value }
                  }))}
                  placeholder="xoxb-..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowCredentials(prev => ({
                    ...prev,
                    botToken: !prev.botToken
                  }))}
                >
                  {showCredentials['botToken'] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Default Channel</Label>
              <Input
                value={(configForm.settings['defaultChannel'] as string) || ''}
                onChange={(e) => setConfigForm(prev => ({
                  ...prev,
                  settings: { ...prev.settings, defaultChannel: e.target.value }
                }))}
                placeholder="#general"
              />
            </div>
          </div>
        );

      case 'webhook':
        return (
          <div className="space-y-4">
            {commonFields}
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input
                type="url"
                value={configForm.webhookUrl}
                onChange={(e) => setConfigForm(prev => ({
                  ...prev,
                  webhookUrl: e.target.value
                }))}
                placeholder="https://your-endpoint.com/webhook"
              />
            </div>
            <div className="space-y-2">
              <Label>Secret Key (Optional)</Label>
              <div className="relative">
                <Input
                  type={showCredentials['secretKey'] ? 'text' : 'password'}
                  value={configForm.credentials['secretKey'] || ''}
                  onChange={(e) => setConfigForm(prev => ({
                    ...prev,
                    credentials: { ...prev.credentials, secretKey: e.target.value }
                  }))}
                  placeholder="Webhook signing secret"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowCredentials(prev => ({
                    ...prev,
                    secretKey: !prev.secretKey
                  }))}
                >
                  {showCredentials['secretKey'] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Events to Send</Label>
              <div className="flex flex-wrap gap-2">
                {['event.created', 'event.updated', 'registration.new', 'check-in'].map(event => (
                  <Badge
                    key={event}
                    variant={(configForm.settings['events'] as string[] || []).includes(event) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const events = (configForm.settings['events'] as string[]) || [];
                      const newEvents = events.includes(event)
                        ? events.filter(e => e !== event)
                        : [...events, event];
                      setConfigForm(prev => ({
                        ...prev,
                        settings: { ...prev.settings, events: newEvents }
                      }));
                    }}
                  >
                    {event}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 'n8n':
        return (
          <div className="space-y-4">
            {commonFields}
            <div className="space-y-2">
              <Label>n8n Instance URL</Label>
              <Input
                type="url"
                value={configForm.credentials['instanceUrl'] || ''}
                onChange={(e) => setConfigForm(prev => ({
                  ...prev,
                  credentials: { ...prev.credentials, instanceUrl: e.target.value }
                }))}
                placeholder="https://your-n8n-instance.com"
              />
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="relative">
                <Input
                  type={showCredentials['apiKey'] ? 'text' : 'password'}
                  value={configForm.credentials['apiKey'] || ''}
                  onChange={(e) => setConfigForm(prev => ({
                    ...prev,
                    credentials: { ...prev.credentials, apiKey: e.target.value }
                  }))}
                  placeholder="n8n API key"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowCredentials(prev => ({
                    ...prev,
                    apiKey: !prev.apiKey
                  }))}
                >
                  {showCredentials['apiKey'] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertTitle>Incoming Webhook URL</AlertTitle>
              <AlertDescription className="mt-2">
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs bg-muted p-1 rounded flex-1 overflow-x-auto">
                    {`${window.location.origin}/api/webhooks/n8n/${orgId}`}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(`${window.location.origin}/api/webhooks/n8n/${orgId}`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            {commonFields}
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="relative">
                <Input
                  type={showCredentials['apiKey'] ? 'text' : 'password'}
                  value={configForm.credentials['apiKey'] || ''}
                  onChange={(e) => setConfigForm(prev => ({
                    ...prev,
                    credentials: { ...prev.credentials, apiKey: e.target.value }
                  }))}
                  placeholder="Enter API key"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowCredentials(prev => ({
                    ...prev,
                    apiKey: !prev.apiKey
                  }))}
                >
                  {showCredentials['apiKey'] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integration Settings</h2>
          <p className="text-muted-foreground">
            Manage your connected services and automation tools
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="integrations">
            <Link className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Webhook className="h-4 w-4 mr-2" />
            Webhook Logs
          </TabsTrigger>
          <TabsTrigger value="api">
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {integrations.map(integration => renderIntegrationCard(integration))}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Webhook Activity</CardTitle>
              <CardDescription>
                Last 50 webhook events sent from this organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {webhookLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No webhook activity yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {webhookLogs.map(log => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          {log.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{log.event}</p>
                            <p className="text-xs text-muted-foreground">
                              {log.timestamp.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {log.responseCode && (
                            <Badge variant={log.responseCode < 400 ? 'default' : 'destructive'}>
                              {log.responseCode}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage API keys for external access to your data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Your API Endpoint</AlertTitle>
                <AlertDescription className="mt-2">
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted p-2 rounded flex-1">
                      {`${window.location.origin}/api/v1/organizations/${orgId}`}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(`${window.location.origin}/api/v1/organizations/${orgId}`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Primary API Key</p>
                    <p className="text-sm text-muted-foreground">
                      Full access to all endpoints
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Generate Key
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Read-Only API Key</p>
                    <p className="text-sm text-muted-foreground">
                      Limited to GET requests only
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Generate Key
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedIntegration && (
                <>
                  {React.createElement(selectedIntegration.icon, { className: 'h-5 w-5' })}
                  {selectedIntegration.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Configure your {selectedIntegration?.name} integration settings
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="pr-4">
              {renderConfigurationForm()}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancel
            </Button>
            {selectedIntegration && configForm.enabled && !selectedIntegration.id.startsWith('new-') && (
              <Button variant="outline" onClick={() => handleTestConnection(selectedIntegration)}>
                Test Connection
              </Button>
            )}
            <Button onClick={handleSaveConfiguration} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
