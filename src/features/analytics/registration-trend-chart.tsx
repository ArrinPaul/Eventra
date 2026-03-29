'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/core/utils/utils';

interface TrendDataPoint {
  date: string;
  registrations: number;
  label?: string;
}

interface RegistrationTrendChartProps {
  data: TrendDataPoint[];
  title?: string;
  description?: string;
  showPercentageChange?: boolean;
  height?: number;
}

export function RegistrationTrendChart({
  data,
  title = 'Registration Trend',
  description = 'Last 30 days',
  showPercentageChange = true,
  height = 200,
}: RegistrationTrendChartProps) {
  const { maxValue, minValue, percentageChange, trend, pathD, areaD, points } = useMemo(() => {
    if (!data || data.length === 0) {
      return { maxValue: 0, minValue: 0, percentageChange: 0, trend: 'neutral' as const, pathD: '', areaD: '', points: [] };
    }

    const values = data.map(d => d.registrations);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const padding = (max - min) * 0.1 || 10;
    const adjustedMax = max + padding;
    const adjustedMin = Math.max(0, min - padding);

    // Calculate percentage change (first week vs last week)
    const firstWeekAvg = values.slice(0, 7).reduce((a, b) => a + b, 0) / Math.min(7, values.length);
    const lastWeekAvg = values.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, values.length);
    const change = firstWeekAvg > 0 ? ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100 : 0;
    const trendDirection = change > 5 ? 'up' : change < -5 ? 'down' : 'neutral';

    // Calculate SVG path
    const chartWidth = 100;
    const chartHeight = 100;
    const pointsData = data.map((d, i) => ({
      x: (i / (data.length - 1)) * chartWidth,
      y: chartHeight - ((d.registrations - adjustedMin) / (adjustedMax - adjustedMin)) * chartHeight,
      value: d.registrations,
      label: d.label || d.date,
    }));

    const pathData = pointsData.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaData = `${pathData} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

    return {
      maxValue: max,
      minValue: min,
      percentageChange: Math.round(change * 10) / 10,
      trend: trendDirection,
      pathD: pathData,
      areaD: areaData,
      points: pointsData,
    };
  }, [data]);

  const totalRegistrations = useMemo(() => {
    return data.reduce((sum, d) => sum + d.registrations, 0);
  }, [data]);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-yellow-500';

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No registration data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {showPercentageChange && (
            <div className={cn('flex items-center gap-1 text-sm font-medium', trendColor)}>
              <TrendIcon className="h-4 w-4" />
              <span>{percentageChange > 0 ? '+' : ''}{percentageChange}%</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Row */}
        <div className="flex items-center gap-6 mb-4">
          <div>
            <p className="text-2xl font-bold">{totalRegistrations.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Registrations</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-lg font-semibold">{Math.round(totalRegistrations / data.length)}</p>
            <p className="text-xs text-muted-foreground">Daily Average</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-lg font-semibold">{maxValue}</p>
            <p className="text-xs text-muted-foreground">Peak Day</p>
          </div>
        </div>

        {/* Chart */}
        <div className="relative" style={{ height }}>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            {/* Gradient definition */}
            <defs>
              <linearGradient id="registrationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(y => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
            ))}

            {/* Area fill */}
            <path
              d={areaD}
              fill="url(#registrationGradient)"
            />

            {/* Line */}
            <path
              d={pathD}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />

            {/* Data points */}
            {points.map((point, i) => (
              <g key={i}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="1.5"
                  fill="hsl(var(--primary))"
                  className="transition-all hover:r-3"
                />
                <title>{point.label}: {point.value} registrations</title>
              </g>
            ))}
          </svg>

          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground -ml-1 pointer-events-none">
            <span>{maxValue}</span>
            <span>{Math.round((maxValue + minValue) / 2)}</span>
            <span>{minValue}</span>
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{data[0]?.label || data[0]?.date}</span>
          <span>{data[Math.floor(data.length / 2)]?.label || data[Math.floor(data.length / 2)]?.date}</span>
          <span>{data[data.length - 1]?.label || data[data.length - 1]?.date}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default RegistrationTrendChart;
