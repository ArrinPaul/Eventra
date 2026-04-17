'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Ticket
} from 'lucide-react';
import { cn } from '@/core/utils/utils';

interface PulseProps {
  eventId: string;
  initialStats: {
    registeredCount: number;
    capacity: number;
    revenue: number;
    checkInCount: number;
  };
}

export function EventPulseClient({ eventId, initialStats }: PulseProps) {
  const [stats, setStats] = useState(initialStats);
  const [history, setHistory] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLatest = useCallback(async () => {
    // In a real app, this would call a server action
    // const newStats = await getEventPulse(eventId);
    // setStats(newStats);
    
    // Simulating updates for demo/real-time feel
    setHistory(prev => [...prev.slice(-9), stats.registeredCount]);
  }, [stats.registeredCount]);

  useEffect(() => {
    const interval = setInterval(fetchLatest, 15000);
    return () => clearInterval(interval);
  }, [fetchLatest]);

  const registrationRate = Math.round((stats.registeredCount / stats.capacity) * 100);
  const checkInRate = Math.round((stats.checkInCount / (stats.registeredCount || 1)) * 100);

  return (
    <div className="space-y-6 text-white">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-muted/40 border-border text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users size={48} />
          </div>
          <CardContent className="p-6">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">Registration</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black">{stats.registeredCount}</p>
              <p className="text-sm text-muted-foreground">/ {stats.capacity}</p>
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-primary">{registrationRate}% Filled</span>
                <span className="text-muted-foreground">{stats.capacity - stats.registeredCount} Left</span>
              </div>
              <Progress value={registrationRate} className="h-1 bg-muted/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/40 border-border text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={48} />
          </div>
          <CardContent className="p-6">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">Check-in Pulse</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black">{stats.checkInCount}</p>
              <p className="text-sm text-muted-foreground">verified</p>
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-emerald-400">{checkInRate}% Present</span>
                <span className="text-muted-foreground">{stats.registeredCount - stats.checkInCount} Pending</span>
              </div>
              <Progress value={checkInRate} className="h-1 bg-muted/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/40 border-border text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={48} />
          </div>
          <CardContent className="p-6">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">Momentum</p>
            <div className="flex items-center gap-2">
              <div className="p-1 bg-emerald-500/20 rounded">
                <ArrowUpRight size={16} className="text-emerald-400" />
              </div>
              <p className="text-3xl font-black">+12%</p>
            </div>
            <p className="text-[10px] text-muted-foreground mt-4 font-medium">Higher than last 24 hours</p>
          </CardContent>
        </Card>

        <Card className="bg-muted/40 border-border text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Ticket size={48} />
          </div>
          <CardContent className="p-6">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">Live Revenue</p>
            <p className="text-3xl font-black">${stats.revenue.toLocaleString()}</p>
            <Badge variant="outline" className="mt-4 bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px]">
              Processing Net
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-background/20 border-border text-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Clock size={14} />
              Velocity Graph
            </CardTitle>
            <Badge variant="outline" className="bg-muted/40 border-border text-[10px]">Last 10 updates</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-32 w-full flex items-end gap-1 px-2">
            {history.map((h, i) => (
              <div 
                key={i} 
                className="flex-1 bg-primary/40 rounded-t hover:bg-primary transition-all group relative"
                style={{ height: `${(h / stats.capacity) * 100}%`, minHeight: '4px' }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 border border-border text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {h} Reg
                </div>
              </div>
            ))}
            {history.length === 0 && <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs italic">Awaiting data pulse...</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
