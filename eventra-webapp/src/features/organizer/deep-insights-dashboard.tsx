'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Wand2, 
  TrendingUp, 
  CheckSquare, 
  Share2, 
  MessageSquare,
  BarChart3,
  Calendar,
  Users,
  AlertCircle,
  Loader2,
  ChevronRight,
  Download,
  BrainCircuit,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getPredictiveAttendance, generateSocialMediaPosts, getFeedbackSentiment } from '@/app/actions/event-insights';
import { generateOrganizerTaskList } from '@/app/actions/event-planning';
import { cn } from '@/core/utils/utils';

interface DeepInsightsProps {
  eventId: string;
  eventTitle: string;
}

export function DeepInsightsDashboard({ eventId, eventTitle }: DeepInsightsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState<any>(null);
  const [tasks, setTasks] = useState<string[]>([]);
  const [posts, setPosts] = useState<string[]>([]);
  const [sentiment, setSentiment] = useState<any>(null);
  
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [isGeneratingPosts, setIsGeneratingPosts] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        const [predData, sentimentData] = await Promise.all([
          getPredictiveAttendance(eventId),
          getFeedbackSentiment(eventId)
        ]);
        setPrediction(predData);
        setSentiment(sentimentData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [eventId]);

  const handleGenerateTasks = async () => {
    setIsGeneratingTasks(true);
    try {
      const data = await generateOrganizerTaskList(eventId);
      setTasks(data);
      toast({ title: "Tasks Generated", description: "AI has created a custom to-do list for your event." });
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  const handleGeneratePosts = async () => {
    setIsGeneratingPosts(true);
    try {
      const data = await generateSocialMediaPosts(eventId);
      setPosts(data);
      toast({ title: "Social Posts Ready", description: "Your marketing content has been drafted." });
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsGeneratingPosts(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <BrainCircuit className="h-12 w-12 animate-pulse mx-auto text-cyan-500" />
        <p className="text-gray-400 font-medium">AI is analyzing your event data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Predictive Attendance */}
        <Card className="lg:col-span-2 bg-white/5 border-white/10 text-white overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={20} className="text-cyan-400" />
                Attendance Prediction
              </CardTitle>
              <CardDescription>AI-driven estimation based on current registration trends</CardDescription>
            </div>
            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
              {prediction?.confidenceScore || 85}% Confidence
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-center md:text-left space-y-2">
                <p className="text-sm text-gray-500 uppercase font-black tracking-widest">Predicted Final Count</p>
                <div className="flex items-baseline justify-center md:justify-start gap-2">
                  <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    {prediction?.predictedTotal || 0}
                  </span>
                  <span className="text-gray-500 font-bold">Attendees</span>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Key Growth Factors</p>
                <ul className="space-y-2">
                  {(prediction?.factors || ['Viral social sharing', 'Strong early-bird performance', 'Niche category demand']).map((f: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <Sparkles size={14} className="text-amber-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Analysis */}
        <Card className="bg-white/5 border-white/10 text-white relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare size={20} className="text-purple-400" />
              Sentiment Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-4">
              <div className={cn(
                "w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 border-4",
                sentiment?.overallSentiment === 'positive' ? "border-emerald-500/50 bg-emerald-500/10" : "border-amber-500/50 bg-amber-500/10"
              )}>
                 <span className="text-2xl font-black uppercase">{sentiment?.overallSentiment || 'Positive'}</span>
              </div>
              <p className="text-xs text-gray-400">Based on recent feedback comments</p>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Trending Themes</p>
              <div className="flex flex-wrap gap-2">
                {(sentiment?.keyThemes || ['Great Speakers', 'Logistics', 'Networking']).map((t: string) => (
                  <Badge key={t} variant="secondary" className="bg-white/5 border-white/5 text-[10px]">{t}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Task List */}
        <Card className="bg-white/5 border-white/10 text-white overflow-hidden flex flex-col">
          <CardHeader className="border-b border-white/5 bg-white/5">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckSquare size={20} className="text-emerald-400" />
                AI Strategy Checklist
              </CardTitle>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 text-cyan-400 hover:bg-cyan-500/10"
                onClick={handleGenerateTasks}
                disabled={isGeneratingTasks}
              >
                {isGeneratingTasks ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 size={16} />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {tasks.length > 0 ? (
              <div className="divide-y divide-white/5">
                {tasks.map((task, i) => (
                  <div key={i} className="p-4 flex items-start gap-3 hover:bg-white/5 transition-colors group">
                    <div className="mt-1 w-4 h-4 rounded border border-gray-600 group-hover:border-cyan-500 transition-colors" />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{task}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center space-y-4">
                <AlertCircle className="h-10 w-10 mx-auto text-gray-600" />
                <p className="text-sm text-gray-500">Generate a custom AI-powered checklist to ensure event success.</p>
                <Button variant="outline" size="sm" onClick={handleGenerateTasks} disabled={isGeneratingTasks} className="border-white/10">
                  {isGeneratingTasks ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-cyan-400" />}
                  Generate List
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Marketing AI */}
        <Card className="lg:col-span-2 bg-white/5 border-white/10 text-white flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Share2 size={20} className="text-blue-400" />
                Social Media Copilot
              </CardTitle>
              <CardDescription>Viral post drafts for your event channels</CardDescription>
            </div>
            <Button size="sm" variant="outline" className="border-white/10" onClick={handleGeneratePosts} disabled={isGeneratingPosts}>
              {isGeneratingPosts ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Draft New Posts
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.length > 0 ? (
              posts.map((post, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 relative group">
                  <p className="text-xs text-gray-300 whitespace-pre-wrap line-clamp-6 italic">"{post}"</p>
                  <Button size="icon" variant="ghost" className="absolute bottom-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Download size={14} className="text-cyan-400" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="col-span-2 py-12 text-center border border-dashed border-white/5 rounded-xl">
                 <p className="text-gray-500 text-sm">Draft optimized posts for LinkedIn, Twitter, and Instagram.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
