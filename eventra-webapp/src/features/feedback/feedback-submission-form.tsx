'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { submitEventFeedback } from '@/app/actions/feedback';
import { 
  Star, 
  Send, 
  Loader2, 
  CheckCircle2, 
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

interface FeedbackSubmissionFormProps {
  eventId: string;
  eventTitle: string;
  template: {
    title: string;
    description: string;
    questions: any[];
  };
}

export function FeedbackSubmissionForm({ eventId, eventTitle, template }: FeedbackSubmissionFormProps) {
  const { toast } = useToast();
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({ title: "Rating Required", description: "Please provide an overall rating.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitEventFeedback({
        eventId,
        rating,
        comment,
        responses,
      });
      setIsSubmitted(true);
      toast({ title: "Feedback Submitted", description: "Thank you for sharing your thoughts!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="bg-white/5 border-white/10 text-white text-center py-12">
        <CardContent className="space-y-6">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
            <CheckCircle2 className="h-20 w-20 text-emerald-500 relative z-10 mx-auto" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black">Thank You!</h2>
            <p className="text-gray-400">Your feedback helps us make future events even better.</p>
          </div>
          <Button asChild className="bg-white/10 hover:bg-white/20 border-white/10">
            <a href="/explore">Explore More Events</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-white">{template.title}</h1>
        <p className="text-gray-400">{template.description}</p>
        <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold mt-2">
          Event: {eventTitle}
        </div>
      </div>

      <Card className="bg-white/5 border-white/10 text-white shadow-2xl">
        <CardHeader className="border-b border-white/5">
          <CardTitle className="text-lg">Overall Experience</CardTitle>
          <CardDescription>How would you rate the event as a whole?</CardDescription>
        </CardHeader>
        <CardContent className="pt-8 pb-10 flex flex-col items-center gap-6">
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={cn(
                  "p-2 transition-all transform hover:scale-110",
                  rating >= star ? "text-amber-400" : "text-gray-600"
                )}
              >
                <Star className="h-10 w-10 fill-current" />
              </button>
            ))}
          </div>
          <div className="text-sm font-bold uppercase tracking-widest text-gray-500">
            {rating === 1 && "Poor"}
            {rating === 2 && "Fair"}
            {rating === 3 && "Good"}
            {rating === 4 && "Very Good"}
            {rating === 5 && "Excellent"}
            {rating === 0 && "Select a Rating"}
          </div>
        </CardContent>
      </Card>

      {template.questions.map((q, i) => (
        <Card key={q.id} className="bg-white/5 border-white/10 text-white">
          <CardHeader>
            <CardTitle className="text-base flex items-start gap-3">
              <span className="text-cyan-500 font-mono text-sm pt-0.5">{i + 1}.</span>
              {q.label} {q.required && <span className="text-red-500">*</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {q.type === 'rating' && (
              <RadioGroup 
                onValueChange={(val) => handleResponseChange(q.id, parseInt(val))}
                className="flex gap-4"
              >
                {[1, 2, 3, 4, 5].map((val) => (
                  <div key={val} className="flex flex-col items-center gap-2">
                    <RadioGroupItem value={val.toString()} id={`${q.id}-${val}`} className="border-white/20" />
                    <Label htmlFor={`${q.id}-${val}`} className="text-xs">{val}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {q.type === 'text' && (
              <Textarea 
                placeholder="Type your answer here..."
                className="bg-white/5 border-white/10 min-h-[100px]"
                onChange={(e) => handleResponseChange(q.id, e.target.value)}
                required={q.required}
              />
            )}

            {q.type === 'choice' && (
              <RadioGroup 
                onValueChange={(val) => handleResponseChange(q.id, val)}
                className="space-y-3"
              >
                {q.options?.map((opt: string, idx: number) => (
                  <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <RadioGroupItem value={opt} id={`${q.id}-${idx}`} className="border-white/20" />
                    <Label htmlFor={`${q.id}-${idx}`} className="flex-1 cursor-pointer">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </CardContent>
        </Card>
      ))}

      <Card className="bg-white/5 border-white/10 text-white">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-cyan-500" />
            Additional Comments (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea 
            placeholder="Anything else you'd like to share?"
            className="bg-white/5 border-white/10 min-h-[120px]"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </CardContent>
      </Card>

      <Button 
        type="submit" 
        className="w-full h-14 text-lg font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-xl shadow-cyan-900/20"
        disabled={isSubmitting}
      >
        {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
        Submit Feedback
      </Button>
    </form>
  );
}
