import { GrocerySuggestionsInput, GrocerySuggestionsOutput } from './types';

export class AIService {
  private suggestionRules: Map<string, string[]> = new Map([
    // Fruits
    ['apples', ['bananas', 'oranges', 'grapes', 'strawberries']],
    ['bananas', ['apples', 'peanut butter', 'honey', 'oats']],
    ['oranges', ['apples', 'lemons', 'limes', 'grapefruits']],
    
    // Vegetables
    ['spinach', ['kale', 'lettuce', 'carrots', 'tomatoes']],
    ['carrots', ['celery', 'onions', 'potatoes', 'broccoli']],
    ['tomatoes', ['basil', 'mozzarella', 'onions', 'garlic']],
    
    // Proteins
    ['chicken', ['rice', 'broccoli', 'carrots', 'garlic']],
    ['eggs', ['bread', 'butter', 'cheese', 'bacon']],
    ['beef', ['potatoes', 'onions', 'carrots', 'mushrooms']],
    
    // Dairy
    ['milk', ['cereal', 'cookies', 'bread', 'eggs']],
    ['cheese', ['crackers', 'wine', 'grapes', 'bread']],
    ['yogurt', ['berries', 'granola', 'honey', 'nuts']],
    
    // Grains
    ['rice', ['soy sauce', 'vegetables', 'chicken', 'garlic']],
    ['bread', ['butter', 'jam', 'cheese', 'lunch meat']],
    ['pasta', ['tomato sauce', 'parmesan', 'garlic', 'olive oil']],
    
    // Condiments & Seasonings
    ['olive oil', ['garlic', 'herbs', 'vegetables', 'pasta']],
    ['garlic', ['onions', 'tomatoes', 'herbs', 'olive oil']],
    ['salt', ['pepper', 'herbs', 'spices', 'seasoning']],
  ]);

  async getGrocerySuggestions(input: GrocerySuggestionsInput): Promise<GrocerySuggestionsOutput> {
    const { cartItems } = input;
    
    if (!cartItems || cartItems.length === 0) {
      return { suggestions: this.getGenericSuggestions() };
    }

    const suggestions = new Set<string>();
    
    // Generate suggestions based on cart items
    for (const item of cartItems) {
      const itemLower = item.toLowerCase();
      
      // Direct match
      if (this.suggestionRules.has(itemLower)) {
        const directSuggestions = this.suggestionRules.get(itemLower)!;
        directSuggestions.forEach(suggestion => {
          if (!this.isItemInCart(suggestion, cartItems)) {
            suggestions.add(suggestion);
          }
        });
      }
      
      // Partial match
      for (const [key, values] of this.suggestionRules.entries()) {
        if (itemLower.includes(key) || key.includes(itemLower)) {
          values.forEach(suggestion => {
            if (!this.isItemInCart(suggestion, cartItems)) {
              suggestions.add(suggestion);
            }
          });
        }
      }
    }

    // If no suggestions found, provide generic ones
    if (suggestions.size === 0) {
      return { suggestions: this.getGenericSuggestions() };
    }

    // Convert to array and limit to 8 suggestions
    const suggestionArray = Array.from(suggestions).slice(0, 8);
    
    return { suggestions: suggestionArray };
  }

  private isItemInCart(suggestion: string, cartItems: string[]): boolean {
    return cartItems.some(item => 
      item.toLowerCase().includes(suggestion.toLowerCase()) ||
      suggestion.toLowerCase().includes(item.toLowerCase())
    );
  }

  private getGenericSuggestions(): string[] {
    return [
      'Fresh fruits',
      'Vegetables',
      'Whole grain bread',
      'Lean proteins',
      'Dairy products',
      'Healthy snacks',
      'Cooking oils',
      'Seasonings and spices'
    ];
  }

  // Advanced recommendation based on user patterns (placeholder for ML integration)
  async getPersonalizedRecommendations(
    cartItems: string[],
    userId?: string,
    maxSuggestions: number = 6
  ): Promise<string[]> {
    // In a real implementation, this would use ML models, user history, etc.
    const basicSuggestions = await this.getGrocerySuggestions({ cartItems });
    
    // Add some personalization logic (simplified)
    const enhancedSuggestions = this.addPersonalizationLayer(
      basicSuggestions.suggestions,
      userId,
      cartItems
    );

    return enhancedSuggestions.slice(0, maxSuggestions);
  }

  private addPersonalizationLayer(
    suggestions: string[],
    userId?: string,
    cartItems?: string[]
  ): string[] {
    // Simplified personalization - in real app, this would use user data
    const personalizedSuggestions = [...suggestions];
    
    // Add seasonal recommendations
    const currentMonth = new Date().getMonth();
    if (currentMonth >= 2 && currentMonth <= 4) { // Spring
      personalizedSuggestions.unshift('Spring vegetables', 'Fresh herbs');
    } else if (currentMonth >= 5 && currentMonth <= 7) { // Summer
      personalizedSuggestions.unshift('Summer fruits', 'Grilling items');
    } else if (currentMonth >= 8 && currentMonth <= 10) { // Fall
      personalizedSuggestions.unshift('Autumn produce', 'Comfort foods');
    } else { // Winter
      personalizedSuggestions.unshift('Winter vegetables', 'Warm beverages');
    }

    return personalizedSuggestions;
  }
}
