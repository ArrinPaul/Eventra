'use client';

import { Suspense } from 'react';
import AiRecommendationDashboard from '@/components/ai/recommendation-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, TrendingUp, Users, Target } from 'lucide-react';

function RecommendationsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
      <div className="animate-pulse">
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
}

export default function AiRecommendationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-blue-600" />
            AI Recommendations
          </h1>
          <p className="text-muted-foreground mt-2">
            Personalized suggestions powered by artificial intelligence to enhance your event experience
          </p>
        </div>
      </div>

      {/* AI Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Smart Event Matching
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              AI analyzes your preferences and behavior to suggest the most relevant events
            </p>
          </CardContent>
          <div className="absolute top-0 right-0 w-1 h-full bg-green-500" />
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Intelligent Networking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Connect with like-minded professionals based on skills, goals, and compatibility
            </p>
          </CardContent>
          <div className="absolute top-0 right-0 w-1 h-full bg-blue-500" />
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              Personalized Learning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Curated content and learning paths tailored to your career development goals
            </p>
          </CardContent>
          <div className="absolute top-0 right-0 w-1 h-full bg-purple-500" />
        </Card>
      </div>

      <Suspense fallback={<RecommendationsLoadingSkeleton />}>
        <AiRecommendationDashboard />
      </Suspense>
    </div>
  );
}