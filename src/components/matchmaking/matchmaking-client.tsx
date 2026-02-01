'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Heart, 
  X, 
  Star, 
  Undo2, 
  MessageCircle, 
  Users, 
  Target,
  Zap,
  Award,
  MapPin,
  Briefcase,
  Loader2
} from 'lucide-react';
import { Match, UserProfile, MatchProfile } from '@/types';
import { matchingService, userService } from '@/core/services/firestore-services';
import { cn } from '@/core/utils/utils';
import { db, FIRESTORE_COLLECTIONS } from '@/core/config/firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';

// Local UserProfile type for component
interface LocalUserProfile {
  id: string;
  name: string;
  bio?: string;
  location?: string;
  skills?: string[];
  achievements?: string[];
  isLookingForTeammate?: boolean;
  isLookingForMentor?: boolean;
  isLookingForCofounder?: boolean;
  mentorshipAreas?: string[];
  compatibility?: {
    personalityType?: string;
    workStyle?: string;
    goals?: string[];
  };
  [key: string]: unknown;
}

export default function MatchmakingClient() {
  const { user } = useAuth();
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [matchQueue, setMatchQueue] = useState<Match[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [showMatches, setShowMatches] = useState(false);
  const [userProfiles, setUserProfiles] = useState<{ [key: string]: LocalUserProfile }>({});
  const [loading, setLoading] = useState(true);

  const loadUserProfile = useCallback(async (userId: string): Promise<LocalUserProfile | null> => {
    // Check if already loaded
    if (userProfiles[userId]) return userProfiles[userId];
    
    try {
      const userDoc = await getDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const profile: LocalUserProfile = {
          id: userId,
          name: data.displayName || data.name || 'Unknown',
          bio: data.bio || '',
          location: data.location || '',
          skills: data.skills || [],
          achievements: data.achievements || [],
          isLookingForTeammate: data.isLookingForTeammate || false,
          isLookingForMentor: data.isLookingForMentor || false,
          isLookingForCofounder: data.isLookingForCofounder || false,
          mentorshipAreas: data.mentorshipAreas || [],
          compatibility: data.compatibility || {}
        };
        
        setUserProfiles(prev => ({ ...prev, [userId]: profile }));
        return profile;
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
    return null;
  }, [userProfiles]);

  const loadMatches = useCallback(async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      // Try to get matches from service
      const userMatches = await matchingService.getUserMatches(user.uid);
      
      if (userMatches && userMatches.length > 0) {
        setMatchQueue(userMatches);
        
        // Load user profiles for all matches
        for (const match of userMatches) {
          const profileId = match.user1Id === user.uid ? match.user2Id : match.user1Id;
          await loadUserProfile(profileId);
        }
      } else {
        // No matches found - try to generate potential matches
        const potentialMatchesRef = collection(db, 'matches');
        const q = query(
          potentialMatchesRef,
          where('user1Id', '==', user.uid),
          where('status', '==', 'potential'),
          orderBy('compatibilityScore', 'desc'),
          limit(10)
        );
        
        const snapshot = await getDocs(q);
        const potentialMatches: Match[] = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate?.() || new Date(d.data().createdAt)
        })) as Match[];
        
        if (potentialMatches.length > 0) {
          setMatchQueue(potentialMatches);
          
          for (const match of potentialMatches) {
            await loadUserProfile(match.user2Id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, loadUserProfile]);

  useEffect(() => {
    if (matchQueue.length > 0 && currentIndex < matchQueue.length) {
      setCurrentMatch(matchQueue[currentIndex]);
    } else {
      setCurrentMatch(null);
    }
  }, [currentIndex, matchQueue]);

  useEffect(() => {
    if (user?.uid) {
      loadMatches();
    }
  }, [user?.uid, loadMatches]);

  const handleSwipe = async (action: 'like' | 'pass') => {
    if (!currentMatch || isAnimating) return;

    setIsAnimating(true);
    setSwipeDirection(action === 'like' ? 'right' : 'left');

    try {
      const isMatch = await matchingService.swipeUser(currentMatch.id, user?.uid || '', action);
      
      if (isMatch) {
        setMatches(prev => [...prev, currentMatch]);
        // Show match notification
      }

      // Move to next match after animation
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setSwipeDirection(null);
        setIsAnimating(false);
      }, 300);

    } catch (error) {
      console.error('Error swiping:', error);
      setIsAnimating(false);
      setSwipeDirection(null);
    }
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Get the current profile to display
  const getCurrentProfile = (): LocalUserProfile | null => {
    if (!currentMatch) return null;
    const profileId = currentMatch.user1Id === user?.uid ? currentMatch.user2Id : currentMatch.user1Id;
    return userProfiles[profileId] || null;
  };

  const currentProfile = getCurrentProfile();
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getMatchTypeIcon = (type: string) => {
    switch (type) {
      case 'mentor':
        return <Award className="h-4 w-4" />;
      case 'cofounder':
        return <Target className="h-4 w-4" />;
      case 'teammate':
        return <Users className="h-4 w-4" />;
      default:
        return <Heart className="h-4 w-4" />;
    }
  };

  const getMatchTypeColor = (type: string) => {
    switch (type) {
      case 'mentor':
        return 'text-purple-600 bg-purple-100';
      case 'cofounder':
        return 'text-green-600 bg-green-100';
      case 'teammate':
        return 'text-secondary bg-secondary/10';
      default:
        return 'text-primary bg-primary/10';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Finding your matches...</p>
        </div>
      </div>
    );
  }

  if (!currentMatch || currentIndex >= matchQueue.length || !currentProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
            <Heart className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No More Matches</h2>
          <p className="text-muted-foreground mb-6">
            Check back later for new potential connections!
          </p>
          <div className="space-y-2">
            <Button onClick={() => setShowMatches(true)}>
              View My Matches ({matches.length})
            </Button>
            <br />
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8">
      <div className="container mx-auto px-4 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Discover</h1>
            <p className="text-muted-foreground">Find your perfect match</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMatches(true)}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {matches.length}
          </Button>
        </div>

        {/* Match Card */}
        <div className="relative mb-8">
          <Card
            className={cn(
              "relative overflow-hidden transition-transform duration-300",
              isAnimating && swipeDirection === 'left' && "-translate-x-full opacity-0",
              isAnimating && swipeDirection === 'right' && "translate-x-full opacity-0"
            )}
          >
            {/* Compatibility Score */}
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-white/90 backdrop-blur rounded-full p-2 flex items-center gap-1">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="font-bold text-sm">{currentMatch.compatibilityScore}%</span>
              </div>
            </div>

            {/* Match Type Badge */}
            <div className="absolute top-4 left-4 z-10">
              <Badge className={cn("text-xs", getMatchTypeColor(currentMatch.matchType))}>
                {getMatchTypeIcon(currentMatch.matchType)}
                <span className="ml-1 capitalize">{currentMatch.matchType}</span>
              </Badge>
            </div>

            {/* Profile Image Placeholder */}
            <div className="h-96 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Avatar className="h-32 w-32">
                <AvatarFallback className="text-4xl">
                  {getInitials(currentProfile.name)}
                </AvatarFallback>
              </Avatar>
            </div>

            <CardContent className="p-6">
              {/* Profile Info */}
              <div className="mb-4">
                <h2 className="text-2xl font-bold mb-1">{currentProfile.name}</h2>
                <div className="flex items-center text-muted-foreground text-sm mb-3">
                  <MapPin className="h-4 w-4 mr-1" />
                  {currentProfile.location || 'Location not specified'}
                </div>
                <p className="text-sm line-clamp-3">{currentProfile.bio || 'No bio provided'}</p>
              </div>

              {/* Compatibility Progress */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Compatibility</span>
                  <span className="text-sm text-muted-foreground">
                    {currentMatch.compatibilityScore}%
                  </span>
                </div>
                <Progress value={currentMatch.compatibilityScore} className="h-2" />
              </div>

              {/* Common Interests */}
              {currentMatch.commonInterests && currentMatch.commonInterests.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Common Interests</h3>
                  <div className="flex flex-wrap gap-1">
                    {currentMatch.commonInterests.map((interest: string) => (
                      <Badge key={interest} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {currentProfile.skills && currentProfile.skills.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-1">
                    {currentProfile.skills.slice(0, 6).map(skill => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Why This Match */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Why This Match?</h3>
                <p className="text-sm text-muted-foreground">{currentMatch.reasonForMatch}</p>
              </div>

              {/* Icebreakers */}
              <div>
                <h3 className="text-sm font-medium mb-2">Conversation Starters</h3>
                <div className="space-y-2">
                  {currentMatch.icebreakers.slice(0, 2).map((icebreaker: string, index: number) => (
                    <div key={index} className="text-xs bg-muted/50 p-2 rounded">
                      Ã°Å¸â€™Â¡ {icebreaker}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={handleUndo}
            disabled={currentIndex === 0 || isAnimating}
          >
            <Undo2 className="h-6 w-6" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-16 w-16 rounded-full border-2 border-red-200 hover:bg-red-50"
            onClick={() => handleSwipe('pass')}
            disabled={isAnimating}
          >
            <X className="h-8 w-8 text-red-500" />
          </Button>

          <Button
            size="icon"
            className="h-20 w-20 rounded-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
            onClick={() => handleSwipe('like')}
            disabled={isAnimating}
          >
            <Heart className="h-10 w-10" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-16 w-16 rounded-full border-2 border-yellow-200 hover:bg-yellow-50"
            onClick={() => handleSwipe('like')} // Super like
            disabled={isAnimating}
          >
            <Star className="h-8 w-8 text-yellow-500" />
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="mt-6 text-center">
          <div className="text-sm text-muted-foreground mb-2">
            {currentIndex + 1} of {matchQueue.length}
          </div>
          <div className="flex justify-center gap-1">
            {matchQueue.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1 w-8 rounded-full transition-colors",
                  index <= currentIndex ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Matches Modal */}
      {showMatches && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Your Matches</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMatches(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto">
              {matches.length > 0 ? (
                <div className="space-y-3">
                  {matches.map(match => {
                    const matchProfile = userProfiles[match.user2Id];
                    if (!matchProfile) return null;
                    return (
                      <div key={match.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(matchProfile.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-medium">{matchProfile.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {match.compatibilityScore}% match
                          </p>
                        </div>
                        <Button size="sm">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No matches yet. Keep swiping!
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}