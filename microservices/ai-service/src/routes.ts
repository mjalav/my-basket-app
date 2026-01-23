import express, { Request, Response } from 'express';
import { AIService } from './service';
import { z } from 'zod';

const router = express.Router();
const aiService = new AIService();

/**
 * @swagger
 * /api/recommendations/health:
 *   get:
 *     summary: Health check
 *     description: Check if the AI service is healthy
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get('/recommendations/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'ai-service', timestamp: new Date().toISOString() });
});

// Validation schemas
const GrocerySuggestionsSchema = z.object({
  cartItems: z.array(z.string()).default([]),
});

const PersonalizedRecommendationsSchema = z.object({
  cartItems: z.array(z.string()).default([]),
  userId: z.string().optional(),
  maxSuggestions: z.number().positive().max(20).optional().default(6),
});

/**
 * @swagger
 * /api/recommendations/grocery-suggestions:
 *   post:
 *     summary: Get grocery suggestions
 *     description: Get AI-powered grocery suggestions based on cart items
 *     tags: [Recommendations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GrocerySuggestionsRequest'
 *     responses:
 *       200:
 *         description: Suggestions generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GrocerySuggestionsResponse'
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/recommendations/personalized:
 *   post:
 *     summary: Get personalized recommendations
 *     description: Get personalized product recommendations based on user history and cart
 *     tags: [Recommendations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PersonalizedRecommendationsRequest'
 *     responses:
 *       200:
 *         description: Recommendations generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PersonalizedRecommendationsResponse'
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */
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

// Health check moved to top

export default router;
