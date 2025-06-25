import express, { Request, Response } from 'express';
import { AIService } from './service';
import { z } from 'zod';

const router = express.Router();
const aiService = new AIService();

// Validation schemas
const GrocerySuggestionsSchema = z.object({
  cartItems: z.array(z.string()).default([]),
});

const PersonalizedRecommendationsSchema = z.object({
  cartItems: z.array(z.string()).default([]),
  userId: z.string().optional(),
  maxSuggestions: z.number().positive().max(20).optional().default(6),
});

// Routes
router.post('/recommendations/grocery-suggestions', async (req: Request, res: Response) => {
  try {
    const input = GrocerySuggestionsSchema.parse(req.body);
    const result = await aiService.getGrocerySuggestions(input);
    
    res.json({
      ...result,
      generatedAt: new Date().toISOString(),
      confidence: 0.8, // Mock confidence score
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Error generating grocery suggestions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/recommendations/personalized', async (req: Request, res: Response) => {
  try {
    const input = PersonalizedRecommendationsSchema.parse(req.body);
    const suggestions = await aiService.getPersonalizedRecommendations(
      input.cartItems,
      input.userId,
      input.maxSuggestions
    );
    
    res.json({
      suggestions,
      userId: input.userId,
      generatedAt: new Date().toISOString(),
      confidence: 0.85, // Mock confidence score
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Error generating personalized recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Legacy endpoint for compatibility
router.post('/grocery-suggestions', async (req: Request, res: Response) => {
  try {
    const input = GrocerySuggestionsSchema.parse(req.body);
    const result = await aiService.getGrocerySuggestions(input);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Error generating grocery suggestions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'ai-service', timestamp: new Date().toISOString() });
});

export default router;
