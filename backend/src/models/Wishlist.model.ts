import { query } from '../config/database';

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  added_at: Date;
}

export interface WishlistItemWithDetails extends WishlistItem {
  product_name: string;
  product_slug: string;
  product_base_price: number;
  product_discount_price?: number;
  product_image?: string;
  is_active: boolean;
  is_in_stock: boolean;
  category_name: string;
}

export class WishlistModel {
  /**
   * Add product to wishlist
   */
  static async addItem(userId: string, productId: string): Promise<WishlistItem> {
    // Check if already exists
    const existingSql = `
      SELECT * FROM wishlist 
      WHERE user_id = $1 AND product_id = $2
    `;
    const existing = await query(existingSql, [userId, productId]);
    
    if (existing.rows.length > 0) {
      return existing.rows[0];
    }
    
    // Add new item
    const insertSql = `
      INSERT INTO wishlist (user_id, product_id)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await query(insertSql, [userId, productId]);
    return result.rows[0];
  }
  
  /**
   * Get user's wishlist with product details
   */
  static async getUserWishlist(userId: string): Promise<WishlistItemWithDetails[]> {
    const sql = `
      SELECT 
        w.*,
        p.name as product_name,
        p.slug as product_slug,
        p.base_price as product_base_price,
        p.discount_price as product_discount_price,
        p.is_active,
        c.name as category_name,
        pi.image_url as product_image,
        EXISTS(
          SELECT 1 FROM product_variants pv 
          WHERE pv.product_id = p.id 
            AND pv.is_active = true 
            AND (pv.stock_quantity - pv.reserved_quantity) > 0
        ) as is_in_stock
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      WHERE w.user_id = $1
      ORDER BY w.added_at DESC
    `;
    
    const result = await query(sql, [userId]);
    return result.rows;
  }
  
  /**
   * Remove item from wishlist
   */
  static async removeItem(userId: string, productId: string): Promise<boolean> {
    const sql = `
      DELETE FROM wishlist 
      WHERE user_id = $1 AND product_id = $2
    `;
    const result = await query(sql, [userId, productId]);
    return (result.rowCount ?? 0) > 0;
  }
  
  /**
   * Remove item by wishlist ID
   */
  static async removeById(itemId: string, userId: string): Promise<boolean> {
    const sql = `
      DELETE FROM wishlist 
      WHERE id = $1 AND user_id = $2
    `;
    const result = await query(sql, [itemId, userId]);
    return (result.rowCount ?? 0) > 0;
  }
  
  /**
   * Clear entire wishlist
   */
  static async clearWishlist(userId: string): Promise<boolean> {
    const sql = 'DELETE FROM wishlist WHERE user_id = $1';
    const result = await query(sql, [userId]);
    return (result.rowCount ?? 0) > 0;
  }
  
  /**
   * Check if product is in wishlist
   */
  static async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const sql = `
      SELECT id FROM wishlist 
      WHERE user_id = $1 AND product_id = $2
    `;
    const result = await query(sql, [userId, productId]);
    return result.rows.length > 0;
  }
  
  /**
   * Get wishlist item count
   */
  static async getItemCount(userId: string): Promise<number> {
    const sql = `
      SELECT COUNT(*) as count 
      FROM wishlist 
      WHERE user_id = $1
    `;
    const result = await query(sql, [userId]);
    return parseInt(result.rows[0].count);
  }
  
  /**
   * Move wishlist item to cart
   */
  static async moveToCart(
    userId: string,
    productId: string,
    variantId: string
  ): Promise<{ removed: boolean }> {
    const sql = `
      DELETE FROM wishlist 
      WHERE user_id = $1 AND product_id = $2
      RETURNING *
    `;
    const result = await query(sql, [userId, productId]);
    return {
      removed: result.rows.length > 0,
    };
  }
  
  /**
   * Get wishlist items by product IDs
   */
  static async getItemsByProductIds(
    userId: string,
    productIds: string[]
  ): Promise<WishlistItem[]> {
    if (productIds.length === 0) return [];
    
    const sql = `
      SELECT * FROM wishlist 
      WHERE user_id = $1 AND product_id = ANY($2)
    `;
    const result = await query(sql, [userId, productIds]);
    return result.rows;
  }
}

export default WishlistModel;
