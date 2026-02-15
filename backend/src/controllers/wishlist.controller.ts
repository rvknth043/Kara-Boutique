import { Request, Response } from 'express';
import WishlistService from '../services/wishlist.service';
import { asyncHandler } from '../middleware/errorHandler';

export class WishlistController {
  /**
   * Get user's wishlist
   * GET /api/v1/wishlist
   */
  static getWishlist = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    
    const wishlist = await WishlistService.getWishlist(userId);
    
    res.status(200).json({
      success: true,
      data: wishlist,
    });
  });
  
  /**
   * Add product to wishlist
   * POST /api/v1/wishlist/add
   */
  static addToWishlist = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { product_id } = req.body;
    
    await WishlistService.addToWishlist(userId, product_id);
    
    // Get updated wishlist
    const wishlist = await WishlistService.getWishlist(userId);
    
    res.status(201).json({
      success: true,
      message: 'Product added to wishlist',
      data: wishlist,
    });
  });
  
  /**
   * Remove product from wishlist
   * DELETE /api/v1/wishlist/remove/:productId
   */
  static removeFromWishlist = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { productId } = req.params;
    
    await WishlistService.removeFromWishlist(userId, productId);
    
    // Get updated wishlist
    const wishlist = await WishlistService.getWishlist(userId);
    
    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      data: wishlist,
    });
  });
  
  /**
   * Remove item by wishlist ID
   * DELETE /api/v1/wishlist/item/:itemId
   */
  static removeById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { itemId } = req.params;
    
    await WishlistService.removeById(userId, itemId);
    
    // Get updated wishlist
    const wishlist = await WishlistService.getWishlist(userId);
    
    res.status(200).json({
      success: true,
      message: 'Item removed from wishlist',
      data: wishlist,
    });
  });
  
  /**
   * Clear wishlist
   * DELETE /api/v1/wishlist/clear
   */
  static clearWishlist = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    
    await WishlistService.clearWishlist(userId);
    
    res.status(200).json({
      success: true,
      message: 'Wishlist cleared',
    });
  });
  
  /**
   * Check if product is in wishlist
   * GET /api/v1/wishlist/check/:productId
   */
  static checkWishlist = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { productId } = req.params;
    
    const isInWishlist = await WishlistService.isInWishlist(userId, productId);
    
    res.status(200).json({
      success: true,
      data: { in_wishlist: isInWishlist },
    });
  });
  
  /**
   * Get wishlist count
   * GET /api/v1/wishlist/count
   */
  static getWishlistCount = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    
    const count = await WishlistService.getWishlistCount(userId);
    
    res.status(200).json({
      success: true,
      data: { count },
    });
  });
  
  /**
   * Toggle product in wishlist
   * POST /api/v1/wishlist/toggle
   */
  static toggleWishlist = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { product_id } = req.body;
    
    const result = await WishlistService.toggleWishlist(userId, product_id);
    
    res.status(200).json({
      success: true,
      message: `Product ${result.action} ${result.action === 'added' ? 'to' : 'from'} wishlist`,
      data: result,
    });
  });
}

export default WishlistController;
