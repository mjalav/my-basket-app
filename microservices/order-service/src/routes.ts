import express, { Request, Response } from 'express';
import { OrderService } from './service';
import { OrderStatus } from './types';
import { z } from 'zod';

const router = express.Router();
const orderService = new OrderService();

// Validation schemas
const AddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  country: z.string().min(1),
});

const PaymentMethodSchema = z.object({
  type: z.enum(['credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay']),
  last4: z.string().optional(),
  brand: z.string().optional(),
});

const CartItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().positive(),
  description: z.string(),
  image: z.string(),
  dataAiHint: z.string(),
  quantity: z.number().positive(),
});

const CreateOrderSchema = z.object({
  items: z.array(CartItemSchema).min(1),
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema,
  paymentMethod: PaymentMethodSchema,
});

const UpdateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  trackingNumber: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  actualDelivery: z.string().optional(),
});

const OrderFiltersSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const PaginationSchema = z.object({
  page: z.coerce.number().positive().optional(),
  limit: z.coerce.number().positive().max(100).optional(),
});

// Routes
router.post('/orders/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const orderData = CreateOrderSchema.parse(req.body);
    
    const order = await orderService.createOrder(userId, orderData);
    res.status(201).json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid order data', details: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/orders/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const filters = OrderFiltersSchema.parse(req.query);
    const pagination = PaginationSchema.parse(req.query);
    
    const result = await orderService.getUserOrders(userId, filters, pagination);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
    }
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/orders/:userId/:orderId', async (req: Request, res: Response) => {
  try {
    const { userId, orderId } = req.params;
    const order = await orderService.getOrderById(userId, orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/orders/:userId/:orderId/status', async (req: Request, res: Response) => {
  try {
    const { userId, orderId } = req.params;
    const updateData = UpdateOrderStatusSchema.parse(req.body);
    
    const order = await orderService.updateOrderStatus(userId, orderId, updateData);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid update data', details: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/orders/:userId/:orderId/cancel', async (req: Request, res: Response) => {
  try {
    const { userId, orderId } = req.params;
    const order = await orderService.cancelOrder(userId, orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'order-service', timestamp: new Date().toISOString() });
});

export default router;
