'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Users, 
  TrendingUp, 
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Activity,
  Smile,
  Meh,
  Frown
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer, Line, LineChart, YAxis, Tooltip } from "recharts";

interface FeedbackItem {
  id: string;
  rating: number;
  comment: string | null;
  responses: any;
  createdAt: Date;
}

interface FeedbackAnalyticsDashboardProps {
  data: {
    averageRating: string;
    nps: number;
    total: number;
    feedbackList: FeedbackItem[];
  };
  eventTitle: string;
}

const chartConfig = {
  rating: {
    label: "Rating",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function FeedbackAnalyticsDashboard({ data, eventTitle }: FeedbackAnalyticsDashboardProps) {
  const { averageRating, nps, total, feedbackList } = data;

  // Prepare data for rating distribution
  const ratingCounts = [1, 2, 3, 4, 5].map(r => ({
    stars: `${r} Stars`,
    count: feedbackList.filter(f => f.rating === r).length
  }));

  // Prepare data for sentiment trend (mock logic for now)
  const trendData = feedbackList
    .slice()
    .reverse()
    .map((f, i) => ({
      index: i + 1,
      rating: f.rating,
      date: new Date(f.createdAt).toLocaleDateString()
    }));

  return (
    <div className="space-y-8 text-white">
      <div>
        <h1 className="text-3xl font-black">Feedback Analytics</h1>
        <p className="text-muted-foreground">Insights and attendee satisfaction for <span className="text-white font-bold">{eventTitle}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-muted/40 border-border text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Average Rating</p>
              <Star className="h-4 w-4 text-amber-400 fill-current" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black">{averageRating}</p>
              <p className="text-muted-foreground text-sm">/ 5.0</p>
            </div>
            <div className="mt-4 flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={cn("h-3 w-3", i <= Math.round(Number(averageRating)) ? "text-amber-400 fill-current" : "text-gray-700")} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/40 border-border text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Net Promoter Score</p>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <p className="text-4xl font-black">{nps}</p>
            <div className="mt-4">
               <Badge className={cn(
                 "text-[10px]",
                 nps > 50 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                 nps > 0 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                 "bg-red-500/10 text-red-500 border-red-500/20"
               )}>
                 {nps > 50 ? "Excellent" : nps > 0 ? "Good" : "Needs Improvement"}
               </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/40 border-border text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Total Responses</p>
              <Users className="h-4 w-4 text-purple-400" />
            </div>
            <p className="text-4xl font-black">{total}</p>
            <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" /> 12% increase from last event
            </p>
          </CardContent>
        </Card>

        <Card className="bg-muted/40 border-border text-white">
          <CardContent className="p-6">
             <div className="flex justify-between items-start mb-4">
                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Sentiment</p>
                <Smile className="h-4 w-4 text-emerald-400" />
             </div>
             <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                   <Smile className="h-6 w-6 text-emerald-500 mb-1" />
                   <span className="text-[10px] text-muted-foreground">65%</span>
                </div>
                <div className="flex flex-col items-center">
                   <Meh className="h-6 w-6 text-amber-500 mb-1" />
                   <span className="text-[10px] text-muted-foreground">25%</span>
                </div>
                <div className="flex flex-col items-center">
                   <Frown className="h-6 w-6 text-red-500 mb-1" />
                   <span className="text-[10px] text-muted-foreground">10%</span>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Rating Distribution Chart */}
        <Card className="bg-muted/40 border-border text-white">
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>Frequency of each star rating.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingCounts}>
                  <XAxis 
                    dataKey="stars" 
                    stroke="#4b5563" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#4b5563" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                    itemStyle={{ color: '#06b6d4' }}
                  />
                  <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Satisfaction Trend Chart */}
        <Card className="bg-muted/40 border-border text-white">
          <CardHeader>
            <CardTitle>Satisfaction Trend</CardTitle>
            <CardDescription>Rating flow over time.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis 
                    dataKey="date" 
                    stroke="#4b5563" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#4b5563" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    domain={[0, 5]}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="rating" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4, fill: '#06b6d4' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Feed */}
      <Card className="bg-muted/40 border-border text-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Feedback</CardTitle>
            <CardDescription>Individual attendee comments and ratings.</CardDescription>
          </div>
          <Badge variant="outline" className="border-border text-muted-foreground">
            {feedbackList.length} total
          </Badge>
        </CardHeader>
        <CardContent>
           <div className="space-y-4">
              {feedbackList.map((feedback) => (
                <div key={feedback.id} className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-3">
                   <div className="flex justify-between items-start">
                      <div className="flex gap-1">
                         {[1, 2, 3, 4, 5].map(star => (
                           <Star key={star} className={cn("h-3 w-3", star <= feedback.rating ? "text-amber-400 fill-current" : "text-gray-700")} />
                         ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(feedback.createdAt).toLocaleString()}
                      </span>
                   </div>
                   {feedback.comment && (
                     <p className="text-sm text-muted-foreground italic">"{feedback.comment}"</p>
                   )}
                   {feedback.responses && Object.keys(feedback.responses).length > 0 && (
                     <div className="pt-2 border-t border-border/60 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(feedback.responses).map(([qId, val]: [string, any]) => (
                          <div key={qId} className="text-[10px]">
                             <span className="text-muted-foreground">Q-{qId}:</span> <span className="text-primary">{val}</span>
                          </div>
                        ))}
                     </div>
                   )}
                </div>
              ))}
              {feedbackList.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-10" />
                  <p>No feedback received yet.</p>
                </div>
              )}
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
