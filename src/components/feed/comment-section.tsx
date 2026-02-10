'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function CommentSection({ postId }: { postId: string }) {
  const comments = useQuery(api.posts.getComments, { postId: postId as any });
  const addComment = useMutation(api.posts.addComment);
  
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await addComment({ postId: postId as any, content });
      setContent('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
      {comments === undefined ? (
        <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin opacity-50" /></div>
      ) : (
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {comments.map((comment: any) => (
            <div key={comment._id} className="flex gap-3 text-sm">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.authorImage} />
                <AvatarFallback>{comment.authorName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-white/5 rounded-2xl px-4 py-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-cyan-400">{comment.authorName}</span>
                  <span className="text-[10px] text-gray-500">{formatDistanceToNow(comment.createdAt)} ago</span>
                </div>
                <p className="text-gray-300 leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && <p className="text-center text-xs text-gray-500 py-2">No comments yet. Be the first to reply!</p>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 pt-2">
        <Input 
          placeholder="Write a comment..." 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="bg-white/5 border-white/10 h-9 text-xs rounded-full"
        />
        <Button 
          type="submit" 
          size="icon" 
          className="h-9 w-9 rounded-full bg-cyan-600 hover:bg-cyan-500" 
          disabled={isSubmitting || !content.trim()}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
