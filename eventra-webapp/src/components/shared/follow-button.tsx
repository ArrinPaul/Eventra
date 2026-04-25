'use client';
import { Button } from '@/components/ui/button';
import type { Id } from '@/types';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getFollowStatus, sendConnectionRequest, removeConnection } from '@/app/actions/networking';

interface FollowButtonProps {
  userId: Id<"users">;
  className?: string;
}

export function FollowButton({ userId, className }: FollowButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [statusLoaded, setStatusLoaded] = useState(false);

  useEffect(() => {
    getFollowStatus(userId).then((data) => {
      setIsFollowing(data.isFollowing);
      setStatusLoaded(true);
    });
  }, [userId]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (isFollowing) {
        await removeConnection(userId);
        setIsFollowing(false);
        toast({ title: 'Unfollowed' });
      } else {
        await sendConnectionRequest(userId);
        setIsFollowing(true);
        toast({ title: 'Following!' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!statusLoaded) return <Button variant="outline" size="sm" disabled className={className}><Loader2 className="h-4 w-4 animate-spin" /></Button>;

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

