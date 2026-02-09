'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Send, 
  ThumbsUp, 
  CheckCircle2, 
  HelpCircle,
  Clock,
  Reply,
  MoreVertical
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/core/utils/utils';

interface EventDiscussionBoardProps {
  eventId: Id<"events">;
}

export function EventDiscussionBoard({ eventId }: EventDiscussionBoardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [isQuestion, setIsQuestion] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const messages = useQuery(api.discussions.listByEvent, { eventId }) || [];
  const createMessage = useMutation(api.discussions.create);
  const likeMessage = useMutation(api.discussions.like);
  const markAsAnswered = useMutation(api.discussions.markAsAnswered);

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;
    setSubmitting(true);
    try {
      await createMessage({
        eventId,
        content: content.trim(),
        isQuestion,
      });
      setContent('');
      setIsQuestion(false);
      toast({ title: 'Message posted' });
    } catch (e) {
      toast({ title: 'Failed to post', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Input Area */}
      <Card className="bg-white/5 border-white/10 text-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={user?.image} />
              <AvatarFallback className="bg-cyan-500/10 text-cyan-500">{user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <Textarea 
                placeholder="Ask a question or share a thought..." 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-white/5 border-white/10 min-h-[100px] resize-none focus-visible:ring-cyan-500"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsQuestion(!isQuestion)}
                    className={cn(
                      "h-8 rounded-full text-xs transition-all",
                      isQuestion ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30" : "text-gray-500 hover:bg-white/5"
                    )}
                  >
                    <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
                    Mark as Question
                  </Button>
                </div>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!content.trim() || submitting || !user}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-full px-6"
                >
                  {submitting ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Post
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
            <MessageSquare size={48} className="mx-auto mb-4 text-gray-700 opacity-20" />
            <h3 className="text-lg font-bold text-gray-500">No discussions yet</h3>
            <p className="text-sm text-gray-600">Be the first to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg._id} className={cn(
              "p-6 rounded-2xl border transition-all",
              msg.isQuestion 
                ? msg.isAnswered 
                  ? "bg-green-500/5 border-green-500/20" 
                  : "bg-amber-500/5 border-amber-500/20"
                : "bg-white/5 border-white/10"
            )}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={msg.authorImage} />
                    <AvatarFallback className="bg-white/10 text-white text-xs">{msg.authorName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">{msg.authorName}</p>
                      <Badge variant="outline" className="text-[8px] h-4 py-0 uppercase tracking-tighter opacity-50">{msg.authorRole}</Badge>
                    </div>
                    <p className="text-[10px] text-gray-500">{formatDistanceToNow(msg.createdAt, { addSuffix: true })}</p>
                  </div>
                </div>
                {msg.isQuestion && (
                  <Badge variant="outline" className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-2 py-0",
                    msg.isAnswered ? "bg-green-500 text-black border-0" : "bg-amber-500 text-black border-0"
                  )}>
                    {msg.isAnswered ? "Resolved" : "Question"}
                  </Badge>
                )}
              </div>

              <div className="pl-12">
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                
                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/5">
                  <button 
                    onClick={() => likeMessage({ id: msg._id })}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-cyan-400 transition-colors"
                  >
                    <ThumbsUp size={14} className={msg.likes > 0 ? "text-cyan-400 fill-cyan-400/20" : ""} />
                    {msg.likes > 0 && <span>{msg.likes}</span>}
                    <span>Helpful</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
                    <Reply size={14} />
                    Reply
                  </button>
                  {msg.isQuestion && !msg.isAnswered && (
                    <button 
                      onClick={() => markAsAnswered({ id: msg._id })}
                      className="ml-auto flex items-center gap-1.5 text-xs text-green-500/70 hover:text-green-400 transition-colors"
                    >
                      <CheckCircle2 size={14} />
                      Mark as Answered
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
