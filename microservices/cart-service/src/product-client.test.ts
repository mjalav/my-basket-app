import { faker } from '@faker-js/faker';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';
import { ProductServiceClient } from './product-client';
import { Product } from './types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ProductServiceClient', () => {
  let productClient: ProductServiceClient;

  // Mock product data
  const mockProduct: Product = {
    id: 'product-123',
    name: 'Test Product',
    price: 29.99,
    description: 'A test product description',
    image: 'https://example.com/product.jpg',
    dataAiHint: 'test product hint'
  };

  const mockProduct2: Product = {
    id: 'product-456',
    name: 'Another Test Product',
    price: 49.99,
    description: 'Another test description',
    image: 'https://example.com/product2.jpg',
    dataAiHint: 'another test hint'
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Initialize ProductServiceClient
    productClient = new ProductServiceClient();
  });

  afterEach(() => {
    // Reset environment variables
    delete process.env.PRODUCT_SERVICE_URL;
  });

  describe('checkHealth', () => {
    test('should return true when health check succeeds', async () => {
      // Arrange
      mockedAxios.get.mockResolvedValue({ 
        status: 200, 
        data: { status: 'healthy' } 
      });

      // Act
      const result = await productClient.checkHealth();

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/products/health'),
        expect.objectContaining({ timeout: 2000 })
      );
      expect(result).toBe(true);
    });

    test('should return false when health check fails with error', async () => {
      // Arrange
      mockedAxios.get.mockRejectedValue(new Error('Connection refused'));

      // Act
      const result = await productClient.checkHealth();

      // Assert
      expect(result).toBe(false);
    });

    test('should return false when health check returns non-200 status code', async () => {
      // Arrange
      mockedAxios.get.mockResolvedValue({ 
        status: 503, 
        data: { status: 'unhealthy' } 
      });

      // Act
      const result = await productClient.checkHealth();

      // Assert
      expect(result).toBe(false);
    });

    test('should use correct timeout for health check', async () => {
      // Arrange
      mockedAxios.get.mockResolvedValue({ status: 200, data: {} });

      // Act
      await productClient.checkHealth();

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ timeout: 2000 })
      );
    });
  });

  describe('getProduct', () => {
    test('should fetch product successfully by ID', async () => {
      // Arrange
      const productId = mockProduct.id;
      mockedAxios.get.mockResolvedValue({ 
        status: 200, 
        data: mockProduct 
      });

      // Act
      const result = await productClient.getProduct(productId);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/products/${productId}`),
        expect.objectContaining({ timeout: 5000 })
      );
      expect(result).toEqual(mockProduct);
      expect(result?.id).toBe(productId);
      expect(result?.name).toBe(mockProduct.name);
      expect(result?.price).toBe(mockProduct.price);
    });

    test('should return null when product not found (404)', async () => {
      // Arrange
      const productId = 'non-existent-product';
      const error: any = new Error('Not Found');
      error.response = { status: 404 };
      mockedAxios.get.mockRejectedValue(error);

      // Act
      const result = await productClient.getProduct(productId);

      // Assert
      expect(result).toBeNull();
    });

    test('should throw error when request times out', async () => {
      // Arrange
      const productId = faker.datatype.uuid();
      const error: any = new Error('Timeout');
      error.code = 'ECONNABORTED';
      mockedAxios.get.mockRejectedValue(error);

      // Act & Assert
      await expect(productClient.getProduct(productId)).rejects.toThrow('Product service timeout');
    });

    test('should throw error when service returns server error', async () => {
      // Arrange
      const productId = faker.datatype.uuid();
      const error: any = new Error('Internal Server Error');
      error.response = { status: 500 };
      mockedAxios.get.mockRejectedValue(error);

      // Act & Assert
      await expect(productClient.getProduct(productId)).rejects.toThrow('Failed to fetch product');
    });

    test('should use default localhost URL when no environment variable set', async () => {
      // Arrange
      const productId = mockProduct.id;
      
      mockedAxios.get.mockResolvedValue({ 
        status: 200, 
        data: mockProduct 
      });

      // Act
      await productClient.getProduct(productId);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `http://localhost:3001/api/products/${productId}`,
        expect.any(Object)
      );
    });

    test('should handle network error gracefully', async () => {
      // Arrange
      const productId = faker.datatype.uuid();
      const error: any = new Error('Network Error');
      error.message = 'ENOTFOUND';
      mockedAxios.get.mockRejectedValue(error);

      // Act & Assert
      await expect(productClient.getProduct(productId)).rejects.toThrow('Failed to fetch product');
    });
  });

  describe('getProducts', () => {
    test('should fetch multiple products successfully', async () => {
      // Arrange
      const productIds = [mockProduct.id, mockProduct2.id];
      
      mockedAxios.get
        .mockResolvedValueOnce({ status: 200, data: mockProduct })
        .mockResolvedValueOnce({ status: 200, data: mockProduct2 });

      // Act
      const results = await productClient.getProducts(productIds);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(2);
      expect(results[0].id).toBe(mockProduct.id);
      expect(results[1].id).toBe(mockProduct2.id);
    });

    test('should handle partial failures when some products not found', async () => {
      // Arrange
      const productIds = [mockProduct.id, 'non-existent', mockProduct2.id];
      
      const notFoundError: any = new Error('Not Found');
      notFoundError.response = { status: 404 };
      
      mockedAxios.get
        .mockResolvedValueOnce({ status: 200, data: mockProduct })
        .mockRejectedValueOnce(notFoundError)
        .mockResolvedValueOnce({ status: 200, data: mockProduct2 });

      // Act
      const results = await productClient.getProducts(productIds);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
      expect(results).toHaveLength(2); // Only successful fetches
      expect(results[0].id).toBe(mockProduct.id);
      expect(results[1].id).toBe(mockProduct2.id);
    });

    test('should return empty array when all products fail to fetch', async () => {
      // Arrange
      const productIds = ['fail-1', 'fail-2'];
      const error: any = new Error('Server Error');
      error.response = { status: 500 };
      
      mockedAxios.get.mockRejectedValue(error);

      // Act
      const results = await productClient.getProducts(productIds);

      // Assert
      expect(results).toHaveLength(0);
      expect(results).toEqual([]);
    });

    test('should handle empty product IDs array', async () => {
      // Arrange
      const productIds: string[] = [];

      // Act
      const results = await productClient.getProducts(productIds);

      // Assert
      expect(mockedAxios.get).not.toHaveBeenCalled();
      expect(results).toHaveLength(0);
      expect(results).toEqual([]);
    });

    test('should fetch multiple products successfully when all requests succeed', async () => {
      // Arrange
      const productIds = [
        faker.datatype.uuid(),
        faker.datatype.uuid(),
        faker.datatype.uuid()
      ];
      
      const mockProducts = productIds.map((id, index) => ({
        ...mockProduct,
        id,
        name: `Product ${index + 1}`,
        price: 10 * (index + 1)
      }));
      
      mockedAxios.get
        .mockResolvedValueOnce({ status: 200, data: mockProducts[0] })
        .mockResolvedValueOnce({ status: 200, data: mockProducts[1] })
        .mockResolvedValueOnce({ status: 200, data: mockProducts[2] });

      // Act
      const results = await productClient.getProducts(productIds);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
      expect(results).toHaveLength(3);
      expect(results[0].name).toBe('Product 1');
      expect(results[1].name).toBe('Product 2');
      expect(results[2].name).toBe('Product 3');
    });

    test('should filter out null results from failed fetches', async () => {
      // Arrange
      const productIds = ['valid-1', 'invalid-2', 'valid-3'];
      
      const notFoundError: any = new Error('Not Found');
      notFoundError.response = { status: 404 };
      
      mockedAxios.get
        .mockResolvedValueOnce({ status: 200, data: mockProduct })
        .mockRejectedValueOnce(notFoundError)
        .mockResolvedValueOnce({ status: 200, data: mockProduct2 });

      // Act
      const results = await productClient.getProducts(productIds);

      // Assert
      expect(results).toHaveLength(2);
      expect(results.every(p => p !== null)).toBe(true);
      expect(results.find(p => p.id === mockProduct.id)).toBeDefined();
      expect(results.find(p => p.id === mockProduct2.id)).toBeDefined();
    });
  });

  describe('edge cases and error handling', () => {
    test('should return data as-is when response structure is unexpected', async () => {
      // Arrange
      const productId = faker.datatype.uuid();
      const malformedData = { invalidData: 'not a product' };
      mockedAxios.get.mockResolvedValue({ 
        status: 200, 
        data: malformedData
      });

      // Act
      const result = await productClient.getProduct(productId);

      // Assert
      // Client returns data without validation
      expect(result).toBeDefined();
      expect(result).toEqual(malformedData);
    });

    test('should make request even when product ID is empty string', async () => {
      // Arrange
      const productId = '';
      mockedAxios.get.mockResolvedValue({ status: 200, data: mockProduct });

      // Act
      const result = await productClient.getProduct(productId);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3001/api/products/',
        expect.any(Object)
      );
      expect(result).toEqual(mockProduct);
    });
  });
});
