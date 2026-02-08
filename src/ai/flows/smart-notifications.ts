import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SmartNotificationInputSchema = z.object({
  userName: z.string(),
  userInterests: z.array(z.string()),
  upcomingEvents: z.array(z.object({
    title: z.string(),
    category: z.string(),
    startDate: z.number(),
  })),
});

const SmartNotificationOutputSchema = z.object({
  notifications: z.array(z.object({
    title: z.string(),
    message: z.string(),
    type: z.enum(['event_reminder', 'personalized_pick', 'engagement']),
  })),
});

export type SmartNotificationInput = z.infer<typeof SmartNotificationInputSchema>;
export type SmartNotificationOutput = z.infer<typeof SmartNotificationOutputSchema>;

export const generateSmartNotifications = ai.defineFlow(
  {
    name: 'generateSmartNotifications',
    inputSchema: SmartNotificationInputSchema,
    outputSchema: SmartNotificationOutputSchema,
  },
  async (input) => {
    const prompt = `You are an AI notification specialist for Eventra. 
    Generate 2-3 personalized, engaging notifications for ${input.userName}.
    
    User Interests: ${input.userInterests.join(', ')}
    Upcoming Events: ${JSON.stringify(input.upcomingEvents)}
    
    Notification Types:
    1. event_reminder: For events they might be interested in based on their interests.
    2. personalized_pick: A specific event that's a perfect match.
    3. engagement: Encouraging them to explore the community.
    
    Make the messages short, punchy, and use emojis. Return a list of notifications.`;

    const { output } = await ai.generate({
      prompt,
      model: 'googleai/gemini-2.5-flash',
      output: { schema: SmartNotificationOutputSchema }
    });

    return output || { notifications: [] };
  }
);
