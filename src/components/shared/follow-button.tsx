'use client';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getFollowStatus, sendConnectionRequest, removeConnection } from '@/app/actions/networking';

interface FollowButtonProps {
  userId: string;
  className?: string;
}

export function FollowButton({ userId, className }: FollowButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const status = await getFollowStatus(userId);
      setIsFollowing(status.isFollowing);
    } catch (error) {
      console.error('Failed to fetch follow status:', error);
    }
  }, [userId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (isFollowing) {
        const res = await removeConnection(userId);
        if (res.success) {
          setIsFollowing(false);
          toast({ title: 'Unfollowed' });
        } else {
          throw new Error(res.error || 'Failed to unfollow');
        }
      } else {
        const res = await sendConnectionRequest(userId);
        if (res.success) {
          setIsFollowing(true);
          toast({ title: 'Following!' });
        } else {
          throw new Error(res.error || 'Failed to follow');
        }
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (isFollowing === null) return (
    <Button variant="outline" size="sm" disabled className={className}>
      <Loader2 className="h-4 w-4 animate-spin" />
    </Button>
  );

  return (
    <Button 
      variant={isFollowing ? "outline" : "default"} 
      size="sm" 
      onClick={handleToggle}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <><UserMinus className="h-4 w-4 mr-2" /> Unfollow</>
      ) : (
        <><UserPlus className="h-4 w-4 mr-2" /> Follow</>
      )}
    </Button>
  );
}


