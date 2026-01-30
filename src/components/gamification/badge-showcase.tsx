'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Star, 
  Award, 
  Lock, 
  Sparkles,
  ChevronRight,
  Filter,
  Eye
} from 'lucide-react';
import { getBadgeDefinitions, getUserBadges, getBadgeProgress, type BadgeDefinition, type UserBadge } from '@/app/actions/badges';
import { cn } from '@/core/utils/utils';

interface BadgeShowcaseProps {
  userId: string;
  stats?: {
    eventsAttended?: number;
    connections?: number;
    posts?: number;
    checkIns?: number;
    currentStreak?: number;
    totalPoints?: number;
    eventCategories?: { [category: string]: number };
  };
  compact?: boolean;
}

const rarityColors: { [key: string]: string } = {
  common: 'border-gray-300 bg-gray-50',
  uncommon: 'border-green-400 bg-green-50',
  rare: 'border-blue-400 bg-blue-50',
  epic: 'border-purple-400 bg-purple-50',
  legendary: 'border-orange-400 bg-gradient-to-br from-orange-50 to-yellow-50'
};

const rarityTextColors: { [key: string]: string } = {
  common: 'text-gray-600',
  uncommon: 'text-green-600',
  rare: 'text-blue-600',
  epic: 'text-purple-600',
  legendary: 'text-orange-600'
};

const categoryIcons: { [key: string]: string } = {
  attendance: 'ðŸŽŸï¸',
  networking: 'ðŸ¤',
  engagement: 'ðŸ’¬',
  achievement: 'ðŸ†',
  special: 'âœ¨'
};

