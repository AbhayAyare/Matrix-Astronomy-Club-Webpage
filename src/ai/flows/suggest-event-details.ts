'use server';

/**
 * @fileOverview An AI tool that suggests engaging titles and descriptions for upcoming events based on keywords.
 *
 * - suggestEventDetails - A function that handles the event title and description generation process.
 * - SuggestEventDetailsInput - The input type for the suggestEventDetails function.
 * - SuggestEventDetailsOutput - The return type for the suggestEventDetails function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SuggestEventDetailsInputSchema = z.object({
  keywords: z
    .string()
    .describe('Keywords related to the event, used to generate titles and descriptions.'),
});
export type SuggestEventDetailsInput = z.infer<typeof SuggestEventDetailsInputSchema>;

const SuggestEventDetailsOutputSchema = z.object({
  title: z.string().describe('An engaging title for the event.'),
  description: z.string().describe('A detailed and appealing description of the event.'),
});
export type SuggestEventDetailsOutput = z.infer<typeof SuggestEventDetailsOutputSchema>;

export async function suggestEventDetails(input: SuggestEventDetailsInput): Promise<SuggestEventDetailsOutput> {
  return suggestEventDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestEventDetailsPrompt',
  input: {
    schema: z.object({
      keywords: z
        .string()
        .describe('Keywords related to the event, used to generate titles and descriptions.'),
    }),
  },
  output: {
    schema: z.object({
      title: z.string().describe('An engaging title for the event.'),
      description: z.string().describe('A detailed and appealing description of the event.'),
    }),
  },
  prompt: `You are an AI assistant designed to generate engaging titles and descriptions for upcoming astronomy club events.

  Based on the provided keywords, suggest a title and a detailed description for the event. The title should be concise and attention-grabbing, while the description should provide comprehensive information about the event.

  Keywords: {{{keywords}}}`,
});

const suggestEventDetailsFlow = ai.defineFlow<
  typeof SuggestEventDetailsInputSchema,
  typeof SuggestEventDetailsOutputSchema
>({
  name: 'suggestEventDetailsFlow',
  inputSchema: SuggestEventDetailsInputSchema,
  outputSchema: SuggestEventDetailsOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
