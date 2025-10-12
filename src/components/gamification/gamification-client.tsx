'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Trophy, 
  Star, 
  Zap, 
  Target, 
  Award, 
  TrendingUp, 
  Calendar, 
  Users, 
  MessageSquare, 
  Heart,
  ThumbsUp,
  Crown,
  Flame,
  Gift,
  Medal,
  Sparkles,
  ChevronRight,
  Plus,
  Filter,
  Search,
  Eye,
  EyeOff,
  Send,
  Smile,
  Clock
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { gamificationService } from '@/lib/firestore-services';
import { 
  UserXP, 
  Achievement, 
  UserAchievement, 
  Streak, 
  Challenge, 
  UserTitle, 
  FeedbackWall, 
  WallFeedback,
  Leaderboard 
} from '@/types';

export function GamificationClient() {
  const { user } = useAuth();
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userTitles, setUserTitles] = useState<UserTitle[]>([]);
  const [feedbackWalls, setFeedbackWalls] = useState<FeedbackWall[]>([]);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Feedback form
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackEmoji, setFeedbackEmoji] = useState('😊');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const levelSystem = [
    { level: 1, name: 'Newcomer', requiredXP: 0, color: '#6B7280', icon: '🌱' },
    { level: 2, name: 'Explorer', requiredXP: 100, color: '#10B981', icon: '🔍' },
    { level: 3, name: 'Contributor', requiredXP: 300, color: '#3B82F6', icon: '🤝' },
    { level: 4, name: 'Enthusiast', requiredXP: 600, color: '#8B5CF6', icon: '⭐' },
    { level: 5, name: 'Expert', requiredXP: 1000, color: '#F59E0B', icon: '🎯' },
    { level: 6, name: 'Champion', requiredXP: 1500, color: '#EF4444', icon: '🏆' },
    { level: 7, name: 'Legend', requiredXP: 2500, color: '#EC4899', icon: '👑' },
  ];

  const emojiOptions = ['😊', '😍', '🤩', '👏', '🔥', '💖', '🎉', '⚡', '🚀', '💎'];

  useEffect(() => {
    if (user) {
      loadGamificationData();
    }
  }, [user]);

  const loadGamificationData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [
        xpData,
        achievementsData,
        userAchievementsData,
        streaksData,
        challengesData,
        titlesData,
        wallsData
      ] = await Promise.all([
        gamificationService.getUserXP(user.id),
        gamificationService.getAchievements(),
        gamificationService.getUserAchievements(user.id),
        gamificationService.getUserStreaks(user.id),
        gamificationService.getChallenges(),
        gamificationService.getUserTitles(user.id),
        gamificationService.getFeedbackWalls()
      ]);

      setUserXP(xpData);
      setAchievements(achievementsData);
      setUserAchievements(userAchievementsData);
      setStreaks(streaksData);
      setChallenges(challengesData);
      setUserTitles(titlesData);
      setFeedbackWalls(wallsData);

      // Mock leaderboard
      setLeaderboard({
        id: 'global',
        type: 'global',
        entries: [
          { userId: 'user1', points: 2450, rank: 1, badgeCount: 12, eventCount: 25, connectionCount: 67 },
          { userId: user.id, points: xpData?.totalXP || 1850, rank: 2, badgeCount: 8, eventCount: 18, connectionCount: 45 },
          { userId: 'user3', points: 1650, rank: 3, badgeCount: 6, eventCount: 15, connectionCount: 32 },
          { userId: 'user4', points: 1420, rank: 4, badgeCount: 5, eventCount: 12, connectionCount: 28 },
          { userId: 'user5', points: 1200, rank: 5, badgeCount: 4, eventCount: 10, connectionCount: 25 }
        ],
        lastUpdated: new Date()
      });

    } catch (error) {
      console.error('Error loading gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLevel = () => {
    if (!userXP) return levelSystem[0];
    
    for (let i = levelSystem.length - 1; i >= 0; i--) {
      if (userXP.totalXP >= levelSystem[i].requiredXP) {
        return levelSystem[i];
      }
    }
    return levelSystem[0];
  };

  const getNextLevel = () => {
    const currentLevel = getCurrentLevel();
    const currentIndex = levelSystem.findIndex(l => l.level === currentLevel.level);
    return currentIndex < levelSystem.length - 1 ? levelSystem[currentIndex + 1] : null;
  };

  const getProgressToNextLevel = () => {
    const currentLevel = getCurrentLevel();
    const nextLevel = getNextLevel();
    
    if (!nextLevel || !userXP) return 100;
    
    const currentLevelXP = userXP.totalXP - currentLevel.requiredXP;
    const xpNeeded = nextLevel.requiredXP - currentLevel.requiredXP;
    
    return Math.min(100, (currentLevelXP / xpNeeded) * 100);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'uncommon': return 'text-green-600 bg-green-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleAddFeedback = async () => {
    if (!user || !feedbackText.trim() || feedbackWalls.length === 0) return;

    try {
      const wallId = feedbackWalls[0].id;
      await gamificationService.addFeedbackToWall(wallId, {
        content: feedbackText,
        rating: feedbackRating,
        emoji: feedbackEmoji,
        isAnonymous,
        authorId: isAnonymous ? undefined : user.id
      });

      // Refresh feedback walls
      const updatedWalls = await gamificationService.getFeedbackWalls();
      setFeedbackWalls(updatedWalls);
      
      // Reset form
      setFeedbackText('');
      setFeedbackRating(5);
      setFeedbackEmoji('😊');
      setIsAnonymous(false);
    } catch (error) {
      console.error('Error adding feedback:', error);
    }
  };

  const earnedAchievementIds = new Set(userAchievements.map(ua => ua.achievementId));
  const earnedAchievements = achievements.filter(a => earnedAchievementIds.has(a.id));
  const availableAchievements = achievements.filter(a => !earnedAchievementIds.has(a.id) && !a.isHidden);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gamification Hub</h1>
        <p className="text-gray-600">Track your progress, earn achievements, and compete with others</p>
      </div>

      {userXP && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full" style={{ backgroundColor: `${getCurrentLevel().color}20` }}>
                  <span className="text-2xl">{getCurrentLevel().icon}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{getCurrentLevel().name}</h3>
                  <p className="text-sm text-gray-600">Level {getCurrentLevel().level}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress to {getNextLevel()?.name || 'Max Level'}</span>
                  <span>{Math.round(getProgressToNextLevel())}%</span>
                </div>
                <Progress value={getProgressToNextLevel()} className="h-3" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{userXP.totalXP} XP</span>
                  <span>{getNextLevel()?.requiredXP || userXP.totalXP} XP</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{earnedAchievements.length}</div>
                  <div className="text-sm text-gray-600">Achievements</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{userTitles.length}</div>
                  <div className="text-sm text-gray-600">Titles</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="feedback">Feedback Wall</TabsTrigger>
          <TabsTrigger value="titles">Titles & Badges</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Streaks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  Activity Streaks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {streaks.map((streak) => (
                  <div key={streak.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{streak.type.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-600">
                        Current: {streak.currentStreak} • Best: {streak.longestStreak}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className={`h-5 w-5 ${streak.isActive ? 'text-orange-500' : 'text-gray-400'}`} />
                      <span className="font-bold text-lg">{streak.currentStreak}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent XP */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Recent XP Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userXP && (
                  <div className="space-y-3">
                    {userXP.xpHistory.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{transaction.reason}</p>
                          <p className="text-xs text-gray-500">{transaction.createdAt.toLocaleDateString()}</p>
                        </div>
                        <Badge variant="outline" className="text-green-600">
                          +{transaction.amount} XP
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Challenges Preview */}
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    Active Challenges
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('challenges')}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {challenges.slice(0, 2).map((challenge) => (
                    <div key={challenge.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{challenge.name}</h4>
                        <Badge variant="outline" className="capitalize">
                          {challenge.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
                      
                      <div className="space-y-2">
                        {challenge.tasks.slice(0, 2).map((task) => (
                          <div key={task.id} className="flex items-center justify-between text-sm">
                            <span>{task.name}</span>
                            <span className="text-green-600">+{task.xpReward} XP</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                        <div className="flex items-center justify-between">
                          <span>{challenge.participants.length} participants</span>
                          <span>Ends {challenge.endDate.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Earned Achievements ({earnedAchievements.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {earnedAchievements.map((achievement) => {
                    const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);
                    return (
                      <div key={achievement.id} className="flex items-center gap-3 p-3 border rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50">
                        <div className="text-2xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{achievement.name}</h4>
                            <Badge className={getRarityColor(achievement.rarity)} variant="secondary">
                              {achievement.rarity}
                            </Badge>
                            {userAchievement?.isNew && (
                              <Badge variant="default" className="bg-red-500">New!</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{achievement.description}</p>
                          <p className="text-xs text-green-600 font-medium">+{achievement.reward.xp} XP</p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {userAchievement?.earnedAt.toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Available Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {availableAchievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center gap-3 p-3 border rounded-lg opacity-75">
                      <div className="text-2xl grayscale">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-700">{achievement.name}</h4>
                          <Badge className={getRarityColor(achievement.rarity)} variant="outline">
                            {achievement.rarity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-xs text-blue-600 font-medium">+{achievement.reward.xp} XP</p>
                          <p className="text-xs text-gray-500">
                            {achievement.earnedBy.length} people earned this
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-6">
          {challenges.map((challenge) => (
            <Card key={challenge.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{challenge.name}</CardTitle>
                    <CardDescription>{challenge.description}</CardDescription>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="capitalize mb-2">
                      {challenge.type}
                    </Badge>
                    <p className="text-sm text-gray-600">
                      {challenge.participants.length} / {challenge.maxParticipants || '∞'} participants
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between text-sm">
                  <span>Duration: {challenge.startDate.toLocaleDateString()} - {challenge.endDate.toLocaleDateString()}</span>
                  <span className="text-green-600 font-medium">
                    {Math.max(0, Math.ceil((challenge.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days left
                  </span>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Tasks</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    {challenge.tasks.map((task) => (
                      <div key={task.id} className={`p-3 border rounded-lg ${task.isCompleted ? 'bg-green-50 border-green-200' : ''}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{task.name}</h5>
                          {task.isCompleted ? (
                            <Badge variant="default" className="bg-green-500">Complete</Badge>
                          ) : (
                            <Badge variant="outline">In Progress</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span>Target: {task.target}</span>
                          <span className="text-green-600 font-medium">+{task.xpReward} XP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Rewards</h4>
                  <div className="flex flex-wrap gap-2">
                    {challenge.rewards.map((reward) => (
                      <Badge key={reward.id} variant="outline" className="flex items-center gap-1">
                        <Gift className="w-3 h-3" />
                        {reward.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button className="w-full" variant={challenge.participants.includes(user?.id || '') ? 'outline' : 'default'}>
                  {challenge.participants.includes(user?.id || '') ? 'Participating' : 'Join Challenge'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          {leaderboard && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Global Leaderboard
                </CardTitle>
                <CardDescription>
                  Updated {leaderboard.lastUpdated.toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.entries.map((entry, index) => (
                    <div key={entry.userId} className={`flex items-center justify-between p-4 border rounded-lg ${entry.userId === user?.id ? 'bg-blue-50 border-blue-200' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          entry.rank === 1 ? 'bg-yellow-500' :
                          entry.rank === 2 ? 'bg-gray-400' :
                          entry.rank === 3 ? 'bg-amber-600' : 'bg-gray-600'
                        }`}>
                          {entry.rank}
                        </div>
                        <div>
                          <p className="font-medium">
                            {entry.userId === user?.id ? 'You' : `User ${entry.rank}`}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{entry.eventCount} events</span>
                            <span>{entry.connectionCount} connections</span>
                            <span>{entry.badgeCount} badges</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">{entry.points}</div>
                        <div className="text-sm text-gray-600">XP</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                Share Your Feedback
              </CardTitle>
              <CardDescription>
                Let others know about your experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Message</label>
                <Textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Share your thoughts about the event..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rating (1-5)</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        variant={feedbackRating >= rating ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFeedbackRating(rating)}
                      >
                        <Star className={`w-4 h-4 ${feedbackRating >= rating ? 'fill-current' : ''}`} />
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Emoji</label>
                  <div className="flex flex-wrap gap-1">
                    {emojiOptions.map((emoji) => (
                      <Button
                        key={emoji}
                        variant={feedbackEmoji === emoji ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFeedbackEmoji(emoji)}
                        className="text-lg p-2"
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="anonymous" className="text-sm">Post anonymously</label>
                </div>
                <Button onClick={handleAddFeedback} disabled={!feedbackText.trim()}>
                  <Send className="w-4 h-4 mr-2" />
                  Post Feedback
                </Button>
              </div>
            </CardContent>
          </Card>

          {feedbackWalls.map((wall) => (
            <Card key={wall.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-green-500" />
                  Community Feedback ({wall.feedbacks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {wall.feedbacks
                    .sort((a, b) => b.likes - a.likes)
                    .map((feedback) => (
                    <div key={feedback.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{feedback.emoji}</span>
                          <span className="font-medium">
                            {feedback.isAnonymous ? 'Anonymous' : `User ${feedback.authorId}`}
                          </span>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  feedback.rating && feedback.rating >= star
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {feedback.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-gray-800 mb-3">{feedback.content}</p>
                      
                      <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-500">
                          <Heart className="w-4 h-4 mr-1" />
                          {feedback.likes}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-500">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Reply
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="titles" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Medal className="h-5 w-5 text-purple-500" />
                  Your Titles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userTitles.map((title) => (
                    <div key={title.id} className={`p-4 border rounded-lg ${title.isActive ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{title.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium" style={{ color: title.color }}>
                              {title.name}
                            </h4>
                            <Badge className={getRarityColor(title.rarity)} variant="secondary">
                              {title.rarity}
                            </Badge>
                            {title.isActive && (
                              <Badge variant="default">Active</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{title.description}</p>
                          <div className="text-xs text-gray-500">
                            <p>Requirements:</p>
                            <ul className="list-disc list-inside">
                              {title.requirements.map((req, index) => (
                                <li key={index}>{req}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          Earned: {title.earnedAt.toLocaleDateString()}
                        </span>
                        {!title.isActive && (
                          <Button variant="outline" size="sm">
                            Set Active
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Badge Collection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {earnedAchievements
                    .filter(a => a.reward.badge)
                    .map((achievement) => (
                    <div key={achievement.id} className="text-center p-3 border rounded-lg bg-gradient-to-b from-yellow-50 to-orange-50">
                      <div className="text-2xl mb-2">{achievement.icon}</div>
                      <div className="text-xs font-medium">{achievement.reward.badge}</div>
                      <div className={`text-xs mt-1 px-2 py-1 rounded ${getRarityColor(achievement.rarity)}`}>
                        {achievement.rarity}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}