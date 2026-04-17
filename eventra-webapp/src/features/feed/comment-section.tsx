'use client';
// 
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function CommentSection({ postId }: { postId: string }) {
  const comments: any[] = [];
  const addComment = async (_args: any) => Promise.resolve();
  
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
    <div className="mt-4 pt-4 border-t border-border/60 space-y-4">
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
              <div className="flex-1 bg-muted/40 rounded-2xl px-4 py-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-primary">{comment.authorName}</span>
                  <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(comment.createdAt)} ago</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && <p className="text-center text-xs text-muted-foreground py-2">No comments yet. Be the first to reply!</p>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 pt-2">
        <Input 
          placeholder="Write a comment..." 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="bg-muted/40 border-border h-9 text-xs rounded-full"
        />
        <Button 
          type="submit" 
          size="icon" 
          className="h-9 w-9 rounded-full bg-primary hover:bg-primary" 
          disabled={isSubmitting || !content.trim()}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}


