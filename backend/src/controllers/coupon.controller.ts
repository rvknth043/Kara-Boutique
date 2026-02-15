import { Request, Response } from 'express';
import CouponService from '../services/coupon.service';
import { asyncHandler } from '../middleware/errorHandler';

export class CouponController {
  /**
   * Validate coupon
   * POST /api/v1/coupons/validate
   */
  static validateCoupon = asyncHandler(async (req: Request, res: Response) => {
    const { code, order_value } = req.body;
    
    const result = await CouponService.validateCoupon(code, order_value);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  });
  
  /**
   * Create coupon (admin)
   * POST /api/v1/coupons
   */
  static createCoupon = asyncHandler(async (req: Request, res: Response) => {
    const coupon = await CouponService.createCoupon(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon,
    });
  });
  
  /**
   * Get all coupons (admin)
   * GET /api/v1/coupons
   */
  static getAllCoupons = asyncHandler(async (req: Request, res: Response) => {
    const { is_active, page, limit } = req.query;
    
    const result = await CouponService.getAllCoupons(
      is_active === 'true' ? true : is_active === 'false' ? false : undefined,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20
    );
    
    res.status(200).json({
      success: true,
      data: result,
    });
  });
  
  /**
   * Update coupon (admin)
   * PUT /api/v1/coupons/:id
   */
  static updateCoupon = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const coupon = await CouponService.updateCoupon(id, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon,
    });
  });
  
  /**
   * Toggle coupon status (admin)
   * PUT /api/v1/coupons/:id/toggle
   */
  static toggleCouponStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const coupon = await CouponService.toggleCouponStatus(id);
    
    res.status(200).json({
      success: true,
      message: 'Coupon status updated',
      data: coupon,
    });
  });
  
  /**
   * Delete coupon (admin)
   * DELETE /api/v1/coupons/:id
   */
  static deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    await CouponService.deleteCoupon(id);
    
    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  });
}

export default CouponController;
