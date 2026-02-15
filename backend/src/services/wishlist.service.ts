import WishlistModel, { WishlistItemWithDetails } from '../models/Wishlist.model';
import ProductModel from '../models/Product.model';
import { AppError } from '../middleware/errorHandler';
import { CacheService, CACHE_KEYS, CACHE_TTL } from '../config/redis';

export class WishlistService {
  /**
   * Add product to wishlist
   */
  static async addToWishlist(userId: string, productId: string) {
    // Validate product exists
    const product = await ProductModel.findById(productId);
    
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }
    
    if (!product.is_active) {
      throw new AppError('Product is not available', 400, 'PRODUCT_INACTIVE');
    }
    
    // Add to wishlist
    const wishlistItem = await WishlistModel.addItem(userId, productId);
    
    // Clear cache
    await CacheService.del(CACHE_KEYS.WISHLIST(userId));
    
    return wishlistItem;
  }
  
  /**
   * Get user's wishlist
   */
  static async getWishlist(userId: string): Promise<WishlistItemWithDetails[]> {
    // Check cache
    const cacheKey = CACHE_KEYS.WISHLIST(userId);
    const cached = await CacheService.get<WishlistItemWithDetails[]>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    // Get wishlist
    const wishlist = await WishlistModel.getUserWishlist(userId);
    
    // Cache wishlist
    await CacheService.set(cacheKey, wishlist, CACHE_TTL.WISHLIST);
    
    return wishlist;
  }
  
  /**
   * Remove product from wishlist
   */
  static async removeFromWishlist(userId: string, productId: string) {
    const removed = await WishlistModel.removeItem(userId, productId);
    
    if (!removed) {
      throw new AppError('Item not found in wishlist', 404, 'WISHLIST_ITEM_NOT_FOUND');
    }
    
    // Clear cache
    await CacheService.del(CACHE_KEYS.WISHLIST(userId));
    
    return { success: true };
  }
  
  /**
   * Remove item by wishlist ID
   */
  static async removeById(userId: string, itemId: string) {
    const removed = await WishlistModel.removeById(itemId, userId);
    
    if (!removed) {
      throw new AppError('Item not found in wishlist', 404, 'WISHLIST_ITEM_NOT_FOUND');
    }
    
    // Clear cache
    await CacheService.del(CACHE_KEYS.WISHLIST(userId));
    
    return { success: true };
  }
  
  /**
   * Clear entire wishlist
   */
  static async clearWishlist(userId: string) {
    await WishlistModel.clearWishlist(userId);
    
    // Clear cache
    await CacheService.del(CACHE_KEYS.WISHLIST(userId));
    
    return { success: true };
  }
  
  /**
   * Check if product is in wishlist
   */
  static async isInWishlist(userId: string, productId: string): Promise<boolean> {
    return await WishlistModel.isInWishlist(userId, productId);
  }
  
  /**
   * Get wishlist count
   */
  static async getWishlistCount(userId: string): Promise<number> {
    return await WishlistModel.getItemCount(userId);
  }
  
  /**
   * Toggle product in wishlist (add if not present, remove if present)
   */
  static async toggleWishlist(userId: string, productId: string) {
    const isInWishlist = await WishlistModel.isInWishlist(userId, productId);
    
    if (isInWishlist) {
      await this.removeFromWishlist(userId, productId);
      return {
        action: 'removed',
        in_wishlist: false,
      };
    } else {
      await this.addToWishlist(userId, productId);
      return {
        action: 'added',
        in_wishlist: true,
      };
    }
  }
}

export default WishlistService;
