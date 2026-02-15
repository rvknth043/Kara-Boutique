import { query } from '../config/database';

export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
  FREE_SHIPPING = 'free_shipping',
}

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  min_order_value?: number;
  max_discount?: number;
  usage_limit?: number;
  used_count: number;
  valid_from: Date;
  valid_until: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCouponData {
  code: string;
  type: CouponType;
  value: number;
  min_order_value?: number;
  max_discount?: number;
  usage_limit?: number;
  valid_from: Date;
  valid_until: Date;
}

export class CouponModel {
  /**
   * Create coupon
   */
  static async create(data: CreateCouponData): Promise<Coupon> {
    const sql = `
      INSERT INTO coupons (
        code, type, value, min_order_value, max_discount,
        usage_limit, valid_from, valid_until, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING *
    `;
    
    const values = [
      data.code.toUpperCase(),
      data.type,
      data.value,
      data.min_order_value || null,
      data.max_discount || null,
      data.usage_limit || null,
      data.valid_from,
      data.valid_until,
    ];
    
    const result = await query(sql, values);
    return result.rows[0];
  }
  
  /**
   * Find coupon by code
   */
  static async findByCode(code: string): Promise<Coupon | null> {
    const sql = `
      SELECT * FROM coupons 
      WHERE code = $1 AND is_active = true
    `;
    const result = await query(sql, [code.toUpperCase()]);
    return result.rows[0] || null;
  }
  
  /**
   * Validate coupon
   */
  static async validateCoupon(code: string, orderValue: number): Promise<{
    valid: boolean;
    reason?: string;
    coupon?: Coupon;
  }> {
    const coupon = await this.findByCode(code);
    
    if (!coupon) {
      return { valid: false, reason: 'Invalid coupon code' };
    }
    
    const now = new Date();
    
    if (now < new Date(coupon.valid_from)) {
      return { valid: false, reason: 'Coupon not yet valid' };
    }
    
    if (now > new Date(coupon.valid_until)) {
      return { valid: false, reason: 'Coupon expired' };
    }
    
    if (coupon.min_order_value && orderValue < coupon.min_order_value) {
      return { 
        valid: false, 
        reason: `Minimum order value ₹${coupon.min_order_value} required` 
      };
    }
    
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return { valid: false, reason: 'Coupon usage limit reached' };
    }
    
    return { valid: true, coupon };
  }
  
  /**
   * Calculate discount
   */
  static calculateDiscount(coupon: Coupon, orderValue: number): number {
    let discount = 0;
    
    if (coupon.type === CouponType.PERCENTAGE) {
      discount = (orderValue * coupon.value) / 100;
      
      // Apply max discount if set
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else if (coupon.type === CouponType.FIXED) {
      discount = coupon.value;
    }
    
    // Discount cannot exceed order value
    return Math.min(discount, orderValue);
  }
  
  /**
   * Increment usage count
   */
  static async incrementUsage(code: string): Promise<void> {
    const sql = `
      UPDATE coupons 
      SET used_count = used_count + 1
      WHERE code = $1
    `;
    await query(sql, [code.toUpperCase()]);
  }
  
  /**
   * Get all coupons (admin)
   */
  static async getAll(
    isActive?: boolean,
    page: number = 1,
    limit: number = 20
  ): Promise<{ coupons: Coupon[]; total: number }> {
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    const values: any[] = [];
    
    if (isActive !== undefined) {
      whereClause = 'WHERE is_active = $1';
      values.push(isActive);
    }
    
    const sql = `
      SELECT * FROM coupons
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    
    const countSql = `
      SELECT COUNT(*) as total FROM coupons
      ${whereClause}
    `;
    
    const [couponsResult, countResult] = await Promise.all([
      query(sql, [...values, limit, offset]),
      query(countSql, values),
    ]);
    
    return {
      coupons: couponsResult.rows,
      total: parseInt(countResult.rows[0].total),
    };
  }
  
  /**
   * Update coupon
   */
  static async update(id: string, data: Partial<CreateCouponData>): Promise<Coupon | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (data.code !== undefined) {
      fields.push(`code = $${paramCount++}`);
      values.push(data.code.toUpperCase());
    }
    
    if (data.type !== undefined) {
      fields.push(`type = $${paramCount++}`);
      values.push(data.type);
    }
    
    if (data.value !== undefined) {
      fields.push(`value = $${paramCount++}`);
      values.push(data.value);
    }
    
    if (data.min_order_value !== undefined) {
      fields.push(`min_order_value = $${paramCount++}`);
      values.push(data.min_order_value);
    }
    
    if (data.max_discount !== undefined) {
      fields.push(`max_discount = $${paramCount++}`);
      values.push(data.max_discount);
    }
    
    if (data.usage_limit !== undefined) {
      fields.push(`usage_limit = $${paramCount++}`);
      values.push(data.usage_limit);
    }
    
    if (data.valid_from !== undefined) {
      fields.push(`valid_from = $${paramCount++}`);
      values.push(data.valid_from);
    }
    
    if (data.valid_until !== undefined) {
      fields.push(`valid_until = $${paramCount++}`);
      values.push(data.valid_until);
    }
    
    if (fields.length === 0) return null;
    
    values.push(id);
    
    const sql = `
      UPDATE coupons
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await query(sql, values);
    return result.rows[0] || null;
  }
  
  /**
   * Toggle active status
   */
  static async toggleActive(id: string): Promise<Coupon | null> {
    const sql = `
      UPDATE coupons
      SET is_active = NOT is_active
      WHERE id = $1
      RETURNING *
    `;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Delete coupon
   */
  static async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM coupons WHERE id = $1';
    const result = await query(sql, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}

export default CouponModel;
