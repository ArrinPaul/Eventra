'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Zap, 
  Plus, 
  Play,
  Pause,
  Settings,
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Mail,
  MessageSquare,
  Calendar,
  Users,
  FileText,
  Database,
  Webhook,
  Filter,
  ArrowRight,
  MoreVertical,
  Eye,
  Edit3,
  Copy,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../../hooks/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'event_created' | 'registration' | 'check_in' | 'feedback' | 'webhook' | 'schedule';
    config: any;
  };
  actions: Array<{
    id: string;
    type: 'email' | 'slack' | 'discord' | 'webhook' | 'database' | 'notification';
    config: any;
    delay?: number;
  }>;
  isActive: boolean;
  createdBy: string;
  eventId?: string;
  lastRun?: Date;
  runCount: number;
  successCount: number;
  errorCount: number;
}

interface N8nAutomationProps {
  eventId?: string;
  eventTitle?: string;
  userRole: 'student' | 'professional' | 'organizer';
}

export default function N8nAutomation({ eventId, eventTitle, userRole }: N8nAutomationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<AutomationWorkflow | null>(null);
  
  // Create workflow state
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [triggerType, setTriggerType] = useState<AutomationWorkflow['trigger']['type']>('event_created');
  const [triggerConfig, setTriggerConfig] = useState<any>({});
  const [actions, setActions] = useState<AutomationWorkflow['actions']>([]);
  
  // Connection state
  const [n8nConnected, setN8nConnected] = useState(false);
  const [n8nUrl, setN8nUrl] = useState('');
  const [n8nApiKey, setN8nApiKey] = useState('');

  useEffect(() => {
    checkN8nConnection();
    if (n8nConnected) {
      loadWorkflows();
    }
  }, [n8nConnected]);

  const checkN8nConnection = async () => {
    try {
      const response = await fetch('/api/n8n/connection', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      
      const data = await response.json();
      if (data.connected) {
        setN8nConnected(true);
        setN8nUrl(data.url);
      }
    } catch (error) {
      console.error('Error checking n8n connection:', error);
    }
  };

  const connectN8n = async () => {
    if (!n8nUrl || !n8nApiKey) {
      toast({
        title: "Error",
        description: "Please provide n8n URL and API key.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/n8n/connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          url: n8nUrl,
          apiKey: n8nApiKey,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setN8nConnected(true);
        toast({
          title: "Connected",
          description: "Successfully connected to n8n instance.",
        });
      }
    } catch (error) {
      console.error('Error connecting to n8n:', error);
      toast({
        title: "Error",
        description: "Failed to connect to n8n instance.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/n8n/workflows', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      
      const data = await response.json();
      if (data.workflows) {
        setWorkflows(data.workflows);
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
      toast({
        title: "Error",
        description: "Failed to load workflows.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async () => {
    if (!workflowName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a workflow name.",
        variant: "destructive",
      });
      return;
    }

    if (actions.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one action.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/n8n/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          name: workflowName,
          description: workflowDescription,
          trigger: {
            type: triggerType,
            config: triggerConfig,
          },
          actions,
          eventId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Workflow Created",
          description: `${workflowName} has been created successfully.`,
        });
        setShowCreateDialog(false);
        resetCreateForm();
        loadWorkflows();
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast({
        title: "Error",
        description: "Failed to create workflow.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflow = async (workflow: AutomationWorkflow) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/n8n/workflows/${workflow.id}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          isActive: !workflow.isActive,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: workflow.isActive ? "Workflow Paused" : "Workflow Activated",
          description: `${workflow.name} has been ${workflow.isActive ? 'paused' : 'activated'}.`,
        });
        loadWorkflows();
      }
    } catch (error) {
      console.error('Error toggling workflow:', error);
      toast({
        title: "Error",
        description: "Failed to toggle workflow.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const executeWorkflow = async (workflow: AutomationWorkflow) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/n8n/workflows/${workflow.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Workflow Executed",
          description: `${workflow.name} has been executed successfully.`,
        });
        loadWorkflows();
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
      toast({
        title: "Error",
        description: "Failed to execute workflow.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkflow = async (workflow: AutomationWorkflow) => {
    if (!confirm(`Are you sure you want to delete ${workflow.name}?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/n8n/workflows/${workflow.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Workflow Deleted",
          description: `${workflow.name} has been deleted.`,
        });
        loadWorkflows();
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast({
        title: "Error",
        description: "Failed to delete workflow.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addAction = () => {
    const newAction = {
      id: `action_${Date.now()}`,
      type: 'email' as const,
      config: {},
      delay: 0,
    };
    setActions([...actions, newAction]);
  };

  const updateAction = (actionId: string, updates: Partial<AutomationWorkflow['actions'][0]>) => {
    setActions(actions.map(action => 
      action.id === actionId ? { ...action, ...updates } : action
    ));
  };

  const removeAction = (actionId: string) => {
    setActions(actions.filter(action => action.id !== actionId));
  };

  const resetCreateForm = () => {
    setWorkflowName('');
    setWorkflowDescription('');
    setTriggerType('event_created');
    setTriggerConfig({});
    setActions([]);
  };

  const getTriggerIcon = (type: AutomationWorkflow['trigger']['type']) => {
    switch (type) {
      case 'event_created': return <Calendar className="w-4 h-4" />;
      case 'registration': return <Users className="w-4 h-4" />;
      case 'check_in': return <CheckCircle className="w-4 h-4" />;
      case 'feedback': return <MessageSquare className="w-4 h-4" />;
      case 'webhook': return <Webhook className="w-4 h-4" />;
      case 'schedule': return <Clock className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getActionIcon = (type: AutomationWorkflow['actions'][0]['type']) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'slack': return <MessageSquare className="w-4 h-4" />;
      case 'discord': return <MessageSquare className="w-4 h-4" />;
      case 'webhook': return <Webhook className="w-4 h-4" />;
      case 'database': return <Database className="w-4 h-4" />;
      case 'notification': return <Bell className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getStatusColor = (workflow: AutomationWorkflow) => {
    if (!workflow.isActive) return 'bg-gray-500';
    const successRate = workflow.runCount > 0 ? workflow.successCount / workflow.runCount : 1;
    if (successRate > 0.9) return 'bg-green-500';
    if (successRate > 0.7) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!n8nConnected) {
    return (
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            n8n Automation Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-8">
              <Zap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Connect n8n Instance</h3>
              <p className="text-muted-foreground mb-6">
                Connect your n8n instance to enable powerful workflow automation
              </p>
            </div>
            
            <div className="max-w-md mx-auto space-y-4">
              <div>
                <Label htmlFor="n8n-url">n8n Instance URL</Label>
                <Input
                  id="n8n-url"
                  placeholder="https://your-n8n.example.com"
                  value={n8nUrl}
                  onChange={(e) => setN8nUrl(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="n8n-api-key">API Key</Label>
                <Input
                  id="n8n-api-key"
                  type="password"
                  placeholder="Your n8n API key"
                  value={n8nApiKey}
                  onChange={(e) => setN8nApiKey(e.target.value)}
                />
              </div>
              
              <Button onClick={connectN8n} disabled={loading} className="w-full">
                {loading ? 'Connecting...' : 'Connect n8n'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-effect">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              n8n Automation Integration
              {eventTitle && (
                <Badge variant="outline">
                  {eventTitle}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Connected</Badge>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Workflow
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="workflows" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="workflows">Workflows</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="workflows" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workflows.map((workflow) => (
                  <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(workflow)}`} />
                          <span className="font-medium text-sm truncate">{workflow.name}</span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setSelectedWorkflow(workflow)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => executeWorkflow(workflow)}>
                              <Play className="w-4 h-4 mr-2" />
                              Execute Now
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleWorkflow(workflow)}>
                              {workflow.isActive ? (
                                <>
                                  <Pause className="w-4 h-4 mr-2" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteWorkflow(workflow)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="space-y-3">
                        {workflow.description && (
                          <p className="text-sm text-muted-foreground">{workflow.description}</p>
                        )}
                        
                        <div className="flex items-center gap-2">
                          {getTriggerIcon(workflow.trigger.type)}
                          <Badge variant="secondary" className="text-xs">
                            {workflow.trigger.type.replace('_', ' ')}
                          </Badge>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {workflow.actions.length} actions
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Runs: {workflow.runCount}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">✓ {workflow.successCount}</span>
                            {workflow.errorCount > 0 && (
                              <span className="text-red-600">✗ {workflow.errorCount}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {workflows.length === 0 && (
                <div className="text-center py-12">
                  <Zap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first automation workflow
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Workflow
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="templates" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Mail className="w-8 h-8 text-blue-500" />
                      <div>
                        <h3 className="font-semibold">Welcome Email Sequence</h3>
                        <p className="text-sm text-muted-foreground">
                          Automated welcome emails for new registrations
                        </p>
                      </div>
                    </div>
                    <Button size="sm" className="w-full">
                      Use Template
                    </Button>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <MessageSquare className="w-8 h-8 text-green-500" />
                      <div>
                        <h3 className="font-semibold">Slack Notifications</h3>
                        <p className="text-sm text-muted-foreground">
                          Real-time event updates to Slack channels
                        </p>
                      </div>
                    </div>
                    <Button size="sm" className="w-full">
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Workflows</p>
                        <p className="text-2xl font-bold">{workflows.length}</p>
                      </div>
                      <Zap className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Runs</p>
                        <p className="text-2xl font-bold">
                          {workflows.reduce((sum, w) => sum + w.runCount, 0)}
                        </p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Success Rate</p>
                        <p className="text-2xl font-bold">
                          {workflows.length > 0 
                            ? Math.round(
                                workflows.reduce((sum, w) => sum + w.successCount, 0) / 
                                workflows.reduce((sum, w) => sum + w.runCount, 1) * 100
                              )
                            : 0}%
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Connection Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">n8n Instance</p>
                      <p className="text-sm text-muted-foreground">{n8nUrl}</p>
                    </div>
                    <Badge variant="secondary">Connected</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-retry failed workflows</p>
                      <p className="text-sm text-muted-foreground">
                        Automatically retry failed executions up to 3 times
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Workflow Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Automation Workflow</DialogTitle>
            <DialogDescription>
              Set up automated actions based on event triggers
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="workflow-name">Workflow Name</Label>
                <Input
                  id="workflow-name"
                  placeholder="My Automation Workflow"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="trigger-type">Trigger</Label>
                <Select value={triggerType} onValueChange={setTriggerType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event_created">Event Created</SelectItem>
                    <SelectItem value="registration">New Registration</SelectItem>
                    <SelectItem value="check_in">Check-in</SelectItem>
                    <SelectItem value="feedback">Feedback Received</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="schedule">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="workflow-description">Description</Label>
              <Textarea
                id="workflow-description"
                placeholder="Describe what this workflow does..."
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>Actions</Label>
                <Button type="button" variant="outline" size="sm" onClick={addAction}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Action
                </Button>
              </div>
              
              {actions.map((action, index) => (
                <Card key={action.id} className="p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Action {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAction(action.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Action Type</Label>
                      <Select 
                        value={action.type} 
                        onValueChange={(type) => updateAction(action.id, { type: type as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Send Email</SelectItem>
                          <SelectItem value="slack">Slack Message</SelectItem>
                          <SelectItem value="discord">Discord Message</SelectItem>
                          <SelectItem value="webhook">Webhook</SelectItem>
                          <SelectItem value="database">Database Update</SelectItem>
                          <SelectItem value="notification">Push Notification</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Delay (minutes)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={action.delay || 0}
                        onChange={(e) => updateAction(action.id, { delay: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            <Button onClick={createWorkflow} disabled={loading} className="w-full">
              {loading ? 'Creating...' : 'Create Workflow'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}