export function BadgeShowcase({ userId, stats, compact = false }: BadgeShowcaseProps) {
  const [badges, setBadges] = useState<BadgeDefinition[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<Array<{ badge: BadgeDefinition; progress: number; isEarned: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    loadBadges();
  }, [userId, stats]);

  const loadBadges = async () => {
    setLoading(true);
    try {
      const [allBadges, earnedBadges, progress] = await Promise.all([
        getBadgeDefinitions(),
        getUserBadges(userId),
        getBadgeProgress(userId, stats || {})
      ]);

      setBadges(allBadges);
      setUserBadges(earnedBadges);
      setBadgeProgress(progress);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const earnedBadgeIds = new Set(userBadges.map(b => b.badgeId));
  const earnedBadges = badges.filter(b => earnedBadgeIds.has(b.id));
  const newBadges = userBadges.filter(b => b.isNew);
  
  const filteredProgress = categoryFilter === 'all' 
    ? badgeProgress 
    : badgeProgress.filter(p => p.badge.category === categoryFilter);

  const categories = ['all', 'attendance', 'networking', 'engagement', 'achievement', 'special'];

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Badges ({earnedBadges.length}/{badges.filter(b => !b.isHidden).length})
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setShowAllBadges(true)}>
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {earnedBadges.slice(0, 8).map(badge => (
            <button
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={cn(
                "p-2 rounded-lg border-2 transition-all hover:scale-110",
                rarityColors[badge.rarity]
              )}
              title={badge.name}
            >
              <span className="text-2xl">{badge.icon}</span>
            </button>
          ))}
          {earnedBadges.length > 8 && (
            <button
              onClick={() => setShowAllBadges(true)}
              className="p-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center"
            >
              <span className="text-sm text-gray-500">+{earnedBadges.length - 8}</span>
            </button>
          )}
        </div>

        {/* Badge Detail Dialog */}
        <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
          <DialogContent>
            {selectedBadge && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-3 rounded-xl border-2",
                      rarityColors[selectedBadge.rarity]
                    )}>
                      <span className="text-4xl">{selectedBadge.icon}</span>
                    </div>
                    <div>
                      <DialogTitle>{selectedBadge.name}</DialogTitle>
                      <Badge className={cn("mt-1", rarityTextColors[selectedBadge.rarity])} variant="outline">
                        {selectedBadge.rarity.charAt(0).toUpperCase() + selectedBadge.rarity.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </DialogHeader>
                <DialogDescription className="text-base">
                  {selectedBadge.description}
                </DialogDescription>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    <span>+{selectedBadge.xpReward} XP</span>
                  </div>
                  <Badge variant="secondary">
                    {categoryIcons[selectedBadge.category]} {selectedBadge.category}
                  </Badge>
                </div>
                {earnedBadgeIds.has(selectedBadge.id) && (
                  <div className="text-sm text-green-600 flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    Earned on {userBadges.find(b => b.badgeId === selectedBadge.id)?.earnedAt.toLocaleDateString()}
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* All Badges Dialog */}
        <Dialog open={showAllBadges} onOpenChange={setShowAllBadges}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>All Badges</DialogTitle>
              <DialogDescription>
                You&apos;ve earned {earnedBadges.length} out of {badges.filter(b => !b.isHidden).length} badges
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="earned">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="earned">
                  Earned ({earnedBadges.length})
                </TabsTrigger>
                <TabsTrigger value="progress">
                  In Progress
                </TabsTrigger>
                <TabsTrigger value="all">
                  All Badges
                </TabsTrigger>
              </TabsList>

              <TabsContent value="earned" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {earnedBadges.map(badge => (
                    <BadgeCard 
                      key={badge.id} 
                      badge={badge} 
                      isEarned={true}
                      earnedDate={userBadges.find(b => b.badgeId === badge.id)?.earnedAt}
                      isNew={newBadges.some(b => b.badgeId === badge.id)}
                      onClick={() => setSelectedBadge(badge)}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="progress" className="space-y-4 mt-4">
                <div className="flex gap-2 flex-wrap mb-4">
                  {categories.map(cat => (
                    <Badge
                      key={cat}
                      variant={categoryFilter === cat ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setCategoryFilter(cat)}
                    >
                      {cat === 'all' ? 'All' : `${categoryIcons[cat]} ${cat}`}
                    </Badge>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProgress
                    .filter(p => !p.isEarned && p.progress > 0)
                    .sort((a, b) => b.progress - a.progress)
                    .map(({ badge, progress }) => (
                      <BadgeProgressCard
                        key={badge.id}
                        badge={badge}
                        progress={progress}
                        onClick={() => setSelectedBadge(badge)}
                      />
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="all" className="space-y-4 mt-4">
                <div className="flex gap-2 flex-wrap mb-4">
                  {categories.map(cat => (
                    <Badge
                      key={cat}
                      variant={categoryFilter === cat ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setCategoryFilter(cat)}
                    >
                      {cat === 'all' ? 'All' : `${categoryIcons[cat]} ${cat}`}
                    </Badge>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredProgress.map(({ badge, progress, isEarned }) => (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      isEarned={isEarned}
                      progress={isEarned ? 100 : progress}
                      earnedDate={isEarned ? userBadges.find(b => b.badgeId === badge.id)?.earnedAt : undefined}
                      onClick={() => setSelectedBadge(badge)}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Full showcase view
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Badge Collection
            </CardTitle>
            <CardDescription>
              {earnedBadges.length} of {badges.filter(b => !b.isHidden).length} badges earned
            </CardDescription>
          </div>
          {newBadges.length > 0 && (
            <Badge variant="default" className="bg-red-500">
              {newBadges.length} New!
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="earned">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="earned">
              Earned ({earnedBadges.length})
            </TabsTrigger>
            <TabsTrigger value="progress">
              In Progress
            </TabsTrigger>
            <TabsTrigger value="all">
              All Badges
            </TabsTrigger>
          </TabsList>

          <TabsContent value="earned" className="space-y-4">
            {earnedBadges.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {earnedBadges.map(badge => (
                  <BadgeCard 
                    key={badge.id} 
                    badge={badge} 
                    isEarned={true}
                    earnedDate={userBadges.find(b => b.badgeId === badge.id)?.earnedAt}
                    isNew={newBadges.some(b => b.badgeId === badge.id)}
                    onClick={() => setSelectedBadge(badge)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No badges earned yet. Keep participating to unlock badges!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <div className="flex gap-2 flex-wrap mb-4">
              {categories.map(cat => (
                <Badge
                  key={cat}
                  variant={categoryFilter === cat ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat === 'all' ? 'All' : `${categoryIcons[cat]} ${cat}`}
                </Badge>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProgress
                .filter(p => !p.isEarned && p.progress > 0)
                .sort((a, b) => b.progress - a.progress)
                .map(({ badge, progress }) => (
                  <BadgeProgressCard
                    key={badge.id}
                    badge={badge}
                    progress={progress}
                    onClick={() => setSelectedBadge(badge)}
                  />
                ))}
            </div>
            
            {filteredProgress.filter(p => !p.isEarned && p.progress > 0).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No badges in progress. Start participating to make progress!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <div className="flex gap-2 flex-wrap mb-4">
              {categories.map(cat => (
                <Badge
                  key={cat}
                  variant={categoryFilter === cat ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat === 'all' ? 'All' : `${categoryIcons[cat]} ${cat}`}
                </Badge>
              ))}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredProgress.map(({ badge, progress, isEarned }) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  isEarned={isEarned}
                  progress={isEarned ? 100 : progress}
                  earnedDate={isEarned ? userBadges.find(b => b.badgeId === badge.id)?.earnedAt : undefined}
                  onClick={() => setSelectedBadge(badge)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Badge Detail Dialog */}
        <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
          <DialogContent>
            {selectedBadge && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-3 rounded-xl border-2",
                      rarityColors[selectedBadge.rarity]
                    )}>
                      <span className="text-4xl">{selectedBadge.icon}</span>
                    </div>
                    <div>
                      <DialogTitle>{selectedBadge.name}</DialogTitle>
                      <Badge className={cn("mt-1", rarityTextColors[selectedBadge.rarity])} variant="outline">
                        {selectedBadge.rarity.charAt(0).toUpperCase() + selectedBadge.rarity.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </DialogHeader>
                <DialogDescription className="text-base">
                  {selectedBadge.description}
                </DialogDescription>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    <span>+{selectedBadge.xpReward} XP</span>
                  </div>
                  <Badge variant="secondary">
                    {categoryIcons[selectedBadge.category]} {selectedBadge.category}
                  </Badge>
                </div>
                {earnedBadgeIds.has(selectedBadge.id) ? (
                  <div className="text-sm text-green-600 flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    Earned on {userBadges.find(b => b.badgeId === selectedBadge.id)?.earnedAt.toLocaleDateString()}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round(badgeProgress.find(p => p.badge.id === selectedBadge.id)?.progress || 0)}%</span>
                    </div>
                    <Progress value={badgeProgress.find(p => p.badge.id === selectedBadge.id)?.progress || 0} />
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Badge Card Component
interface BadgeCardProps {
  badge: BadgeDefinition;
  isEarned: boolean;
  progress?: number;
  earnedDate?: Date;
  isNew?: boolean;
  onClick?: () => void;
}

function BadgeCard({ badge, isEarned, progress, earnedDate, isNew, onClick }: BadgeCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-xl border-2 text-center transition-all hover:scale-105",
        isEarned ? rarityColors[badge.rarity] : "border-gray-200 bg-gray-50 opacity-60",
        "cursor-pointer"
      )}
    >
      {isNew && (
        <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">
          NEW
        </Badge>
      )}
      
      <div className={cn("text-3xl mb-2", !isEarned && "grayscale")}>
        {badge.icon}
      </div>
      
      <h4 className="font-medium text-sm truncate">{badge.name}</h4>
      
      <Badge 
        variant="outline" 
        className={cn("mt-1 text-xs", isEarned && rarityTextColors[badge.rarity])}
      >
        {badge.rarity}
      </Badge>
      
      {!isEarned && progress !== undefined && progress > 0 && (
        <div className="mt-2">
          <Progress value={progress} className="h-1" />
          <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
        </div>
      )}
      
      {!isEarned && (progress === undefined || progress === 0) && (
        <div className="mt-2 flex items-center justify-center text-muted-foreground">
          <Lock className="h-3 w-3" />
        </div>
      )}
    </button>
  );
}

// Badge Progress Card Component
interface BadgeProgressCardProps {
  badge: BadgeDefinition;
  progress: number;
  onClick?: () => void;
}

function BadgeProgressCard({ badge, progress, onClick }: BadgeProgressCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors text-left w-full"
    >
      <div className={cn(
        "p-2 rounded-lg border",
        rarityColors[badge.rarity]
      )}>
        <span className="text-2xl">{badge.icon}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{badge.name}</h4>
        <p className="text-xs text-muted-foreground truncate">{badge.description}</p>
        <div className="mt-1 flex items-center gap-2">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-xs font-medium">{Math.round(progress)}%</span>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground">
        +{badge.xpReward} XP
      </div>
    </button>
  );
}
