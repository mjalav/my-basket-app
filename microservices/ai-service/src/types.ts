export interface GrocerySuggestionsInput {
  cartItems: string[];
}

export interface GrocerySuggestionsOutput {
  suggestions: string[];
}

export interface RecommendationRequest {
  cartItems: string[];
  userId?: string;
  maxSuggestions?: number;
}

export interface RecommendationResponse {
  suggestions: string[];
  confidence: number;
  userId?: string;
  generatedAt: Date;
}
