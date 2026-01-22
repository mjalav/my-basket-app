import express, { Request, Response } from 'express';
import { CartService } from './service';
import { z } from 'zod';

const router = express.Router();
const cartService = new CartService();

// Validation schemas
const AddToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive().optional().default(1),
});

const UpdateCartItemSchema = z.object({
  quantity: z.number().min(0),
});

const UserIdSchema = z.object({
  userId: z.string().min(1),
});

// Middleware to validate userId
const validateUserId = (req: Request, res: Response, next: express.NextFunction) => {
  try {
    const { userId } = UserIdSchema.parse(req.params);
    req.params.userId = userId;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid user ID', details: error.errors });
    }
    next(error);
  }
};

/**
 * @swagger
 * /api/cart/{userId}:
 *   get:
 *     summary: Get user's cart
 *     description: Retrieve the shopping cart for a specific user
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Invalid user ID
 *       500:
 *         description: Internal server error
 */
router.get('/cart/:userId', validateUserId, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const cart = await cartService.getCart(userId);
    res.json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/cart/{userId}/items:
 *   post:
 *     summary: Add item to cart
 *     description: Add a product to the user's shopping cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddToCartRequest'
 *     responses:
 *       200:
 *         description: Item added to cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.post('/cart/:userId/items', validateUserId, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { productId, quantity } = AddToCartSchema.parse(req.body);
    
    const cart = await cartService.addToCart(userId, productId, quantity);
    res.json(cart);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    if (error instanceof Error && error.message === 'Product not found') {
      return res.status(404).json({ error: 'Product not found' });
    }
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/cart/:userId/items/:productId', validateUserId, async (req: Request, res: Response) => {
  try {
    const { userId, productId } = req.params;
    const { quantity } = UpdateCartItemSchema.parse(req.body);
    
    const cart = await cartService.updateCartItem(userId, productId, quantity);
    res.json(cart);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    if (error instanceof Error && error.message === 'Item not found in cart') {
      return res.status(404).json({ error: 'Item not found in cart' });
    }
    console.error('Error updating cart item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/cart/:userId/items/:productId', validateUserId, async (req: Request, res: Response) => {
  try {
    const { userId, productId } = req.params;
    const cart = await cartService.removeFromCart(userId, productId);
    res.json(cart);
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/cart/:userId', validateUserId, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const cart = await cartService.clearCart(userId);
    res.json(cart);
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/cart/:userId/summary', validateUserId, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const summary = await cartService.getCartSummary(userId);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching cart summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

import { HealthCheckService } from './health-check.service';

const healthCheckService = new HealthCheckService();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Comprehensive health check
 *     description: Check service health including dependencies and resources
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *       503:
 *         description: Service is unhealthy
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await healthCheckService.checkHealth(cartService);
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'cart-service',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

/**
 * @swagger
 * /api/health/live:
 *   get:
 *     summary: Liveness probe
 *     description: Check if service is alive
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get('/health/live', async (req: Request, res: Response) => {
  try {
    const health = await healthCheckService.checkLiveness();
    res.status(200).json(health);
  } catch (error) {
    console.error('Liveness check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'cart-service',
      timestamp: new Date().toISOString(),
      error: 'Liveness check failed',
    });
  }
});

/**
 * @swagger
 * /api/health/ready:
 *   get:
 *     summary: Readiness probe
 *     description: Check if service is ready to handle traffic
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready
 */
router.get('/health/ready', async (req: Request, res: Response) => {
  try {
    const health = await healthCheckService.checkReadiness(cartService);
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Readiness check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'cart-service',
      timestamp: new Date().toISOString(),
      error: 'Readiness check failed',
    });
  }
});

export default router;
