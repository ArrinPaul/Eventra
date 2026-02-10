'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { getAISchedulingRecommendations } from '@/app/actions/event-planning';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface SmartSchedulerAssistantProps {
  eventData: {
    title: string;
    description: string;
    category: string;
    targetAudience?: string;
  };
}

export function SmartSchedulerAssistant({ eventData }: SmartSchedulerAssistantProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[] | null>(null);
  const [strategy, setStrategy] = useState<string | null>(null);

  const handleGetRecommendations = async () => {
    if (!eventData.title || !eventData.description) {
      toast({ title: "More info needed", description: "Please enter a title and description first." });
      return;
    }

    setLoading(true);
    try {
      const result = await getAISchedulingRecommendations(eventData);
      if (result.success) {
        setRecommendations(result.recommendations);
        setStrategy(result.strategy);
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Failed to get AI help", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!recommendations ? (
        <Button 
          variant="outline" 
          className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          onClick={handleGetRecommendations}
          disabled={loading}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          AI Suggest Optimal Time
        </Button>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-xl">
            <p className="text-xs text-cyan-200 font-medium mb-2 flex items-center gap-2">
              <Sparkles className="h-3 w-3" /> AI Strategy
            </p>
            <p className="text-xs text-gray-300 italic">{strategy}</p>
          </div>

          <div className="grid gap-3">
            {recommendations.map((rec, i) => (
              <Card key={i} className="bg-white/5 border-white/10 overflow-hidden hover:border-cyan-500/30 transition-all cursor-default">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-cyan-400" />
                      <span className="font-bold text-sm text-white">{rec.dayOfWeek}</span>
                    </div>
                    <Badge className="bg-cyan-500/20 text-cyan-300 text-[10px]">{rec.score}% Fit</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{rec.timeSlot}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{rec.reasoning}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs text-gray-500 hover:text-white"
            onClick={() => setRecommendations(null)}
          >
            Refresh Suggestions
          </Button>
        </div>
      )}
    </div>
  );
}
