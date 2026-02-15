import { Request, Response } from 'express';
import CartService from '../services/cart.service';
import { asyncHandler } from '../middleware/errorHandler';

export class CartController {
  /**
   * Get user's cart
   * GET /api/v1/cart
   */
  static getCart = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    
    const cart = await CartService.getCart(userId);
    
    res.status(200).json({
      success: true,
      data: cart,
    });
  });
  
  /**
   * Add item to cart
   * POST /api/v1/cart/add
   */
  static addToCart = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { product_variant_id, quantity } = req.body;
    
    const cartItem = await CartService.addToCart(
      userId,
      product_variant_id,
      quantity || 1
    );
    
    // Get updated cart
    const cart = await CartService.getCart(userId);
    
    res.status(201).json({
      success: true,
      message: 'Item added to cart',
      data: {
        item: cartItem,
        cart,
      },
    });
  });
  
  /**
   * Update cart item quantity
   * PUT /api/v1/cart/update/:itemId
   */
  static updateQuantity = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    await CartService.updateQuantity(userId, itemId, quantity);
    
    // Get updated cart
    const cart = await CartService.getCart(userId);
    
    res.status(200).json({
      success: true,
      message: 'Cart updated',
      data: cart,
    });
  });
  
  /**
   * Remove item from cart
   * DELETE /api/v1/cart/remove/:itemId
   */
  static removeItem = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { itemId } = req.params;
    
    await CartService.removeItem(userId, itemId);
    
    // Get updated cart
    const cart = await CartService.getCart(userId);
    
    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: cart,
    });
  });
  
  /**
   * Clear cart
   * DELETE /api/v1/cart/clear
   */
  static clearCart = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    
    await CartService.clearCart(userId);
    
    res.status(200).json({
      success: true,
      message: 'Cart cleared',
    });
  });
  
  /**
   * Validate cart
   * GET /api/v1/cart/validate
   */
  static validateCart = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    
    const validation = await CartService.validateCart(userId);
    
    res.status(200).json({
      success: true,
      data: validation,
    });
  });
  
  /**
   * Get cart count
   * GET /api/v1/cart/count
   */
  static getCartCount = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    
    const count = await CartService.getCartCount(userId);
    
    res.status(200).json({
      success: true,
      data: { count },
    });
  });
  
  /**
   * Merge guest cart (after login)
   * POST /api/v1/cart/merge
   */
  static mergeGuestCart = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { items } = req.body;
    
    const cart = await CartService.mergeGuestCart(userId, items);
    
    res.status(200).json({
      success: true,
      message: 'Guest cart merged successfully',
      data: cart,
    });
  });
}

export default CartController;
