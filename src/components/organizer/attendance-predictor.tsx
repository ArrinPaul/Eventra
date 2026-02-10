'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, Sparkles, TrendingUp, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { getPredictiveAttendance } from '@/app/actions/event-insights';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/core/utils/utils';

export function AttendancePredictor({ eventId }: { eventId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const result = await getPredictiveAttendance(eventId);
      if (result.success) {
        setPrediction(result);
        toast({ title: 'Attendance prediction ready! 📈' });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: 'Prediction failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white/5 border-white/10 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          Predictive Attendance
        </CardTitle>
        <CardDescription className="text-gray-400 text-xs">
          AI-driven estimate of how many registrants will actually attend.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!prediction ? (
          <Button 
            className="w-full bg-emerald-600 hover:bg-emerald-500"
            onClick={handlePredict}
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Analyze Attendance
          </Button>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-center p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <p className="text-xs text-emerald-400 uppercase font-bold tracking-widest mb-1">Predicted Show Rate</p>
              <p className="text-4xl font-black text-white">{(prediction.predictedShowRate * 100).toFixed(0)}%</p>
              <div className="mt-3 space-y-1">
                <Progress value={prediction.predictedShowRate * 100} className="h-1.5 bg-white/5" />
                <p className="text-[10px] text-gray-500">
                  Estimated {prediction.predictedAttendance} attendees
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2">
                <Info className="h-3 w-3" /> AI Insights
              </p>
              <ul className="space-y-2">
                {prediction.insights.map((insight: string, i: number) => (
                  <li key={i} className="text-xs text-gray-400 flex gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 pt-2 border-t border-white/5">
              <p className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3" /> Recommendations
              </p>
              <ul className="space-y-2">
                {prediction.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="text-xs text-gray-300 bg-white/5 p-2 rounded-lg border border-white/5">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-500 text-[10px] w-full"
              onClick={() => setPrediction(null)}
            >
              Re-analyze
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
