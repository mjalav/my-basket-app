import request from 'supertest';
import express from 'express';
import { OrderStatus } from './types';

// Mock the service module before importing routes
const mockCreateOrder = jest.fn();
const mockGetUserOrders = jest.fn();
const mockGetOrderById = jest.fn();
const mockUpdateOrderStatus = jest.fn();
const mockCancelOrder = jest.fn();

jest.mock('./service', () => {
  return {
    OrderService: jest.fn().mockImplementation(() => {
      return {
        createOrder: mockCreateOrder,
        getUserOrders: mockGetUserOrders,
        getOrderById: mockGetOrderById,
        updateOrderStatus: mockUpdateOrderStatus,
        cancelOrder: mockCancelOrder,
      };
    }),
  };
});

import router from './routes';

const app = express();
app.use(express.json());
app.use('/api', router);

describe('GET /api/orders/health', () => {
  it('should return healthy status', async () => {
    const res = await request(app).get('/api/orders/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('service', 'order-service');
    expect(res.body).toHaveProperty('timestamp');
  });
});

describe('POST /api/orders/:userId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new order', async () => {
    mockCreateOrder.mockResolvedValue({ id: 'order1', status: OrderStatus.PENDING });
    const res = await request(app)
      .post('/api/orders/test-user')
      .send({
        items: [{ id: 'item1', name: 'Test', price: 10, description: '', image: '', dataAiHint: '', quantity: 1 }],
        shippingAddress: { street: 'A', city: 'B', state: 'C', zipCode: '123', country: 'X' },
        billingAddress: { street: 'A', city: 'B', state: 'C', zipCode: '123', country: 'X' },
        paymentMethod: { type: 'credit_card' }
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 'order1');
    expect(res.body).toHaveProperty('status', OrderStatus.PENDING);
  });

  it('should return 400 for invalid order data', async () => {
    const res = await request(app)
      .post('/api/orders/test-user')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/orders/:userId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return user orders', async () => {
    mockGetUserOrders.mockResolvedValue([{ id: 'order1' }]);
    const res = await request(app).get('/api/orders/test-user');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should return 400 for invalid query', async () => {
    const res = await request(app).get('/api/orders/test-user').query({ page: 'not-a-number' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/orders/:userId/:orderId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return order by id', async () => {
    mockGetOrderById.mockResolvedValue({ id: 'order1' });
    const res = await request(app).get('/api/orders/test-user/order1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 'order1');
  });

  it('should return 404 if order not found', async () => {
    mockGetOrderById.mockResolvedValue(null);
    const res = await request(app).get('/api/orders/test-user/order404');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Order not found');
  });
});

describe('PUT /api/orders/:userId/:orderId/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update order status', async () => {
    mockUpdateOrderStatus.mockResolvedValue({ id: 'order1', status: OrderStatus.SHIPPED });
    const res = await request(app)
      .put('/api/orders/test-user/order1/status')
      .send({ status: OrderStatus.SHIPPED });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', OrderStatus.SHIPPED);
  });

  it('should return 400 for invalid update data', async () => {
    const res = await request(app)
      .put('/api/orders/test-user/order1/status')
      .send({ status: 'not-a-status' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 404 if order not found', async () => {
    mockUpdateOrderStatus.mockResolvedValue(null);
    const res = await request(app)
      .put('/api/orders/test-user/order404/status')
      .send({ status: OrderStatus.SHIPPED });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Order not found');
  });
});

describe('POST /api/orders/:userId/:orderId/cancel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should cancel order', async () => {
    mockCancelOrder.mockResolvedValue({ id: 'order1', status: OrderStatus.CANCELLED });
    const res = await request(app).post('/api/orders/test-user/order1/cancel');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', OrderStatus.CANCELLED);
  });

  it('should return 404 if order not found', async () => {
    mockCancelOrder.mockResolvedValue(null);
    const res = await request(app).post('/api/orders/test-user/order404/cancel');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Order not found');
  });
});
