'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  TrendingUp, 
  MessageSquare, 
  Users, 
  Smile, 
  Meh, 
  Frown,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { cn } from '@/core/utils/utils';

interface FeedbackAnalyticsProps {
  analytics: {
    averageRating: string;
    nps: number;
    total: number;
    feedbackList: any[];
  };
}

export function FeedbackAnalytics({ analytics }: FeedbackAnalyticsProps) {
  const ratingDistribution = [1, 2, 3, 4, 5].map(star => {
    const count = analytics.feedbackList.filter(f => f.rating === star).length;
    return {
      star,
      count,
      percentage: analytics.total > 0 ? (count / analytics.total) * 100 : 0
    };
  }).reverse();

  return (
    <div className="space-y-6 text-white">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-muted/40 border-border text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-amber-500/10 rounded-lg"><Star className="text-amber-400" /></div>
              <Badge className="bg-amber-500/20 text-amber-400 border-0">Avg Rating</Badge>
            </div>
            <p className="text-4xl font-black">{analytics.averageRating}</p>
            <div className="flex items-center gap-1 mt-2">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <Star size={12} className="text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground ml-2">from {analytics.total} reviews</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/40 border-border text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-primary/10 rounded-lg"><TrendingUp className="text-primary" /></div>
              <Badge className="bg-primary/20 text-primary border-0">NPS Score</Badge>
            </div>
            <p className="text-4xl font-black">{analytics.nps}</p>
            <div className="flex items-center gap-2 mt-2">
              {analytics.nps > 30 ? (
                <span className="text-[10px] text-emerald-400 flex items-center gap-1"><ArrowUpRight size={12} /> Excellent Sentiment</span>
              ) : (
                <span className="text-[10px] text-amber-400 flex items-center gap-1"><Smile size={12} /> Positive Sentiment</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/40 border-border text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg"><Users className="text-purple-400" /></div>
              <Badge className="bg-purple-500/20 text-purple-400 border-0">Responses</Badge>
            </div>
            <p className="text-4xl font-black">{analytics.total}</p>
            <p className="text-[10px] text-muted-foreground mt-2">Total feedback submissions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-muted/40 border-border text-white">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ratingDistribution.map((item) => (
              <div key={item.star} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-10">
                  <span className="text-sm font-bold">{item.star}</span>
                  <Star size={12} className="fill-gray-500 text-muted-foreground" />
                </div>
                <div className="flex-1 h-2 bg-muted/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-1000" 
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(item.percentage)}%</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-muted/40 border-border text-white overflow-hidden flex flex-col">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Attendee Sentiment</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center gap-8">
            <div className="flex justify-around items-center text-center">
              <div className="space-y-2">
                <div className="p-3 bg-emerald-500/10 rounded-full mx-auto w-fit"><Smile className="text-emerald-500" size={32} /></div>
                <p className="text-xl font-bold">{Math.round((analytics.feedbackList.filter(f => f.rating >= 4).length / (analytics.total || 1)) * 100)}%</p>
                <p className="text-[10px] text-muted-foreground uppercase font-black">Promoters</p>
              </div>
              <div className="space-y-2">
                <div className="p-3 bg-amber-500/10 rounded-full mx-auto w-fit"><Meh className="text-amber-500" size={32} /></div>
                <p className="text-xl font-bold">{Math.round((analytics.feedbackList.filter(f => f.rating === 3).length / (analytics.total || 1)) * 100)}%</p>
                <p className="text-[10px] text-muted-foreground uppercase font-black">Passives</p>
              </div>
              <div className="space-y-2">
                <div className="p-3 bg-red-500/10 rounded-full mx-auto w-fit"><Frown className="text-red-500" size={32} /></div>
                <p className="text-xl font-bold">{Math.round((analytics.feedbackList.filter(f => f.rating <= 2).length / (analytics.total || 1)) * 100)}%</p>
                <p className="text-[10px] text-muted-foreground uppercase font-black">Detractors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/40 border-border text-white">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Recent Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.feedbackList.slice(0, 5).map((f, i) => (
              <div key={i} className="p-4 bg-muted/40 rounded-lg border border-border/60 flex gap-4">
                <div className="flex flex-col items-center gap-1 h-fit">
                   <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded text-[10px] font-bold">
                     {f.rating} <Star size={10} className="fill-amber-500" />
                   </div>
                </div>
                <div>
                  <p className="text-sm italic text-muted-foreground">"{f.comment || 'No comment provided'}"</p>
                  <p className="text-[10px] text-muted-foreground mt-2">{new Date(f.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {analytics.total === 0 && (
              <div className="text-center py-10 text-muted-foreground italic">No comments yet.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
