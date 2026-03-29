// @ts-nocheck
'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MatchmakingSection } from '../networking/matchmaking-section';
import { Brain, Users } from 'lucide-react';

export default function MatchmakingView() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl text-white space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-3 py-1 mb-2">
            <Brain className="w-3 h-3 mr-2" />
            Advanced AI Matchmaking
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight">Personalized Matchmaking</h1>
          <p className="text-gray-400 text-lg">Our AI analyzes your profile and goals to find your perfect professional matches.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/networking">
            <Button className="bg-white/10 hover:bg-white/20 text-white">
              <Users className="w-4 h-4 mr-2" />
              View Connections
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <MatchmakingSection />
        </div>
        <div className="space-y-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
          <p>AI matchmaking suggestions are active.</p>
          <p>Use the recommendations panel to discover relevant people and send connection requests.</p>
        </div>
      </div>
    </div>
  );
}


