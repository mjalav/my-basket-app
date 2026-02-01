import { faker } from '@faker-js/faker';
import { CartService } from './service';

import { ProductServiceClient } from './product-client';
import { Product, Cart, CartItem } from './types';

// Mock the ProductServiceClient
jest.mock('./product-client');

describe('CartService', () => {
  let cartService: CartService;
  let mockProductClient: jest.Mocked<ProductServiceClient>;

  // Mock product data
  const mockProduct: Product = {
    id: 'product-1',
    name: 'Test Product',
    price: 29.99,
    description: 'Test Description',
    image: 'https://example.com/image.jpg',
    dataAiHint: 'test hint'
  };

  const mockExpensiveProduct: Product = {
    id: 'product-2',
    name: 'Expensive Product',
    price: 10.99,
    description: 'For floating point test',
    image: 'https://example.com/image2.jpg',
    dataAiHint: 'test hint 2'
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mocked instance
    mockProductClient = new ProductServiceClient() as jest.Mocked<ProductServiceClient>;
    
    // Mock all ProductServiceClient methods
    mockProductClient.getProduct = jest.fn();
    mockProductClient.getProducts = jest.fn();

    // Initialize CartService with mocked client
    cartService = new CartService(mockProductClient);
  });

  describe('addToCart', () => {
    test('should add a valid product to the cart', async () => {
      // Arrange
      const userId = faker.datatype.uuid();

      const productId = 'product-1';
      const quantity = 2;

      mockProductClient.getProduct.mockResolvedValue(mockProduct);

      // Act
      const cart = await cartService.addToCart(userId, productId, quantity);

      // Assert
      expect(mockProductClient.getProduct).toHaveBeenCalledWith(productId);
      expect(cart.userId).toBe(userId);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].id).toBe(productId);
      expect(cart.items[0].quantity).toBe(quantity);
      expect(cart.items[0].price).toBe(mockProduct.price);
      expect(cart.totalAmount).toBe(59.98); // 29.99 * 2, rounded to 2 decimals
    });

    test('should update quantity if product already exists in cart', async () => {
      // Arrange
      const userId = faker.datatype.uuid();

      const productId = 'product-1';

      mockProductClient.getProduct.mockResolvedValue(mockProduct);

      // Act
      await cartService.addToCart(userId, productId, 2);
      const cart = await cartService.addToCart(userId, productId, 3);

      // Assert
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(5); // 2 + 3
      expect(cart.totalAmount).toBe(149.95); // 29.99 * 5
    });

    test('should calculate totalAmount rounded to 2 decimal places', async () => {
      // Arrange
      const userId = faker.datatype.uuid();

      const productId = 'product-1';
      const quantity = 1;

      mockProductClient.getProduct.mockResolvedValue(mockProduct);

      // Act
      const cart = await cartService.addToCart(userId, productId, quantity);

      // Assert
      expect(cart.totalAmount).toBe(29.99);
      expect(cart.totalAmount.toFixed(2)).toBe('29.99');
    });
  });

  describe('updateCartItem', () => {
    test('should update cart item quantity correctly', async () => {
      // Arrange
      const userId = faker.datatype.uuid();

      const productId = 'product-1';

      mockProductClient.getProduct.mockResolvedValue(mockProduct);
      await cartService.addToCart(userId, productId, 2);

      // Act
      const cart = await cartService.updateCartItem(userId, productId, 5);

      // Assert
      expect(cart.items[0].quantity).toBe(5);
      expect(cart.totalAmount).toBe(149.95); // 29.99 * 5, rounded to 2 decimals
    });

    test('should calculate totalAmount correctly with multiple items', async () => {
      // Arrange
      const userId = faker.datatype.uuid();
      
      const product1Id = faker.datatype.uuid();
      const product1Price = parseFloat(faker.commerce.price(10, 50));
      const product1: Product = {
        id: product1Id,
        name: faker.commerce.productName(),
        price: product1Price,
        description: faker.commerce.productDescription(),
        image: faker.image.imageUrl(),
        dataAiHint: faker.lorem.word()
      };

      const product2Id = faker.datatype.uuid();
      const product2Price = parseFloat(faker.commerce.price(5, 20));
      const product2: Product = {
        id: product2Id,
        name: faker.commerce.productName(),
        price: product2Price,
        description: faker.commerce.productDescription(),
        image: faker.image.imageUrl(),
        dataAiHint: faker.lorem.word()
      };

      // Explicitly mock based on product ID to avoid reliance on call order
      mockProductClient.getProduct.mockImplementation(async (id) => {
        if (id === product1Id) return product1;
        if (id === product2Id) return product2;
        throw new Error('Product not found in mock');
      });

      const qty1 = 3;
      const qty2 = 1;
      const newQty1 = 2; // update from 3 to 2

      await cartService.addToCart(userId, product1Id, qty1);
      await cartService.addToCart(userId, product2Id, qty2);

      // Act
      const cart = await cartService.updateCartItem(userId, product1Id, newQty1);

      // Assert
      expect(cart.items).toHaveLength(2);
      
      const expectedTotal = Number(((product1Price * newQty1) + (product2Price * qty2)).toFixed(2));
      expect(cart.totalAmount).toBe(expectedTotal);
      
      const item1 = cart.items.find(i => i.id === product1Id);
      expect(item1?.quantity).toBe(newQty1);
    });
  });

  describe('floating point precision', () => {
    test('should handle floating point precision when adding 3 items priced at 10.99', async () => {
      // Arrange
      const userId = faker.datatype.uuid();

      const productId = 'product-2';
      const quantity = 3;

      mockProductClient.getProduct.mockResolvedValue(mockExpensiveProduct);

      // Act
      const cart = await cartService.addToCart(userId, productId, quantity);

      // Assert
      const expectedTotal = 32.97; // 10.99 * 3
      expect(cart.totalAmount).toBe(expectedTotal);
      
      // Verify it's rounded to exactly 2 decimal places
      const decimalPlaces = (cart.totalAmount.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
      
      // Verify precision is maintained
      expect(Number(cart.totalAmount.toFixed(2))).toBe(32.97);
    });

    test('should maintain precision with complex calculations', async () => {
      // Arrange
      const userId = faker.datatype.uuid();


      mockProductClient.getProduct.mockResolvedValue(mockExpensiveProduct);

      // Act - Add multiple times to test cumulative floating point errors
      await cartService.addToCart(userId, 'product-2', 1);
      await cartService.addToCart(userId, 'product-2', 1);
      const cart = await cartService.addToCart(userId, 'product-2', 1);

      // Assert
      expect(cart.totalAmount).toBe(32.97); // 10.99 * 3
      expect(cart.totalAmount).not.toBe(32.96999999999); // Should be rounded
    });
  });

  describe('removeFromCart', () => {
    test('Manual: should completely remove an item and recalculate totals', async () => {
      // Arrange
      const userId = faker.datatype.uuid();

      mockProductClient.getProduct
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce(mockExpensiveProduct);

      await cartService.addToCart(userId, mockProduct.id, 2);
      await cartService.addToCart(userId, mockExpensiveProduct.id, 1);

      // Act
      const cart = await cartService.removeFromCart(userId, mockProduct.id);

      // Assert
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].id).toBe(mockExpensiveProduct.id);
      expect(cart.totalItems).toBe(1);
      expect(cart.totalAmount).toBe(10.99);
    });

    test('Copilot: should remove product from items array and update totalItems and totalAmount correctly', async () => {
      // Arrange
      const userId = faker.datatype.uuid();

      const item1 = { ...mockProduct, id: 'item-1', price: 10.00 };
      const item2 = { ...mockProduct, id: 'item-2', price: 20.00 };
      
      mockProductClient.getProduct
        .mockResolvedValueOnce(item1)
        .mockResolvedValueOnce(item2);

      await cartService.addToCart(userId, item1.id, 3); // total: 30.00, items: 3
      await cartService.addToCart(userId, item2.id, 2); // total: 40.00, items: 2 -> grand total: 70.00, items: 5

      // Act
      const updatedCart = await cartService.removeFromCart(userId, 'item-1');

      // Assert
      expect(updatedCart.items.find(i => i.id === 'item-1')).toBeUndefined();
      expect(updatedCart.items).toHaveLength(1);
      expect(updatedCart.items[0].id).toBe('item-2');
      expect(updatedCart.totalItems).toBe(2);
      expect(updatedCart.totalAmount).toBe(40.00);
      expect(updatedCart.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('edge cases', () => {
    test('should handle zero quantity updates', async () => {
      // Arrange
      const userId = faker.datatype.uuid();

      const productId = 'product-1';

      mockProductClient.getProduct.mockResolvedValue(mockProduct);
      await cartService.addToCart(userId, productId, 2);

      // Act
      const cart = await cartService.updateCartItem(userId, productId, 0);

      // Assert
      expect(cart.items.find(item => item.id === productId)).toBeUndefined();
      expect(cart.totalAmount).toBe(0);
    });

    test('should throw error when updating non-existent item in cart', async () => {
      // Arrange
      const userId = faker.datatype.uuid();

      const nonExistentProductId = 'non-existent-product';

      // Act & Assert
      await expect(
        cartService.updateCartItem(userId, nonExistentProductId, 5)
      ).rejects.toThrow('Item not found in cart');
    });
  });
});
