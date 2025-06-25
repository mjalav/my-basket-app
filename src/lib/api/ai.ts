import { apiClient } from './client';

export interface GrocerySuggestionsInput {
  cartItems: string[];
}

export interface GrocerySuggestionsOutput {
  suggestions: string[];
  generatedAt?: string;
  confidence?: number;
}

export interface PersonalizedRecommendationsInput {
  cartItems: string[];
  userId?: string;
  maxSuggestions?: number;
}

export interface PersonalizedRecommendationsOutput {
  suggestions: string[];
  userId?: string;
  generatedAt: string;
  confidence: number;
}

export class AIService {
  async getGrocerySuggestions(input: GrocerySuggestionsInput): Promise<GrocerySuggestionsOutput> {
    return apiClient.post<GrocerySuggestionsOutput>('/api/recommendations/grocery-suggestions', input);
  }

  async getPersonalizedRecommendations(
    input: PersonalizedRecommendationsInput
  ): Promise<PersonalizedRecommendationsOutput> {
    return apiClient.post<PersonalizedRecommendationsOutput>('/api/recommendations/personalized', input);
  }

  // Legacy method for compatibility
  async getGrocerySuggestionsLegacy(input: GrocerySuggestionsInput): Promise<GrocerySuggestionsOutput> {
    return apiClient.post<GrocerySuggestionsOutput>('/api/grocery-suggestions', input);
  }
}

export const aiService = new AIService();
