'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
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
  Database,
  Webhook,
  ArrowRight,
  MoreVertical,
  Eye,
  Bell,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '../../hooks/use-toast';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Id } from '../../../convex/_generated/dataModel';

interface N8nAutomationProps {
  eventId?: string;
  eventTitle?: string;
  userRole: 'student' | 'professional' | 'organizer';
}

export default function N8nAutomation({ eventId, eventTitle, userRole }: N8nAutomationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const workflows = useQuery(api.automations.get) || [];
  const createAutomation = useMutation(api.automations.create);
  const toggleAutomation = useMutation(api.automations.toggle);
  const deleteAutomation = useMutation(api.automations.deleteAutomation);

  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Create workflow state
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [triggerType, setTriggerType] = useState('registration');
  const [actions, setActions] = useState<any[]>([]);
  
  const [n8nConnected, setN8nConnected] = useState(true); // Default true for UI mockup

  const handleCreateWorkflow = async () => {
    if (!workflowName.trim()) return;
    setLoading(true);
    try {
      await createAutomation({
        name: workflowName,
        description: workflowDescription,
        triggerType,
        triggerConfig: {},
        actions: actions.map(a => ({ id: a.id, type: a.type, config: {} }))
      });
      toast({ title: "Workflow Created" });
      setShowCreateDialog(false);
      resetCreateForm();
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addAction = () => {
    setActions([...actions, { id: `action_${Date.now()}`, type: 'email', config: {}, delay: 0 }]);
  };

  const resetCreateForm = () => {
    setWorkflowName('');
    setWorkflowDescription('');
    setActions([]);
  };

  return (
    <div className="space-y-6 text-white pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Zap className="text-yellow-400" />
            Automation Hub
          </h1>
          <p className="text-gray-400 mt-1">Design powerful workflows to automate your event operations.</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-cyan-600 hover:bg-cyan-500">
          <Plus className="w-4 h-4 mr-2" />
          New Workflow
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((workflow) => (
          <Card key={workflow._id} className="bg-white/5 border-white/10 hover:border-cyan-500/30 transition-all group overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={workflow.isActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"}>
                  {workflow.isActive ? 'Active' : 'Paused'}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreVertical className="w-4 h-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-900 border-white/10 text-white">
                    <DropdownMenuItem onClick={() => toggleAutomation({ id: workflow._id, isActive: !workflow.isActive })}>
                      {workflow.isActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                      {workflow.isActive ? 'Pause' : 'Activate'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deleteAutomation({ id: workflow._id })} className="text-red-400">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardTitle className="text-lg mt-2">{workflow.name}</CardTitle>
              <CardDescription className="text-gray-500 line-clamp-1">{workflow.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                <span className="flex items-center gap-1"><Zap size={12} className="text-yellow-400" /> {workflow.triggerType}</span>
                <span className="flex items-center gap-1"><ArrowRight size={12} /> {workflow.actions.length} actions</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/5 p-2 rounded-lg">
                  <p className="text-[10px] text-gray-500 uppercase">Runs</p>
                  <p className="font-bold">{workflow.runCount}</p>
                </div>
                <div className="bg-white/5 p-2 rounded-lg">
                  <p className="text-[10px] text-gray-500 uppercase">Success</p>
                  <p className="font-bold text-green-400">{workflow.successCount}</p>
                </div>
                <div className="bg-white/5 p-2 rounded-lg">
                  <p className="text-[10px] text-gray-500 uppercase">Errors</p>
                  <p className="font-bold text-red-400">{workflow.errorCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {workflows.length === 0 && (
          <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
            <Zap size={48} className="mx-auto mb-4 text-gray-700" />
            <h3 className="text-xl font-bold mb-2">No active workflows</h3>
            <p className="text-gray-500 mb-6">Create your first automation to streamline your event management.</p>
            <Button onClick={() => setShowCreateDialog(true)} variant="outline" className="border-white/20">
              Get Started
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl bg-[#0f172a] text-white border-white/10">
          <DialogHeader>
            <DialogTitle>Create Workflow</DialogTitle>
            <DialogDescription className="text-gray-400">Define a trigger and actions for your automation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Workflow Name</Label>
                <Input value={workflowName} onChange={e => setWorkflowName(e.target.value)} placeholder="e.g. Welcome Email Sequence" className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label>Trigger Event</Label>
                <Select value={triggerType} onValueChange={setTriggerType}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 text-white border-white/10">
                    <SelectItem value="registration">New Registration</SelectItem>
                    <SelectItem value="check_in">Check-in Completed</SelectItem>
                    <SelectItem value="event_created">Event Published</SelectItem>
                    <SelectItem value="feedback">Feedback Received</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={workflowDescription} onChange={e => setWorkflowDescription(e.target.value)} placeholder="What does this workflow do?" className="bg-white/5 border-white/10 h-20" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-cyan-400">Actions</Label>
                <Button variant="outline" size="sm" onClick={addAction} className="h-7 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                  <Plus className="w-3 h-3 mr-1" /> Add Action
                </Button>
              </div>
              {actions.map((action, i) => (
                <div key={action.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-cyan-500/20 p-2 rounded-lg"><Mail size={16} className="text-cyan-400" /></div>
                    <div>
                      <p className="text-sm font-medium capitalize">{action.type}</p>
                      <p className="text-[10px] text-gray-500">Instant execution</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActions(actions.filter(a => a.id !== action.id))} className="text-gray-500 hover:text-red-400">
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <Button onClick={handleCreateWorkflow} className="w-full bg-cyan-600 hover:bg-cyan-500 mt-4" disabled={loading || !workflowName}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Automation'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
