'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/core/utils/utils';
import { CheckCircle, Users, AlertCircle } from 'lucide-react';

interface CheckInGaugeProps {
  checkedIn: number;
  total: number;
  title?: string;
  description?: string;
  size?: number;
  showStatus?: boolean;
}

export function CheckInGauge({
  checkedIn,
  total,
  title = 'Check-in Rate',
  description = 'Real-time attendance',
  size = 180,
  showStatus = true,
}: CheckInGaugeProps) {
  const percentage = total > 0 ? Math.round((checkedIn / total) * 100) : 0;
  const remaining = total - checkedIn;
  
  // Gauge calculations
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Status determination
  const getStatus = () => {
    if (percentage >= 80) return { label: 'Excellent', color: 'text-green-500', bgColor: 'bg-green-500/10', icon: CheckCircle };
    if (percentage >= 50) return { label: 'Good', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', icon: Users };
    return { label: 'Low', color: 'text-red-500', bgColor: 'bg-red-500/10', icon: AlertCircle };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  // Color based on percentage
  const getGaugeColor = () => {
    if (percentage >= 80) return 'stroke-green-500';
    if (percentage >= 60) return 'stroke-emerald-500';
    if (percentage >= 40) return 'stroke-yellow-500';
    if (percentage >= 20) return 'stroke-orange-500';
    return 'stroke-red-500';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          {/* Gauge */}
          <div className="relative" style={{ width: size, height: size }}>
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="transform -rotate-90"
            >
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={strokeWidth}
              />
              
              {/* Progress circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                className={cn('transition-all duration-1000 ease-out', getGaugeColor())}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />

              {/* Tick marks */}
              {[0, 25, 50, 75, 100].map((tick) => {
                const angle = (tick / 100) * 360 - 90;
                const radian = (angle * Math.PI) / 180;
                const innerRadius = radius - strokeWidth / 2 - 8;
                const outerRadius = radius - strokeWidth / 2 - 4;
                return (
                  <line
                    key={tick}
                    x1={size / 2 + innerRadius * Math.cos(radian)}
                    y1={size / 2 + innerRadius * Math.sin(radian)}
                    x2={size / 2 + outerRadius * Math.cos(radian)}
                    y2={size / 2 + outerRadius * Math.sin(radian)}
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.5"
                  />
                );
              })}
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold">{percentage}%</span>
              <span className="text-sm text-muted-foreground">checked in</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-6 mt-4 w-full">
            <div className="text-center">
              <p className="text-xl font-semibold text-green-500">{checkedIn.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Checked In</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-xl font-semibold text-muted-foreground">{remaining.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-xl font-semibold">{total.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>

          {/* Status badge */}
          {showStatus && (
            <div className={cn('flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full', status.bgColor)}>
              <StatusIcon className={cn('h-4 w-4', status.color)} />
              <span className={cn('text-sm font-medium', status.color)}>{status.label} Turnout</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default CheckInGauge;
