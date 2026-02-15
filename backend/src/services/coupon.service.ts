import CouponModel, { CreateCouponData, CouponType } from '../models/Coupon.model';
import { AppError } from '../middleware/errorHandler';

export class CouponService {
  /**
   * Create new coupon (admin)
   */
  static async createCoupon(data: CreateCouponData) {
    // Validate dates
    const now = new Date();
    const validFrom = new Date(data.valid_from);
    const validUntil = new Date(data.valid_until);
    
    if (validFrom < now) {
      throw new AppError('Valid from date must be in the future', 400, 'INVALID_DATE');
    }
    
    if (validUntil <= validFrom) {
      throw new AppError('Valid until must be after valid from', 400, 'INVALID_DATE');
    }
    
    // Validate discount value
    if (data.type === CouponType.PERCENTAGE && data.value > 100) {
      throw new AppError('Percentage discount cannot exceed 100%', 400, 'INVALID_VALUE');
    }
    
    if (data.value <= 0) {
      throw new AppError('Discount value must be greater than 0', 400, 'INVALID_VALUE');
    }
    
    // Check if code already exists
    const existing = await CouponModel.findByCode(data.code);
    if (existing) {
      throw new AppError('Coupon code already exists', 400, 'DUPLICATE_CODE');
    }
    
    return await CouponModel.create(data);
  }
  
  /**
   * Validate coupon
   */
  static async validateCoupon(code: string, orderValue: number) {
    const validation = await CouponModel.validateCoupon(code, orderValue);
    
    if (!validation.valid) {
      throw new AppError(validation.reason || 'Invalid coupon', 400, 'INVALID_COUPON');
    }
    
    const discount = CouponModel.calculateDiscount(validation.coupon!, orderValue);
    const freeShipping = validation.coupon!.type === CouponType.FREE_SHIPPING;
    
    return {
      coupon: validation.coupon,
      discount,
      freeShipping,
      finalAmount: orderValue - discount,
    };
  }
  
  /**
   * Apply coupon to order
   */
  static async applyCouponToOrder(code: string, orderId: string, orderValue: number) {
    const result = await this.validateCoupon(code, orderValue);
    
    // Increment usage count
    await CouponModel.incrementUsage(code);
    
    return result;
  }
  
  /**
   * Validate and apply coupon (for checkout)
   */
  static async validateAndApplyCoupon(code: string, orderValue: number, userId?: string) {
    const result = await this.validateCoupon(code, orderValue);
    
    return {
      discount: result.discount,
      freeShipping: result.freeShipping,
      coupon: result.coupon,
    };
  }
  
  /**
   * Increment coupon usage
   */
  static async incrementUsage(code: string, userId?: string) {
    await CouponModel.incrementUsage(code);
  }
  
  /**
   * Get all coupons (admin)
   */
  static async getAllCoupons(isActive?: boolean, page: number = 1, limit: number = 20) {
    const result = await CouponModel.getAll(isActive, page, limit);
    
    return {
      coupons: result.coupons,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }
  
  /**
   * Update coupon (admin)
   */
  static async updateCoupon(id: string, data: Partial<CreateCouponData>) {
    const coupon = await CouponModel.update(id, data);
    
    if (!coupon) {
      throw new AppError('Coupon not found', 404, 'COUPON_NOT_FOUND');
    }
    
    return coupon;
  }
  
  /**
   * Toggle coupon status (admin)
   */
  static async toggleCouponStatus(id: string) {
    const coupon = await CouponModel.toggleActive(id);
    
    if (!coupon) {
      throw new AppError('Coupon not found', 404, 'COUPON_NOT_FOUND');
    }
    
    return coupon;
  }
  
  /**
   * Delete coupon (admin)
   */
  static async deleteCoupon(id: string) {
    const deleted = await CouponModel.delete(id);
    
    if (!deleted) {
      throw new AppError('Coupon not found', 404, 'COUPON_NOT_FOUND');
    }
    
    return { success: true };
  }
}

export default CouponService;
