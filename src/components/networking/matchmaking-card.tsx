'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sparkles, MessageSquare, UserPlus, Info } from 'lucide-react';
import { cn } from '@/core/utils/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MatchmakingCardProps {
  match: {
    userId: string;
    name: string;
    role: string;
    company: string;
    connectionValue: number;
    rationale: string;
    conversationStarters: string[];
    image?: string;
  };
  onConnect?: (userId: string) => void;
}

export function MatchmakingCard({ match, onConnect }: MatchmakingCardProps) {
  return (
    <Card className="bg-white/5 border-white/10 hover:border-cyan-500/50 transition-all duration-300 group overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-cyan-500/20">
                <AvatarImage src={match.image} />
                <AvatarFallback className="bg-cyan-500/10 text-cyan-500 font-bold text-xl">
                  {match.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-1 border border-white/10">
                <div className="bg-cyan-500 rounded-full h-3 w-3" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg text-white group-hover:text-cyan-400 transition-colors">{match.name}</h3>
              <p className="text-sm text-gray-400">{match.role}</p>
              <p className="text-xs text-gray-500">{match.company}</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <Badge className="bg-cyan-500/20 text-cyan-400 border-0 mb-1">
              <Sparkles className="w-3 h-3 mr-1" />
              {match.connectionValue}% Match
            </Badge>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/5">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-500 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-300 leading-relaxed italic">
              "{match.rationale}"
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Try saying:</p>
          <div className="space-y-2">
            {match.conversationStarters.slice(0, 2).map((starter, i) => (
              <div key={i} className="text-xs bg-white/5 p-2 rounded-lg border border-white/5 text-gray-400 line-clamp-1">
                "{starter}"
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button 
            className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white" 
            onClick={() => onConnect?.(match.userId)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Connect
          </Button>
          <Button variant="outline" className="border-white/10 hover:bg-white/5 text-white">
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
