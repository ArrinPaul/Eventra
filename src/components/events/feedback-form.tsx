'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Loader2, CheckCircle2, MessageSquare, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/core/utils/utils';
import { Switch } from '@/components/ui/switch';

interface FeedbackFormProps {
  eventId: Id<"events">;
  eventName: string;
  schema?: Array<{
    id: string;
    question: string;
    type: "rating" | "text" | "boolean";
    required: boolean;
  }>;
  onSuccess?: () => void;
}

export function FeedbackForm({ eventId, eventName, schema = [], onSuccess }: FeedbackFormProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitFeedback = useMutation(api.reviews.submit);

  const handleResponseChange = (id: string, value: any) => {
    setResponses(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: "Rating required", description: "Please select a star rating.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await submitFeedback({
        eventId,
        rating,
        comment,
        responses
      });
      setSubmitted(true);
      toast({ title: "Feedback submitted!", description: "Thank you for helping us improve." });
      onSuccess?.();
    } catch (e) {
      toast({ title: "Error", description: "Failed to submit feedback.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="bg-white/5 border-white/10 text-white text-center py-10">
        <CardContent className="space-y-4">
          <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold">Thank You!</h3>
          <p className="text-gray-400">Your feedback has been recorded successfully.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">Event Feedback</h2>
        <p className="text-gray-400">How was your experience at <strong>{eventName}</strong>?</p>
      </div>

      <Card className="bg-white/5 border-white/10 text-white">
        <CardContent className="p-6 space-y-8">
          {/* Overall Rating */}
          <div className="space-y-4 text-center">
            <Label className="text-lg font-medium">Overall Satisfaction</Label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star 
                    className={cn(
                      "w-10 h-10 transition-colors",
                      star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-600"
                    )} 
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Schema Questions */}
          {schema.length > 0 && (
            <div className="space-y-6 pt-6 border-t border-white/5">
              {schema.map((item) => (
                <div key={item.id} className="space-y-3">
                  <Label className="text-sm font-medium flex gap-1">
                    {item.question}
                    {item.required && <span className="text-red-400">*</span>}
                  </Label>
                  
                  {item.type === 'text' && (
                    <Textarea 
                      placeholder="Your answer..."
                      className="bg-white/5 border-white/10 focus-visible:ring-cyan-500"
                      onChange={(e) => handleResponseChange(item.id, e.target.value)}
                    />
                  )}
                  
                  {item.type === 'rating' && (
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} onClick={() => handleResponseChange(item.id, s)}>
                          <Star className={cn("w-5 h-5", (responses[item.id] || 0) >= s ? "fill-cyan-400 text-cyan-400" : "text-gray-700")} />
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {item.type === 'boolean' && (
                    <div className="flex items-center gap-3">
                      <Switch onCheckedChange={(val) => handleResponseChange(item.id, val)} />
                      <span className="text-sm text-gray-400">{responses[item.id] ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* General Comment */}
          <div className="space-y-3 pt-6 border-t border-white/5">
            <Label className="text-sm font-medium">Additional Comments</Label>
            <Textarea 
              placeholder="Anything else you'd like to share?" 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="bg-white/5 border-white/10 min-h-[100px] focus-visible:ring-cyan-500"
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={submitting || rating === 0}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-6 text-lg font-bold"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
            Submit Feedback
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
