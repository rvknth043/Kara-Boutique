import { query, transaction } from '../config/database';
import { PoolClient } from 'pg';

export interface CartItem {
  id: string;
  user_id: string;
  product_variant_id: string;
  quantity: number;
  created_at: Date;
  updated_at: Date;
}

export interface CartItemWithDetails extends CartItem {
  product_id: string;
  product_name: string;
  product_slug: string;
  product_base_price: number;
  product_discount_price?: number;
  variant_size: string;
  variant_color: string;
  variant_sku: string;
  variant_stock: number;
  variant_reserved: number;
  product_image?: string;
  subtotal: number;
}

export class CartModel {
  /**
   * Add item to cart
   */
  static async addItem(
    userId: string,
    productVariantId: string,
    quantity: number
  ): Promise<CartItem> {
    // Check if item already exists in cart
    const existingSql = `
      SELECT * FROM cart 
      WHERE user_id = $1 AND product_variant_id = $2
    `;
    const existing = await query(existingSql, [userId, productVariantId]);
    
    if (existing.rows.length > 0) {
      // Update quantity
      const updateSql = `
        UPDATE cart 
        SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2 AND product_variant_id = $3
        RETURNING *
      `;
      const result = await query(updateSql, [quantity, userId, productVariantId]);
      return result.rows[0];
    } else {
      // Insert new item
      const insertSql = `
        INSERT INTO cart (user_id, product_variant_id, quantity)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const result = await query(insertSql, [userId, productVariantId, quantity]);
      return result.rows[0];
    }
  }
  
  /**
   * Get user's cart with product details
   */
  static async getUserCart(userId: string): Promise<CartItemWithDetails[]> {
    const sql = `
      SELECT 
        c.*,
        p.id as product_id,
        p.name as product_name,
        p.slug as product_slug,
        p.base_price as product_base_price,
        p.discount_price as product_discount_price,
        pv.size as variant_size,
        pv.color as variant_color,
        pv.sku as variant_sku,
        pv.stock_quantity as variant_stock,
        pv.reserved_quantity as variant_reserved,
        pi.image_url as product_image,
        CASE 
          WHEN p.discount_price IS NOT NULL THEN p.discount_price * c.quantity
          ELSE p.base_price * c.quantity
        END as subtotal
      FROM cart c
      JOIN product_variants pv ON c.product_variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `;
    
    const result = await query(sql, [userId]);
    return result.rows;
  }
  
  /**
   * Get cart item by ID
   */
  static async getItemById(itemId: string, userId: string): Promise<CartItem | null> {
    const sql = `
      SELECT * FROM cart 
      WHERE id = $1 AND user_id = $2
    `;
    const result = await query(sql, [itemId, userId]);
    return result.rows[0] || null;
  }
  
  /**
   * Update cart item quantity
   */
  static async updateQuantity(
    itemId: string,
    userId: string,
    quantity: number
  ): Promise<CartItem | null> {
    const sql = `
      UPDATE cart 
      SET quantity = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND user_id = $3
      RETURNING *
    `;
    const result = await query(sql, [quantity, itemId, userId]);
    return result.rows[0] || null;
  }
  
  /**
   * Remove item from cart
   */
  static async removeItem(itemId: string, userId: string): Promise<boolean> {
    const sql = `
      DELETE FROM cart 
      WHERE id = $1 AND user_id = $2
    `;
    const result = await query(sql, [itemId, userId]);
    return (result.rowCount ?? 0) > 0;
  }
  
  /**
   * Clear entire cart
   */
  static async clearCart(userId: string): Promise<boolean> {
    const sql = 'DELETE FROM cart WHERE user_id = $1';
    const result = await query(sql, [userId]);
    return (result.rowCount ?? 0) > 0;
  }
  
  /**
   * Get cart item count
   */
  static async getItemCount(userId: string): Promise<number> {
    const sql = `
      SELECT COALESCE(SUM(quantity), 0) as count 
      FROM cart 
      WHERE user_id = $1
    `;
    const result = await query(sql, [userId]);
    return parseInt(result.rows[0].count);
  }
  
  /**
   * Get cart total
   */
  static async getCartTotal(userId: string): Promise<number> {
    const sql = `
      SELECT COALESCE(SUM(
        CASE 
          WHEN p.discount_price IS NOT NULL THEN p.discount_price * c.quantity
          ELSE p.base_price * c.quantity
        END
      ), 0) as total
      FROM cart c
      JOIN product_variants pv ON c.product_variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE c.user_id = $1
    `;
    const result = await query(sql, [userId]);
    return parseFloat(result.rows[0].total);
  }
  
  /**
   * Check if variant is in user's cart
   */
  static async isInCart(userId: string, productVariantId: string): Promise<boolean> {
    const sql = `
      SELECT id FROM cart 
      WHERE user_id = $1 AND product_variant_id = $2
    `;
    const result = await query(sql, [userId, productVariantId]);
    return result.rows.length > 0;
  }
  
  /**
   * Get cart item by variant
   */
  static async getItemByVariant(
    userId: string,
    productVariantId: string
  ): Promise<CartItem | null> {
    const sql = `
      SELECT * FROM cart 
      WHERE user_id = $1 AND product_variant_id = $2
    `;
    const result = await query(sql, [userId, productVariantId]);
    return result.rows[0] || null;
  }
  
  /**
   * Validate cart items (check stock availability)
   */
  static async validateCart(userId: string): Promise<{
    valid: boolean;
    issues: Array<{
      item_id: string;
      product_name: string;
      variant: string;
      requested: number;
      available: number;
    }>;
  }> {
    const sql = `
      SELECT 
        c.id as item_id,
        p.name as product_name,
        CONCAT(pv.size, ' / ', pv.color) as variant,
        c.quantity as requested,
        (pv.stock_quantity - pv.reserved_quantity) as available
      FROM cart c
      JOIN product_variants pv ON c.product_variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE c.user_id = $1 
        AND c.quantity > (pv.stock_quantity - pv.reserved_quantity)
    `;
    
    const result = await query(sql, [userId]);
    
    return {
      valid: result.rows.length === 0,
      issues: result.rows,
    };
  }
  
  /**
   * Merge guest cart to user cart
   */
  static async mergeGuestCart(
    userId: string,
    guestCartItems: Array<{ product_variant_id: string; quantity: number }>
  ): Promise<void> {
    for (const item of guestCartItems) {
      await this.addItem(userId, item.product_variant_id, item.quantity);
    }
  }
}

export default CartModel;
