'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Plus, Trash2, CheckCircle2, Circle, Loader2, Play, Pause } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/core/utils/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EventPollsProps {
  eventId: Id<"events">;
  isOrganizer: boolean;
}

export function EventPolls({ eventId, isOrganizer }: EventPollsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const polls = useQuery(api.polls.getByEvent, { eventId }) || [];
  
  const createPoll = useMutation(api.polls.create);
  const submitVote = useMutation(api.polls.submitResponse);
  const toggleActive = useMutation(api.polls.toggleActive);

  const [showCreate, setShowCreate] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);

  const handleAddOption = () => setNewOptions([...newOptions, '']);
  
  const handleCreate = async () => {
    if (!newQuestion.trim() || newOptions.some(o => !o.trim())) return;
    setLoading(true);
    try {
      await createPoll({
        eventId,
        question: newQuestion.trim(),
        options: newOptions.map(o => o.trim()),
      });
      setShowCreate(false);
      setNewQuestion('');
      setNewOptions(['', '']);
      toast({ title: "Poll published!" });
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Live Polling</h2>
          <p className="text-sm text-gray-500">Participate in real-time surveys.</p>
        </div>
        {isOrganizer && (
          <Button onClick={() => setShowCreate(true)} className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-full">
            <Plus className="w-4 h-4 mr-2" />
            New Poll
          </Button>
        )}
      </div>

      {showCreate && (
        <Card className="bg-white/5 border-cyan-500/30 text-white overflow-hidden animate-in slide-in-from-top-4">
          <CardHeader><CardTitle className="text-lg">Create a Poll</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Question</Label>
              <Input value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="What's your favorite track?" className="bg-white/5 border-white/10" />
            </div>
            <div className="space-y-3">
              <Label>Options</Label>
              {newOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={opt} onChange={e => {
                    const next = [...newOptions];
                    next[i] = e.target.value;
                    setNewOptions(next);
                  }} placeholder={`Option ${i+1}`} className="bg-white/5 border-white/10" />
                  {newOptions.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => setNewOptions(newOptions.filter((_, idx) => idx !== i))}><Trash2 className="w-4 h-4" /></Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={handleAddOption} className="w-full border-white/10 text-xs">Add another option</Button>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleCreate} disabled={loading || !newQuestion} className="flex-1 bg-cyan-600">Create</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {polls.length === 0 ? (
        <div className="py-32 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
          <BarChart3 size={48} className="mx-auto mb-4 text-gray-700 opacity-20" />
          <h3 className="text-lg font-bold text-gray-500">No active polls</h3>
          <p className="text-sm text-gray-600">Waiting for organizers to start a poll.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {polls.map((poll) => (
            <Card key={poll._id} className={cn(
              "bg-white/5 border-white/10 text-white transition-all",
              !poll.isActive && "opacity-60"
            )}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{poll.question}</CardTitle>
                  {isOrganizer && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleActive({ id: poll._id, isActive: !poll.isActive })}
                      className="text-xs h-8"
                    >
                      {poll.isActive ? <Pause size={14} className="mr-1" /> : <Play size={14} className="mr-1" />}
                      {poll.isActive ? "End Poll" : "Restart"}
                    </Button>
                  )}
                </div>
                <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-cyan-500/70">
                  {poll.totalVotes} total votes • {poll.isActive ? "Accepting votes" : "Poll ended"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {poll.options.map((opt: string, i: number) => {
                  const voteCount = poll.results[i] || 0;
                  const percent = poll.totalVotes > 0 ? Math.round((voteCount / poll.totalVotes) * 100) : 0;
                  const isVoted = poll.myVote === i;

                  return (
                    <div key={i} className="space-y-2">
                      <button
                        disabled={!poll.isActive || loading}
                        onClick={() => submitVote({ pollId: poll._id, optionIndex: i })}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-sm",
                          isVoted 
                            ? "bg-cyan-500/10 border-cyan-500/50 text-white" 
                            : "bg-white/5 border-white/5 hover:bg-white/[0.08]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {isVoted ? <CheckCircle2 size={16} className="text-cyan-400" /> : <Circle size={16} className="text-gray-600" />}
                          <span>{opt}</span>
                        </div>
                        <span className="font-bold">{percent}%</span>
                      </button>
                      <Progress value={percent} className="h-1 bg-white/5" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
