import request from 'supertest';
import express from 'express';
import { OrderStatus } from './types';

const mockCreateOrder = jest.fn();
const mockGetUserOrders = jest.fn();
const mockGetOrderById = jest.fn();
const mockUpdateOrderStatus = jest.fn();
const mockCancelOrder = jest.fn();

jest.mock('./service', () => ({
  OrderService: jest.fn().mockImplementation(() => ({
    createOrder: mockCreateOrder,
    getUserOrders: mockGetUserOrders,
    getOrderById: mockGetOrderById,
    updateOrderStatus: mockUpdateOrderStatus,
    cancelOrder: mockCancelOrder,
  })),
}));

import router from './routes';

const app = express();
app.use(express.json());
app.use('/api', router);

const validOrderPayload = {
  items: [{ id: 'item1', name: 'Test', price: 10, description: '', image: '', dataAiHint: '', quantity: 1 }],
  shippingAddress: { street: 'A', city: 'B', state: 'C', zipCode: '123', country: 'X' },
  billingAddress: { street: 'A', city: 'B', state: 'C', zipCode: '123', country: 'X' },
  paymentMethod: { type: 'credit_card' as const },
};

describe('GET /api/orders/health', () => {
  it('returns 200 and healthy status with service and timestamp', async () => {
    const res = await request(app).get('/api/orders/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('service', 'order-service');
    expect(res.body).toHaveProperty('timestamp');
    expect(typeof res.body.timestamp).toBe('string');
  });
});

describe('POST /api/orders/:userId (createOrder)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 201 and full order with status and all response body fields', async () => {
    const order = {
      id: 'order-1',
      userId: 'test-user',
      items: validOrderPayload.items,
      totalAmount: 10,
      status: OrderStatus.PENDING,
      shippingAddress: validOrderPayload.shippingAddress,
      billingAddress: validOrderPayload.billingAddress,
      paymentMethod: validOrderPayload.paymentMethod,
      orderDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockCreateOrder.mockResolvedValue(order);
    const res = await request(app).post('/api/orders/test-user').send(validOrderPayload);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 'order-1');
    expect(res.body).toHaveProperty('userId', 'test-user');
    expect(res.body).toHaveProperty('status', OrderStatus.PENDING);
    expect(res.body).toHaveProperty('items');
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({ id: 'item1', name: 'Test', price: 10, quantity: 1 });
    expect(res.body).toHaveProperty('totalAmount', 10);
    expect(res.body).toHaveProperty('shippingAddress');
    expect(res.body.shippingAddress).toMatchObject({ street: 'A', city: 'B', state: 'C', zipCode: '123', country: 'X' });
    expect(res.body).toHaveProperty('billingAddress');
    expect(res.body.billingAddress).toMatchObject({ street: 'A', city: 'B', state: 'C', zipCode: '123', country: 'X' });
    expect(res.body).toHaveProperty('paymentMethod');
    expect(res.body.paymentMethod).toMatchObject({ type: 'credit_card' });
    expect(res.body).toHaveProperty('orderDate');
    expect(res.body).toHaveProperty('createdAt');
    expect(res.body).toHaveProperty('updatedAt');
  });

  it('returns 400 and error with details for empty body (Bad Request)', async () => {
    const res = await request(app).post('/api/orders/test-user').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid order data');
    expect(res.body).toHaveProperty('details');
    expect(Array.isArray(res.body.details)).toBe(true);
  });

  it('returns 400 and error for missing items array', async () => {
    const res = await request(app).post('/api/orders/test-user').send({
      shippingAddress: validOrderPayload.shippingAddress,
      billingAddress: validOrderPayload.billingAddress,
      paymentMethod: validOrderPayload.paymentMethod,
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/invalid|Invalid/i);
  });

  it('returns 400 and error for invalid payment method type', async () => {
    const res = await request(app).post('/api/orders/test-user').send({
      ...validOrderPayload,
      paymentMethod: { type: 'invalid_type' },
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('details');
  });

  it('returns 400 and error for item with non-positive price', async () => {
    const res = await request(app).post('/api/orders/test-user').send({
      ...validOrderPayload,
      items: [{ ...validOrderPayload.items[0], price: 0 }],
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 and error for item with non-positive quantity', async () => {
    const res = await request(app).post('/api/orders/test-user').send({
      ...validOrderPayload,
      items: [{ ...validOrderPayload.items[0], quantity: 0 }],
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 and error for invalid address (empty street)', async () => {
    const res = await request(app).post('/api/orders/test-user').send({
      ...validOrderPayload,
      shippingAddress: { ...validOrderPayload.shippingAddress, street: '' },
      billingAddress: validOrderPayload.billingAddress,
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 and error when service throws Error (e.g. data integrity)', async () => {
    mockCreateOrder.mockRejectedValue(new Error('Data integrity check failed: order total does not match cart total'));
    const res = await request(app).post('/api/orders/test-user').send(validOrderPayload);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('Data integrity');
  });

  it('returns 500 and error when service throws non-Error', async () => {
    mockCreateOrder.mockRejectedValue('unknown throw');
    const res = await request(app).post('/api/orders/test-user').send(validOrderPayload);
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Internal server error');
  });
});

describe('GET /api/orders/:userId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 and OrderResponse with orders, total, page, limit, totalPages', async () => {
    const orderList = { orders: [{ id: 'order1', status: OrderStatus.PENDING }], total: 1, page: 1, limit: 10, totalPages: 1 };
    mockGetUserOrders.mockResolvedValue(orderList);
    const res = await request(app).get('/api/orders/test-user');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('orders');
    expect(Array.isArray(res.body.orders)).toBe(true);
    expect(res.body).toHaveProperty('total', 1);
    expect(res.body).toHaveProperty('page', 1);
    expect(res.body).toHaveProperty('limit', 10);
    expect(res.body).toHaveProperty('totalPages', 1);
  });

  it('returns 400 and error for invalid query (page not a number)', async () => {
    const res = await request(app).get('/api/orders/test-user').query({ page: 'not-a-number' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/invalid|Invalid|query/i);
  });
});

describe('GET /api/orders/:userId/:orderId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 and order by id with key fields', async () => {
    const order = { id: 'order1', userId: 'test-user', status: OrderStatus.CONFIRMED };
    mockGetOrderById.mockResolvedValue(order);
    const res = await request(app).get('/api/orders/test-user/order1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 'order1');
    expect(res.body).toHaveProperty('userId', 'test-user');
    expect(res.body).toHaveProperty('status', OrderStatus.CONFIRMED);
  });

  it('returns 404 and error when order not found', async () => {
    mockGetOrderById.mockResolvedValue(null);
    const res = await request(app).get('/api/orders/test-user/order404');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Order not found');
  });
});

describe('PUT /api/orders/:userId/:orderId/status', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 and updated order with status', async () => {
    const updated = { id: 'order1', status: OrderStatus.SHIPPED, trackingNumber: 'TRK1' };
    mockUpdateOrderStatus.mockResolvedValue(updated);
    const res = await request(app)
      .put('/api/orders/test-user/order1/status')
      .send({ status: OrderStatus.SHIPPED, trackingNumber: 'TRK1' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 'order1');
    expect(res.body).toHaveProperty('status', OrderStatus.SHIPPED);
    expect(res.body).toHaveProperty('trackingNumber', 'TRK1');
  });

  it('returns 400 and error for invalid status', async () => {
    const res = await request(app)
      .put('/api/orders/test-user/order1/status')
      .send({ status: 'not-a-status' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 404 and error when order not found', async () => {
    mockUpdateOrderStatus.mockResolvedValue(null);
    const res = await request(app)
      .put('/api/orders/test-user/order404/status')
      .send({ status: OrderStatus.SHIPPED });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Order not found');
  });
});

describe('POST /api/orders/:userId/:orderId/cancel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 and cancelled order with status', async () => {
    const cancelled = { id: 'order1', status: OrderStatus.CANCELLED };
    mockCancelOrder.mockResolvedValue(cancelled);
    const res = await request(app).post('/api/orders/test-user/order1/cancel');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 'order1');
    expect(res.body).toHaveProperty('status', OrderStatus.CANCELLED);
  });

  it('returns 404 and error when order not found', async () => {
    mockCancelOrder.mockResolvedValue(null);
    const res = await request(app).post('/api/orders/test-user/order404/cancel');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Order not found');
  });
});
