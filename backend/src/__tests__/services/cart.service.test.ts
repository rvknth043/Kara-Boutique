import { CartService } from '../../services/cart.service';
import CartModel from '../../models/Cart.model';
import ProductVariantModel from '../../models/ProductVariant.model';

jest.mock('../../models/Cart.model');
jest.mock('../../models/ProductVariant.model');

describe('CartService', () => {
  const mockUserId = 'user-123';
  const mockVariantId = 'variant-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserCart', () => {
    it('should return user cart with items', async () => {
      const mockCartItems = [
        {
          id: '1',
          user_id: mockUserId,
          product_variant_id: mockVariantId,
          quantity: 2,
          product_name: 'Test Product',
          subtotal: 2000,
        },
      ];

      (CartModel.getUserCart as jest.Mock).mockResolvedValue(mockCartItems);

      const result = await CartService.getUserCart(mockUserId);

      expect(result).toEqual(mockCartItems);
      expect(CartModel.getUserCart).toHaveBeenCalledWith(mockUserId);
    });

    it('should return empty array for empty cart', async () => {
      (CartModel.getUserCart as jest.Mock).mockResolvedValue([]);

      const result = await CartService.getUserCart(mockUserId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('addToCart', () => {
    it('should add new item to cart', async () => {
      const mockVariant = {
        id: mockVariantId,
        stock_quantity: 10,
        reserved_quantity: 0,
      };

      const mockCartItem = {
        id: '1',
        user_id: mockUserId,
        product_variant_id: mockVariantId,
        quantity: 2,
      };

      (CartModel.findByUserAndVariant as jest.Mock).mockResolvedValue(null);
      (ProductVariantModel.findById as jest.Mock).mockResolvedValue(
        mockVariant
      );
      (CartModel.create as jest.Mock).mockResolvedValue(mockCartItem);

      const result = await CartService.addToCart(mockUserId, {
        product_variant_id: mockVariantId,
        quantity: 2,
      });

      expect(result).toEqual(mockCartItem);
      expect(CartModel.create).toHaveBeenCalled();
    });

    it('should update quantity if item already in cart', async () => {
      const existingItem = {
        id: '1',
        quantity: 2,
      };

      const mockVariant = {
        id: mockVariantId,
        stock_quantity: 10,
        reserved_quantity: 0,
      };

      (CartModel.findByUserAndVariant as jest.Mock).mockResolvedValue(
        existingItem
      );
      (ProductVariantModel.findById as jest.Mock).mockResolvedValue(
        mockVariant
      );
      (CartModel.updateQuantity as jest.Mock).mockResolvedValue({
        ...existingItem,
        quantity: 4,
      });

      const result = await CartService.addToCart(mockUserId, {
        product_variant_id: mockVariantId,
        quantity: 2,
      });

      expect(CartModel.updateQuantity).toHaveBeenCalledWith('1', 4);
    });

    it('should throw error if insufficient stock', async () => {
      const mockVariant = {
        id: mockVariantId,
        stock_quantity: 5,
        reserved_quantity: 4,
      };

      (CartModel.findByUserAndVariant as jest.Mock).mockResolvedValue(null);
      (ProductVariantModel.findById as jest.Mock).mockResolvedValue(
        mockVariant
      );

      await expect(
        CartService.addToCart(mockUserId, {
          product_variant_id: mockVariantId,
          quantity: 10,
        })
      ).rejects.toThrow('Insufficient stock');
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', async () => {
      const mockUpdated = {
        id: '1',
        quantity: 5,
      };

      (CartModel.updateQuantity as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await CartService.updateQuantity('1', 5);

      expect(result).toEqual(mockUpdated);
      expect(CartModel.updateQuantity).toHaveBeenCalledWith('1', 5);
    });

    it('should throw error for invalid quantity', async () => {
      await expect(
        CartService.updateQuantity('1', 0)
      ).rejects.toThrow();

      await expect(
        CartService.updateQuantity('1', -5)
      ).rejects.toThrow();
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      (CartModel.delete as jest.Mock).mockResolvedValue(true);

      await CartService.removeItem('1');

      expect(CartModel.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('clearCart', () => {
    it('should clear all items from user cart', async () => {
      (CartModel.clearUserCart as jest.Mock).mockResolvedValue(undefined);

      await CartService.clearCart(mockUserId);

      expect(CartModel.clearUserCart).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('validateCart', () => {
    it('should validate all items in cart', async () => {
      const mockValidation = {
        valid: true,
        issues: [],
      };

      (CartModel.validateCart as jest.Mock).mockResolvedValue(
        mockValidation
      );

      const result = await CartService.validateCart(mockUserId);

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should return issues for invalid items', async () => {
      const mockValidation = {
        valid: false,
        issues: [
          {
            item_id: '1',
            reason: 'Out of stock',
          },
        ],
      };

      (CartModel.validateCart as jest.Mock).mockResolvedValue(
        mockValidation
      );

      const result = await CartService.validateCart(mockUserId);

      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(1);
    });
  });
});
