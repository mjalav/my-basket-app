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

// Routes
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

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'cart-service', timestamp: new Date().toISOString() });
});

export default router;
