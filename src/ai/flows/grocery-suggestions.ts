'use server';
/**
 * @fileOverview Provides AI-powered grocery suggestions based on the items in the user's cart.
 *
 * - getGrocerySuggestions - A function that takes cart items as input and returns a list of suggested grocery items.
 * - GrocerySuggestionsInput - The input type for the getGrocerySuggestions function.
 * - GrocerySuggestionsOutput - The return type for the getGrocerySuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GrocerySuggestionsInputSchema = z.object({
  cartItems: z
    .array(z.string())
    .describe('A list of items currently in the user\'s shopping cart.'),
});
export type GrocerySuggestionsInput = z.infer<typeof GrocerySuggestionsInputSchema>;

const GrocerySuggestionsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('A list of grocery item suggestions based on the cart items.'),
});
export type GrocerySuggestionsOutput = z.infer<typeof GrocerySuggestionsOutputSchema>;

export async function getGrocerySuggestions(input: GrocerySuggestionsInput): Promise<GrocerySuggestionsOutput> {
  return grocerySuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'grocerySuggestionsPrompt',
  input: {schema: GrocerySuggestionsInputSchema},
  output: {schema: GrocerySuggestionsOutputSchema},
  prompt: `You are a helpful shopping assistant. Given the current items in the user's cart, suggest other grocery items they might need or enjoy. Be specific and only suggest items that are relevant.

Current Cart Items:
{{#each cartItems}}- {{{this}}}
{{/each}}
`,
});

const grocerySuggestionsFlow = ai.defineFlow(
  {
    name: 'grocerySuggestionsFlow',
    inputSchema: GrocerySuggestionsInputSchema,
    outputSchema: GrocerySuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
