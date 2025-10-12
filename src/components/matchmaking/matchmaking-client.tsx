'use client';
import { useState, useEffect } from 'react';
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
  Briefcase
} from 'lucide-react';
import { Match, UserProfile, MatchProfile } from '@/types';
import { matchingService } from '@/lib/firestore-services';
import { cn } from '@/lib/utils';

// Mock data for potential matches
const mockMatches: Match[] = [
  {
    id: 'match-1',
    user1Id: 'current-user',
    user2Id: 'profile-1',
    compatibilityScore: 87,
    matchType: 'teammate',
    status: 'potential',
    createdAt: new Date(),
    icebreakers: [
      "You both are passionate about AI ethics!",
      "Ask about her experience with ML model deployment",
      "Share your thoughts on responsible AI development"
    ],
    commonInterests: ['AI Ethics', 'Machine Learning', 'Python'],
    reasonForMatch: 'High compatibility in technical skills and shared interest in ethical AI development'
  },
  {
    id: 'match-2',
    user1Id: 'current-user',
    user2Id: 'profile-2',
    compatibilityScore: 92,
    matchType: 'cofounder',
    status: 'potential',
    createdAt: new Date(),
    icebreakers: [
      "You both are looking to start a fintech company!",
      "Discuss your startup ideas and vision",
      "Talk about your complementary skills in tech and business"
    ],
    commonInterests: ['Entrepreneurship', 'Fintech', 'Startups'],
    reasonForMatch: 'Perfect co-founder match with complementary skills and shared startup vision'
  },
  {
    id: 'match-3',
    user1Id: 'current-user',
    user2Id: 'profile-3',
    compatibilityScore: 78,
    matchType: 'mentor',
    status: 'potential',
    createdAt: new Date(),
    icebreakers: [
      "She's an expert in areas you want to learn!",
      "Ask about her research methodology",
      "Inquire about career advice in AI research"
    ],
    commonInterests: ['AI Research', 'Academic Career', 'Publications'],
    reasonForMatch: 'Excellent mentor match based on your learning goals and her expertise'
  }
];

const mockUserProfiles: { [key: string]: UserProfile } = {
  'profile-1': {
    id: 'profile-1',
    name: 'Dr. Alice Johnson',
    bio: 'Senior AI Engineer at TechCorp with 8+ years of experience in machine learning and data science. Passionate about ethical AI and mentoring junior developers.',
    location: 'San Francisco, CA',
    skills: ['Python', 'Machine Learning', 'Data Science', 'AI Ethics', 'Leadership'],
    achievements: ['AI Innovation Award 2023', 'Top Speaker at TechConf', '50+ ML Models Deployed'],
    isLookingForTeammate: true,
    isLookingForMentor: false,
    isLookingForCofounder: false,
    mentorshipAreas: ['Machine Learning', 'Career Development', 'Technical Leadership'],
    compatibility: {
      personalityType: 'ENTJ',
      workStyle: 'Collaborative',
      goals: ['Build AI products', 'Mentor others', 'Ethical AI advocacy']
    }
  } as UserProfile,
  'profile-2': {
    id: 'profile-2',
    name: 'Bob Martinez',
    bio: 'MBA graduate with fintech startup experience. Looking for a technical co-founder to build the next generation of financial services.',
    location: 'New York, NY',
    skills: ['Business Development', 'Fintech', 'Strategy', 'Fundraising', 'Product Management'],
    achievements: ['Ex-Goldman Sachs', 'Wharton MBA', 'Raised $2M seed funding'],
    isLookingForTeammate: false,
    isLookingForMentor: false,
    isLookingForCofounder: true,
    mentorshipAreas: [],
    compatibility: {
      personalityType: 'ENFJ',
      workStyle: 'Results-driven',
      goals: ['Launch fintech startup', 'Scale globally', 'Exit in 5 years']
    }
  } as UserProfile,
  'profile-3': {
    id: 'profile-3',
    name: 'Prof. Sarah Chen',
    bio: 'Leading AI researcher at MIT. Published 100+ papers on machine learning and neural networks. Available for mentoring promising researchers.',
    location: 'Boston, MA',
    skills: ['Deep Learning', 'Research', 'Neural Networks', 'Academic Writing', 'Grant Writing'],
    achievements: ['MIT Professor', 'IEEE Fellow', '100+ Publications', 'NSF Grant Recipient'],
    isLookingForTeammate: false,
    isLookingForMentor: false,
    isLookingForCofounder: false,
    mentorshipAreas: ['AI Research', 'Academic Career', 'PhD Guidance', 'Publication Strategy'],
    compatibility: {
      personalityType: 'INTJ',
      workStyle: 'Research-focused',
      goals: ['Advance AI science', 'Mentor next generation', 'Publish groundbreaking research']
    }
  } as UserProfile,
};

export default function MatchmakingClient() {
  const { user } = useAuth();
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [matchQueue, setMatchQueue] = useState<Match[]>(mockMatches);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [showMatches, setShowMatches] = useState(false);

  useEffect(() => {
    if (matchQueue.length > 0) {
      setCurrentMatch(matchQueue[currentIndex]);
    }
  }, [currentIndex, matchQueue]);

  useEffect(() => {
    if (user) {
      loadMatches();
    }
  }, [user]);

  const loadMatches = async () => {
    if (!user) return;
    
    try {
      const userMatches = await matchingService.getUserMatches(user.id);
      if (userMatches.length > 0) {
        setMatchQueue(userMatches);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };

  const handleSwipe = async (action: 'like' | 'pass') => {
    if (!currentMatch || isAnimating) return;

    setIsAnimating(true);
    setSwipeDirection(action === 'like' ? 'right' : 'left');

    try {
      const isMatch = await matchingService.swipeUser(currentMatch.id, user?.id || '', action);
      
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
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-pink-600 bg-pink-100';
    }
  };

  if (!currentMatch || currentIndex >= matchQueue.length) {
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

  const profile = mockUserProfiles[currentMatch.user2Id];

  if (!profile) {
    return <div>Loading...</div>;
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
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
            </div>

            <CardContent className="p-6">
              {/* Profile Info */}
              <div className="mb-4">
                <h2 className="text-2xl font-bold mb-1">{profile.name}</h2>
                <div className="flex items-center text-muted-foreground text-sm mb-3">
                  <MapPin className="h-4 w-4 mr-1" />
                  {profile.location}
                </div>
                <p className="text-sm line-clamp-3">{profile.bio}</p>
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
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Common Interests</h3>
                <div className="flex flex-wrap gap-1">
                  {currentMatch.commonInterests.map(interest => (
                    <Badge key={interest} variant="secondary" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Skills</h3>
                <div className="flex flex-wrap gap-1">
                  {profile.skills.slice(0, 6).map(skill => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Why This Match */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Why This Match?</h3>
                <p className="text-sm text-muted-foreground">{currentMatch.reasonForMatch}</p>
              </div>

              {/* Icebreakers */}
              <div>
                <h3 className="text-sm font-medium mb-2">Conversation Starters</h3>
                <div className="space-y-2">
                  {currentMatch.icebreakers.slice(0, 2).map((icebreaker, index) => (
                    <div key={index} className="text-xs bg-muted/50 p-2 rounded">
                      💡 {icebreaker}
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
                    const matchProfile = mockUserProfiles[match.user2Id];
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