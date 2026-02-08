import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CertificateInputSchema = z.object({
  userName: z.string(),
  eventTitle: z.string(),
  eventDate: z.string(),
  category: z.string(),
});

const CertificateOutputSchema = z.object({
  certificateId: z.string(),
  issueDate: z.string(),
  verificationUrl: z.string(),
  personalizedMessage: z.string(),
});

export const generateCertificateData = ai.defineFlow(
  {
    name: 'generateCertificateData',
    inputSchema: CertificateInputSchema,
    outputSchema: CertificateOutputSchema,
  },
  async (input) => {
    const issueDate = new Date().toLocaleDateString();
    const certId = `CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    const prompt = `You are a professional certification officer for Eventra. 
    Generate a personalized, formal, and congratulatory message for ${input.userName} for completing the event "${input.eventTitle}" (${input.category}).
    
    The message should be 2 sentences long and reflect the value of the event.`;

    const { output } = await ai.generate({
      prompt,
      model: 'googleai/gemini-2.5-flash',
      output: { schema: z.object({ message: z.string() }) }
    });

    return {
      certificateId: certId,
      issueDate,
      verificationUrl: `https://eventra.vercel.app/verify/${certId}`,
      personalizedMessage: output?.message || `Congratulations on completing ${input.eventTitle}!`
    };
  }
);
