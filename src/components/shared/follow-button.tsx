'use client';

import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface FollowButtonProps {
  userId: Id<"users">;
  className?: string;
}

export function FollowButton({ userId, className }: FollowButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const stats = useQuery(api.users.getFollowStats, { userId });
  const follow = useMutation(api.users.follow);
  const unfollow = useMutation(api.users.unfollow);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (stats?.isFollowing) {
        await unfollow({ followingId: userId });
        toast({ title: 'Unfollowed' });
      } else {
        await follow({ followingId: userId });
        toast({ title: 'Following! 🎉' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (stats === undefined) return <Button variant="outline" size="sm" disabled className={className}><Loader2 className="h-4 w-4 animate-spin" /></Button>;

  return (
    <Button 
      variant={stats.isFollowing ? "outline" : "default"} 
      size="sm" 
      onClick={handleToggle}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : stats.isFollowing ? (
        <><UserMinus className="h-4 w-4 mr-2" /> Unfollow</>
      ) : (
        <><UserPlus className="h-4 w-4 mr-2" /> Follow</>
      )}
    </Button>
  );
}
