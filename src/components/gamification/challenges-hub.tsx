'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  Trophy, 
  Clock, 
  CheckCircle2, 
  Users,
  Zap,
  Calendar,
  Gift,
  ChevronRight,
  Play,
  Star
} from 'lucide-react';
import { 
  getActiveChallenges, 
  getUserChallenges, 
  joinChallenge, 
  claimChallengeRewards,
  getChallengeLeaderboard,
  type ChallengeDefinition, 
  type UserChallenge 
} from '@/app/actions/challenges';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';

interface ChallengesHubProps {
  compact?: boolean;
}

export function ChallengesHub({ compact = false }: ChallengesHubProps) {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<ChallengeDefinition[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    if (user) {
      loadChallenges();
    }
  }, [user]);

  const loadChallenges = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [activeChallenges, userChallengeData] = await Promise.all([
        getActiveChallenges(),
        getUserChallenges(user.id)
      ]);
      
      setChallenges(activeChallenges);
      setUserChallenges(userChallengeData);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) return;
    
    setJoining(challengeId);
    try {
      const result = await joinChallenge(user.id, challengeId);
      if (result.success) {
        await loadChallenges();
        toast({
          title: 'Challenge Joined!',
          description: 'Good luck completing the tasks!',
        });
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
      toast({
        title: 'Error',
        description: 'Failed to join challenge. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setJoining(null);
    }
  };

  const handleClaimRewards = async (challengeId: string) => {
    if (!user) return;
    
    setClaiming(challengeId);
    try {
      const result = await claimChallengeRewards(user.id, challengeId);
      if (result.success && result.rewards) {
        await loadChallenges();
        toast({
          title: '🎉 Rewards Claimed!',
          description: `You earned ${result.rewards.xp} XP${result.rewards.badge ? ' and a new badge!' : ''}`,
        });
      }
    } catch (error) {
      console.error('Error claiming rewards:', error);
      toast({
        title: 'Error',
        description: 'Failed to claim rewards. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setClaiming(null);
    }
  };

  const getUserChallengeData = (challengeId: string) => {
    return userChallenges.find(uc => uc.challengeId === challengeId);
  };

  const getChallengeProgress = (challenge: ChallengeDefinition, userChallenge?: UserChallenge) => {
    if (!userChallenge) return 0;
    
    const totalProgress = challenge.tasks.reduce((sum, task) => {
      const taskProgress = Math.min((userChallenge.progress[task.id] || 0) / task.target, 1);
      return sum + taskProgress;
    }, 0);
    
    return (totalProgress / challenge.tasks.length) * 100;
  };

  const getTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return 'Ending soon';
  };

  const dailyChallenges = challenges.filter(c => c.type === 'daily');
  const weeklyChallenges = challenges.filter(c => c.type === 'weekly');
  const activeChallenges = challenges.filter(c => {
    const userChallenge = getUserChallengeData(c.id);
    return userChallenge && !userChallenge.isCompleted;
  });
  const completedChallenges = challenges.filter(c => {
    const userChallenge = getUserChallengeData(c.id);
    return userChallenge?.isCompleted;
  });

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Active Challenges
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeChallenges.length > 0 ? (
            activeChallenges.slice(0, 2).map(challenge => {
              const userChallenge = getUserChallengeData(challenge.id);
              const progress = getChallengeProgress(challenge, userChallenge);
              
              return (
                <div key={challenge.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{challenge.icon}</span>
                      <span className="font-medium text-sm">{challenge.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {getTimeRemaining(challenge.endDate)}
                    </Badge>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>{userChallenge?.completedTasks.length || 0}/{challenge.tasks.length} tasks</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No active challenges. Join one to start earning rewards!
            </div>
          )}
          
          {challenges.length > 0 && (
            <Button variant="outline" className="w-full" size="sm">
              View All Challenges
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-500" />
            Challenges
          </h2>
          <p className="text-muted-foreground">Complete challenges to earn XP and rewards</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            <Trophy className="h-3 w-3 mr-1" />
            {completedChallenges.length} Completed
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">
            Active ({activeChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="daily">
            Daily ({dailyChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="weekly">
            Weekly ({weeklyChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedChallenges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-4">
          {activeChallenges.length > 0 ? (
            activeChallenges.map(challenge => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userChallenge={getUserChallengeData(challenge.id)}
                onClaim={handleClaimRewards}
                isClaiming={claiming === challenge.id}
              />
            ))
          ) : (
            <EmptyState 
              icon={Target}
              title="No Active Challenges"
              description="Join a challenge from the Daily or Weekly tabs to get started!"
            />
          )}
        </TabsContent>

        <TabsContent value="daily" className="space-y-4 mt-4">
          {dailyChallenges.map(challenge => {
            const userChallenge = getUserChallengeData(challenge.id);
            const isJoined = !!userChallenge;
            
            return (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userChallenge={userChallenge}
                onJoin={handleJoinChallenge}
                onClaim={handleClaimRewards}
                isJoining={joining === challenge.id}
                isClaiming={claiming === challenge.id}
                showJoinButton={!isJoined}
              />
            );
          })}
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4 mt-4">
          {weeklyChallenges.map(challenge => {
            const userChallenge = getUserChallengeData(challenge.id);
            const isJoined = !!userChallenge;
            
            return (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userChallenge={userChallenge}
                onJoin={handleJoinChallenge}
                onClaim={handleClaimRewards}
                isJoining={joining === challenge.id}
                isClaiming={claiming === challenge.id}
                showJoinButton={!isJoined}
              />
            );
          })}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-4">
          {completedChallenges.length > 0 ? (
            completedChallenges.map(challenge => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userChallenge={getUserChallengeData(challenge.id)}
                onClaim={handleClaimRewards}
                isClaiming={claiming === challenge.id}
              />
            ))
          ) : (
            <EmptyState 
              icon={Trophy}
              title="No Completed Challenges Yet"
              description="Complete challenges to see them here and track your achievements!"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Challenge Card Component
interface ChallengeCardProps {
  challenge: ChallengeDefinition;
  userChallenge?: UserChallenge;
  onJoin?: (challengeId: string) => void;
  onClaim?: (challengeId: string) => void;
  isJoining?: boolean;
  isClaiming?: boolean;
  showJoinButton?: boolean;
}

function ChallengeCard({ 
  challenge, 
  userChallenge, 
  onJoin, 
  onClaim, 
  isJoining, 
  isClaiming,
  showJoinButton 
}: ChallengeCardProps) {
  const progress = userChallenge 
    ? (challenge.tasks.reduce((sum, task) => {
        const taskProgress = Math.min((userChallenge.progress[task.id] || 0) / task.target, 1);
        return sum + taskProgress;
      }, 0) / challenge.tasks.length) * 100
    : 0;

  const getTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return 'Ending soon';
  };

  const canClaimRewards = userChallenge?.isCompleted && !userChallenge?.rewardsClaimed;

  return (
    <Card className={cn(
      "transition-all",
      userChallenge?.isCompleted && "bg-green-50 border-green-200"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{challenge.icon}</div>
            <div>
              <CardTitle className="text-lg">{challenge.name}</CardTitle>
              <CardDescription>{challenge.description}</CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={challenge.type === 'daily' ? 'default' : 'secondary'}>
              {challenge.type === 'daily' ? '☀️ Daily' : '📅 Weekly'}
            </Badge>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              {getTimeRemaining(challenge.endDate)}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {userChallenge && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Tasks */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Tasks</h4>
          <div className="grid gap-2">
            {challenge.tasks.map(task => {
              const taskProgress = userChallenge?.progress[task.id] || 0;
              const isCompleted = userChallenge?.completedTasks.includes(task.id);
              
              return (
                <div 
                  key={task.id} 
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg border",
                    isCompleted && "bg-green-50 border-green-200"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={cn("text-sm", isCompleted && "line-through text-muted-foreground")}>
                      {task.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {!isCompleted && userChallenge && (
                      <span className="text-muted-foreground">
                        {taskProgress}/{task.target}
                      </span>
                    )}
                    <Badge variant="outline" className="text-xs">
                      +{task.xpReward} XP
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rewards */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">Completion Reward:</span>
            <Badge variant="secondary">
              <Zap className="h-3 w-3 mr-1" />
              +{challenge.rewards.xp} XP
            </Badge>
            {challenge.rewards.badge && (
              <Badge variant="outline">
                <Star className="h-3 w-3 mr-1" />
                Badge
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div>
            {showJoinButton && onJoin && (
              <Button 
                onClick={() => onJoin(challenge.id)}
                disabled={isJoining}
              >
                {isJoining ? (
                  <>Loading...</>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    Join Challenge
                  </>
                )}
              </Button>
            )}
            
            {canClaimRewards && onClaim && (
              <Button 
                onClick={() => onClaim(challenge.id)}
                disabled={isClaiming}
                className="bg-green-600 hover:bg-green-700"
              >
                {isClaiming ? (
                  <>Claiming...</>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-1" />
                    Claim Rewards
                  </>
                )}
              </Button>
            )}
            
            {userChallenge?.rewardsClaimed && (
              <Badge className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Rewards Claimed
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
