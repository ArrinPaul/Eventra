'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DepartmentData {
  department: string;
  count: number;
  color?: string;
}

interface DepartmentPieChartProps {
  data: DepartmentData[];
  title?: string;
  description?: string;
  showLegend?: boolean;
  size?: number;
}

const DEFAULT_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
];

export function DepartmentPieChart({
  data,
  title = 'Attendees by Department',
  description = 'Distribution breakdown',
  showLegend = true,
  size = 200,
}: DepartmentPieChartProps) {
  const { total, segments, legendItems } = useMemo(() => {
    if (!data || data.length === 0) {
      return { total: 0, segments: [], legendItems: [] };
    }

    const totalCount = data.reduce((sum, d) => sum + d.count, 0);
    
    // Sort by count descending
    const sortedData = [...data].sort((a, b) => b.count - a.count);
    
    // Calculate segments
    let currentAngle = -90; // Start from top
    const segmentsData = sortedData.map((item, index) => {
      const percentage = (item.count / totalCount) * 100;
      const angle = (item.count / totalCount) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      
      return {
        ...item,
        percentage: Math.round(percentage * 10) / 10,
        startAngle,
        endAngle: currentAngle,
        color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      };
    });

    return {
      total: totalCount,
      segments: segmentsData,
      legendItems: segmentsData,
    };
  }, [data]);

  // Convert angle to radians
  const toRadians = (angle: number) => (angle * Math.PI) / 180;

  // Calculate arc path
  const describeArc = (startAngle: number, endAngle: number, radius: number) => {
    const start = {
      x: 50 + radius * Math.cos(toRadians(startAngle)),
      y: 50 + radius * Math.sin(toRadians(startAngle)),
    };
    const end = {
      x: 50 + radius * Math.cos(toRadians(endAngle)),
      y: 50 + radius * Math.sin(toRadians(endAngle)),
    };
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return `M 50 50 L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No department data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={cn('flex', showLegend ? 'gap-6' : 'justify-center')}>
          {/* Pie Chart */}
          <div className="relative" style={{ width: size, height: size }}>
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-0">
              {segments.map((segment, index) => (
                <g key={index}>
                  <path
                    d={describeArc(segment.startAngle, segment.endAngle - 0.5, 40)}
                    fill={segment.color}
                    className="transition-all duration-200 hover:opacity-80"
                    style={{ cursor: 'pointer' }}
                  >
                    <title>{segment.department}: {segment.count} ({segment.percentage}%)</title>
                  </path>
                </g>
              ))}
              {/* Inner circle for donut effect */}
              <circle cx="50" cy="50" r="25" fill="hsl(var(--background))" />
            </svg>
            
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{total.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
          </div>

          {/* Legend */}
          {showLegend && (
            <div className="flex-1 flex flex-col justify-center gap-2 min-w-[150px]">
              {legendItems.slice(0, 6).map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate flex-1">{item.department}</span>
                  <span className="text-muted-foreground font-medium">{item.percentage}%</span>
                </div>
              ))}
              {legendItems.length > 6 && (
                <div className="text-xs text-muted-foreground">
                  +{legendItems.length - 6} more departments
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default DepartmentPieChart;
