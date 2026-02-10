'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Trophy, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/hooks/use-toast';
import { Id } from '@/convex/_generated/dataModel';

export function ChallengesHub() {
  const challenges = useQuery(api.gamification.getChallenges);
  const userChallenges = useQuery(api.gamification.getUserChallenges);
  const joinChallenge = useMutation(api.gamification.joinChallenge);
  const { toast } = useToast();

  const handleJoinChallenge = async (challengeId: Id<'challenges'>) => {
    try {
      await joinChallenge({ challengeId });
      toast({
        title: 'Challenge Joined!',
        description: 'Track your progress on your gamification page.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to join challenge',
        variant: 'destructive',
      });
    }
  };

  if (!challenges) {
    return (
      <Card className="bg-white/5 border-white/10 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Active Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-white/5 rounded-lg" />
            <div className="h-24 bg-white/5 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const userChallengeIds = new Set(
    userChallenges?.map((uc) => uc.challengeId.toString()) || []
  );

  const activeChallenges = challenges.filter((c) => c.status === 'active');

  return (
    <Card className="bg-white/5 border-white/10 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          Active Challenges
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeChallenges.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            <p>No active challenges at the moment. Check back soon!</p>
          </div>
        ) : (
          activeChallenges.map((challenge) => {
            const isJoined = userChallengeIds.has(challenge._id.toString());
            const userChallenge = userChallenges?.find(
              (uc) => uc.challengeId.toString() === challenge._id.toString()
            );
            const progress = userChallenge?.progress || 0;
            const target = challenge.target || 1;
            const progressPercent = Math.min((progress / target) * 100, 100);

            return (
              <div
                key={challenge._id}
                className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{challenge.title}</h3>
                      {userChallenge?.completed && (
                        <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{challenge.description}</p>
                  </div>
                  <div className="flex items-center gap-2 text-yellow-500">
                    <Trophy className="h-4 w-4" />
                    <span className="text-sm font-medium">{challenge.xpReward} XP</span>
                  </div>
                </div>

                {isJoined && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">
                        Progress: {progress} / {target}
                      </span>
                      <span className="text-white font-medium">
                        {progressPercent.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    {challenge.endDate ? (
                      <>
                        <Calendar className="h-3 w-3" />
                        <span>
                          Ends {new Date(challenge.endDate).toLocaleDateString()}
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3" />
                        <span>No deadline</span>
                      </>
                    )}
                  </div>
                  {!isJoined && (
                    <Button
                      size="sm"
                      onClick={() => handleJoinChallenge(challenge._id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Join Challenge
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}