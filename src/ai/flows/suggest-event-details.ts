'use server';
/**
 * @fileOverview AI flow to suggest event titles and descriptions based on keywords.
 *
 * - suggestEventDetails - A function that generates event title and description.
 * - SuggestEventDetailsInput - The input type for the suggestEventDetails function.
 * - SuggestEventDetailsOutput - The return type for the suggestEventDetails function.
 */

import { ai } from '@/ai/ai-instance'; // Corrected import path
import { z } from 'genkit';

export const SuggestEventDetailsInputSchema = z.object({
  keywords: z.string().describe('Keywords related to the event, e.g., "solar eclipse viewing, public park"'),
});
export type SuggestEventDetailsInput = z.infer<typeof SuggestEventDetailsInputSchema>;

export const SuggestEventDetailsOutputSchema = z.object({
  title: z.string().describe('An engaging and concise title for the event.'),
  description: z.string().describe('A compelling and informative description for the event (around 2-3 sentences).'),
});
export type SuggestEventDetailsOutput = z.infer<typeof SuggestEventDetailsOutputSchema>;

export async function suggestEventDetails(input: SuggestEventDetailsInput): Promise<SuggestEventDetailsOutput> {
  return suggestEventDetailsFlow(input);
}

const suggestEventDetailsPrompt = ai.definePrompt({
  name: 'suggestEventDetailsPrompt',
  input: { schema: SuggestEventDetailsInputSchema },
  output: { schema: SuggestEventDetailsOutputSchema },
  prompt: `You are an expert event planner for an astronomy club.
Given the following keywords: {{{keywords}}}, generate an engaging event title and a short, compelling description (2-3 sentences).
Ensure the title is catchy and relevant to astronomy.
The description should be informative and encourage attendance.
Provide the output in the specified JSON format.
`,
});

const suggestEventDetailsFlow = ai.defineFlow(
  {
    name: 'suggestEventDetailsFlow',
    inputSchema: SuggestEventDetailsInputSchema,
    outputSchema: SuggestEventDetailsOutputSchema,
  },
  async (input) => {
    const { output } = await suggestEventDetailsPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate event details.');
    }
    return output;
  }
);
