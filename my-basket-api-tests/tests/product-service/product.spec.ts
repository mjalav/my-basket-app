import { test, expect } from '../../src/fixtures/api-fixtures';
import { CreateProductRequest } from '../../src/types/api';

test.describe('Product Service API Tests', () => {
  let createdProductId: string;

  test.describe('CRUD Operations', () => {
    test.beforeAll(async ({ productApi }) => {
      const newProduct: CreateProductRequest = {
        name: 'Test Product',
        description: 'This is a test product',
        price: 29.99,
        category: 'Electronics',
        inStock: true,
        image: 'http://example.com/image.jpg',
        dataAiHint: 'electronic'
      };

      const response = await productApi.createProduct(newProduct);
      const body = await response.json();
      createdProductId = body.id;
    });

    test('should get product by id', async ({ productApi }) => {
      expect(createdProductId, 'Product should have been created in beforeAll').toBeDefined();
      
      const response = await productApi.getProduct(createdProductId);
      await productApi.assertStatus(response, 200);
      
      const body = await response.json();
      expect(body.id).toBe(createdProductId);
      expect(body.name).toBe('Test Product');
    });

    test('should update product', async ({ productApi }) => {
      test.skip(!createdProductId, 'Skipping as product was not created');
      
      const updateData = {
        price: 34.99,
        inStock: false
      };

      const response = await productApi.updateProduct(createdProductId, updateData);
      await productApi.assertStatus(response, 200);
      
      const body = await response.json();
      expect(body.price).toBe(34.99);
      expect(body.inStock).toBe(false);
    });

    test('should list all products', async ({ productApi }) => {
      const response = await productApi.getAllProducts();
      await productApi.assertStatus(response, 200);
      
      const body = await response.json();
      expect(body.products).toBeDefined();
      expect(Array.isArray(body.products)).toBeTruthy();
      expect(body.products.length).toBeGreaterThan(0);
    });

    test('should delete product', async ({ productApi }) => {
      expect(createdProductId).toBeDefined();
      
      const response = await productApi.deleteProduct(createdProductId);
      await productApi.assertStatus(response, 204); 
      
      const getResponse = await productApi.getProduct(createdProductId);
      expect(getResponse.status()).toBe(404);
    });
  });

  test.describe('Negative Testing', () => {
    
    test('should fail to create product with missing required fields', async ({ productApi }) => {
      const invalidProduct = {
        name: 'Incomplete Product'
        // Missing description, price, etc.
      };

      const response = await productApi.createProduct(invalidProduct);
      expect(response.status()).toBe(400);
    });

    test('should return 404 for non-existent product', async ({ productApi }) => {
      const response = await productApi.getProduct('non-existent-id');
      expect(response.status()).toBe(404);
    });

    test('should fail to create product with invalid data types', async ({ productApi }) => {
      const invalidProduct = {
        name: 'Invalid Price Product',
        description: 'Test',
        price: 'not-a-number',
        category: 'Electronics',
        inStock: true,
        image: 'http://example.com/image.jpg',
        dataAiHint: 'test'
      };

      const response = await productApi.createProduct(invalidProduct as any);
      expect(response.status()).toBe(400);
    });
  });

  test.describe('Category Management', () => {
    test('should list all categories', async ({ productApi }) => {
      const response = await productApi.getCategories();
      await productApi.assertStatus(response, 200);
      
      const body = await response.json();
      expect(body.categories).toBeDefined();
      expect(Array.isArray(body.categories)).toBeTruthy();
      expect(body.categories).toContain('fruits');
    });
  });
});
