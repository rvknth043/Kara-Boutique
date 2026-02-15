import CartModel, { CartItemWithDetails } from '../models/Cart.model';
import ProductVariantModel from '../models/ProductVariant.model';
import ProductModel from '../models/Product.model';
import { AppError } from '../middleware/errorHandler';
import { CacheService, CACHE_KEYS, CACHE_TTL } from '../config/redis';
import { calculateShippingCharge } from '../utils/helpers';

export interface CartSummary {
  items: CartItemWithDetails[];
  subtotal: number;
  shipping_charge: number;
  discount: number;
  total: number;
  item_count: number;
}

export class CartService {
  /**
   * Add item to cart
   */
  static async addToCart(
    userId: string,
    productVariantId: string,
    quantity: number = 1
  ) {
    // Validate variant exists
    const variant = await ProductVariantModel.findById(productVariantId);
    
    if (!variant) {
      throw new AppError('Product variant not found', 404, 'VARIANT_NOT_FOUND');
    }
    
    if (!variant.is_active) {
      throw new AppError('Product variant is not available', 400, 'VARIANT_INACTIVE');
    }
    
    // Check stock availability
    const hasStock = await ProductVariantModel.hasStock(productVariantId, quantity);
    
    if (!hasStock) {
      throw new AppError(
        'Insufficient stock available',
        400,
        'INSUFFICIENT_STOCK'
      );
    }
    
    // Check if already in cart
    const existingItem = await CartModel.getItemByVariant(userId, productVariantId);
    
    if (existingItem) {
      // Check combined quantity
      const newQuantity = existingItem.quantity + quantity;
      const hasEnoughStock = await ProductVariantModel.hasStock(productVariantId, newQuantity);
      
      if (!hasEnoughStock) {
        throw new AppError(
          `Only ${variant.stock_quantity - variant.reserved_quantity - existingItem.quantity} more items available`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }
    }
    
    // Add to cart
    const cartItem = await CartModel.addItem(userId, productVariantId, quantity);
    
    // Clear cart cache
    await CacheService.del(CACHE_KEYS.CART(userId));
    
    return cartItem;
  }
  
  /**
   * Get user's cart with summary
   */
  static async getCart(userId: string): Promise<CartSummary> {
    // Check cache
    const cacheKey = CACHE_KEYS.CART(userId);
    const cached = await CacheService.get<CartSummary>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    // Get cart items
    const items = await CartModel.getUserCart(userId);
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const shipping_charge = calculateShippingCharge(subtotal);
    const discount = 0; // Will be calculated when coupon is applied
    const total = subtotal + shipping_charge - discount;
    const item_count = items.reduce((sum, item) => sum + item.quantity, 0);
    
    const summary: CartSummary = {
      items,
      subtotal,
      shipping_charge,
      discount,
      total,
      item_count,
    };
    
    // Cache cart
    await CacheService.set(cacheKey, summary, CACHE_TTL.CART);
    
    return summary;
  }
  
  /**
   * Update cart item quantity
   */
  static async updateQuantity(
    userId: string,
    itemId: string,
    quantity: number
  ) {
    if (quantity < 1) {
      throw new AppError('Quantity must be at least 1', 400, 'INVALID_QUANTITY');
    }
    
    // Get cart item
    const cartItem = await CartModel.getItemById(itemId, userId);
    
    if (!cartItem) {
      throw new AppError('Cart item not found', 404, 'CART_ITEM_NOT_FOUND');
    }
    
    // Check stock availability
    const hasStock = await ProductVariantModel.hasStock(
      cartItem.product_variant_id,
      quantity
    );
    
    if (!hasStock) {
      const variant = await ProductVariantModel.findById(cartItem.product_variant_id);
      throw new AppError(
        `Only ${variant!.stock_quantity - variant!.reserved_quantity} items available`,
        400,
        'INSUFFICIENT_STOCK'
      );
    }
    
    // Update quantity
    const updated = await CartModel.updateQuantity(itemId, userId, quantity);
    
    // Clear cache
    await CacheService.del(CACHE_KEYS.CART(userId));
    
    return updated;
  }
  
  /**
   * Remove item from cart
   */
  static async removeItem(userId: string, itemId: string) {
    const removed = await CartModel.removeItem(itemId, userId);
    
    if (!removed) {
      throw new AppError('Cart item not found', 404, 'CART_ITEM_NOT_FOUND');
    }
    
    // Clear cache
    await CacheService.del(CACHE_KEYS.CART(userId));
    
    return { success: true };
  }
  
  /**
   * Clear entire cart
   */
  static async clearCart(userId: string) {
    await CartModel.clearCart(userId);
    
    // Clear cache
    await CacheService.del(CACHE_KEYS.CART(userId));
    
    return { success: true };
  }
  
  /**
   * Validate cart before checkout
   */
  static async validateCart(userId: string) {
    const validation = await CartModel.validateCart(userId);
    
    if (!validation.valid) {
      return {
        valid: false,
        message: 'Some items in your cart are out of stock',
        issues: validation.issues,
      };
    }
    
    // Also check if cart is empty
    const itemCount = await CartModel.getItemCount(userId);
    
    if (itemCount === 0) {
      return {
        valid: false,
        message: 'Your cart is empty',
        issues: [],
      };
    }
    
    return {
      valid: true,
      message: 'Cart is valid',
      issues: [],
    };
  }
  
  /**
   * Get cart item count
   */
  static async getCartCount(userId: string): Promise<number> {
    return await CartModel.getItemCount(userId);
  }
  
  /**
   * Merge guest cart to user cart (after login)
   */
  static async mergeGuestCart(
    userId: string,
    guestCartItems: Array<{ product_variant_id: string; quantity: number }>
  ) {
    await CartModel.mergeGuestCart(userId, guestCartItems);
    
    // Clear cache
    await CacheService.del(CACHE_KEYS.CART(userId));
    
    return await this.getCart(userId);
  }
}

export default CartService;
