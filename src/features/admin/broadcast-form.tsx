'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { sendBroadcastEmail } from '@/core/actions/actions';
import type { User } from '@/types';
import { Loader2, Send } from 'lucide-react';

const formSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters."),
  body: z.string().min(20, "Body must be at least 20 characters."),
});

type BroadcastFormValues = z.infer<typeof formSchema>;

interface BroadcastFormProps {
    recipients: User[];
}

export default function BroadcastForm({ recipients }: BroadcastFormProps) {
  const { toast } = useToast();
  const form = useForm<BroadcastFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: '',
      body: '',
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: BroadcastFormValues) {
    try {
      const result = await sendBroadcastEmail({ 
        ...values,
        recipients: recipients.map(r => ({ name: r.name, email: r.email })),
      });

      if (result.success) {
        toast({
            title: result.provider === 'none' ? 'Broadcast Simulated' : 'Broadcast Sent!',
            description: result.provider === 'none' 
              ? `Your message was logged to the console for ${result.sentCount} recipients.`
              : `Your message has been sent to ${result.sentCount} attendees via ${result.provider}.`,
        });
        form.reset();
      } else {
        throw new Error('Flow reported failure.');
      }
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Broadcast Failed',
            description: 'There was an error sending the broadcast. Check the server console for details.',
        });
    }
  }

  return (
    <Card className="glass-effect sticky top-20">
        <CardHeader>
            <CardTitle className="font-headline">Broadcast Email</CardTitle>
            <CardDescription>Send a message to all selected attendees using the configured email provider.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Important Schedule Update" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Body</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Hi everyone, ..." {...field} rows={8} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
                  Send Broadcast to {recipients.length} attendees
                </Button>
              </form>
            </Form>
        </CardContent>
    </Card>
  );
}
