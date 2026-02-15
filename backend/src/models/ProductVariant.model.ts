import { query } from '../config/database';
import { ProductVariant, ProductSize } from '../types/shared.types';

export interface CreateVariantData {
  product_id: string;
  size: ProductSize;
  color: string;
  stock_quantity: number;
  sku: string;
}

export interface UpdateVariantData {
  size?: ProductSize;
  color?: string;
  stock_quantity?: number;
  reserved_quantity?: number;
  sku?: string;
  is_active?: boolean;
}

export class ProductVariantModel {
  /**
   * Create new variant
   */
  static async create(data: CreateVariantData): Promise<ProductVariant> {
    const sql = `
      INSERT INTO product_variants (product_id, size, color, stock_quantity, sku)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      data.product_id,
      data.size,
      data.color,
      data.stock_quantity,
      data.sku,
    ];
    
    const result = await query(sql, values);
    return result.rows[0];
  }
  
  /**
   * Create multiple variants
   */
  static async createMany(variants: CreateVariantData[]): Promise<ProductVariant[]> {
    if (variants.length === 0) return [];
    
    const values: any[] = [];
    const placeholders: string[] = [];
    
    variants.forEach((variant, index) => {
      const base = index * 5;
      placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
      values.push(
        variant.product_id,
        variant.size,
        variant.color,
        variant.stock_quantity,
        variant.sku
      );
    });
    
    const sql = `
      INSERT INTO product_variants (product_id, size, color, stock_quantity, sku)
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;
    
    const result = await query(sql, values);
    return result.rows;
  }
  
  /**
   * Find variant by ID
   */
  static async findById(id: string): Promise<ProductVariant | null> {
    const sql = 'SELECT * FROM product_variants WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Find variant by SKU
   */
  static async findBySKU(sku: string): Promise<ProductVariant | null> {
    const sql = 'SELECT * FROM product_variants WHERE sku = $1';
    const result = await query(sql, [sku]);
    return result.rows[0] || null;
  }
  
  /**
   * Get all variants for a product
   */
  static async getByProductId(productId: string): Promise<ProductVariant[]> {
    const sql = `
      SELECT * FROM product_variants 
      WHERE product_id = $1 
      ORDER BY size ASC, color ASC
    `;
    const result = await query(sql, [productId]);
    return result.rows;
  }
  
  /**
   * Get available variants (in stock and active)
   */
  static async getAvailableVariants(productId: string): Promise<ProductVariant[]> {
    const sql = `
      SELECT * FROM product_variants 
      WHERE product_id = $1 
        AND is_active = true 
        AND (stock_quantity - reserved_quantity) > 0
      ORDER BY size ASC, color ASC
    `;
    const result = await query(sql, [productId]);
    return result.rows;
  }
  
  /**
   * Update variant
   */
  static async update(id: string, data: UpdateVariantData): Promise<ProductVariant | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (data.size !== undefined) {
      fields.push(`size = $${paramCount++}`);
      values.push(data.size);
    }
    
    if (data.color !== undefined) {
      fields.push(`color = $${paramCount++}`);
      values.push(data.color);
    }
    
    if (data.stock_quantity !== undefined) {
      fields.push(`stock_quantity = $${paramCount++}`);
      values.push(data.stock_quantity);
    }
    
    if (data.reserved_quantity !== undefined) {
      fields.push(`reserved_quantity = $${paramCount++}`);
      values.push(data.reserved_quantity);
    }
    
    if (data.sku !== undefined) {
      fields.push(`sku = $${paramCount++}`);
      values.push(data.sku);
    }
    
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(data.is_active);
    }
    
    if (fields.length === 0) {
      return this.findById(id);
    }
    
    values.push(id);
    
    const sql = `
      UPDATE product_variants
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await query(sql, values);
    return result.rows[0] || null;
  }
  
  /**
   * Update stock quantity
   */
  static async updateStock(
    id: string,
    quantityChange: number
  ): Promise<ProductVariant | null> {
    const sql = `
      UPDATE product_variants
      SET stock_quantity = stock_quantity + $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await query(sql, [quantityChange, id]);
    return result.rows[0] || null;
  }
  
  /**
   * Reserve stock (for checkout)
   */
  static async reserveStock(
    id: string,
    quantity: number
  ): Promise<ProductVariant | null> {
    const sql = `
      UPDATE product_variants
      SET reserved_quantity = reserved_quantity + $1
      WHERE id = $2 
        AND (stock_quantity - reserved_quantity) >= $1
      RETURNING *
    `;
    const result = await query(sql, [quantity, id]);
    return result.rows[0] || null;
  }
  
  /**
   * Release reserved stock
   */
  static async releaseStock(
    id: string,
    quantity: number
  ): Promise<ProductVariant | null> {
    const sql = `
      UPDATE product_variants
      SET reserved_quantity = GREATEST(reserved_quantity - $1, 0)
      WHERE id = $2
      RETURNING *
    `;
    const result = await query(sql, [quantity, id]);
    return result.rows[0] || null;
  }
  
  /**
   * Deduct stock (after order completion)
   */
  static async deductStock(
    id: string,
    quantity: number
  ): Promise<ProductVariant | null> {
    const sql = `
      UPDATE product_variants
      SET 
        stock_quantity = stock_quantity - $1,
        reserved_quantity = GREATEST(reserved_quantity - $1, 0)
      WHERE id = $2
      RETURNING *
    `;
    const result = await query(sql, [quantity, id]);
    return result.rows[0] || null;
  }
  
  /**
   * Check if variant has sufficient stock
   */
  static async hasStock(id: string, quantity: number): Promise<boolean> {
    const sql = `
      SELECT (stock_quantity - reserved_quantity) >= $1 as has_stock
      FROM product_variants
      WHERE id = $2
    `;
    const result = await query(sql, [quantity, id]);
    return result.rows[0]?.has_stock || false;
  }
  
  /**
   * Get low stock variants (below threshold)
   */
  static async getLowStock(threshold: number = 10): Promise<ProductVariant[]> {
    const sql = `
      SELECT pv.*, p.name as product_name
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      WHERE pv.is_active = true 
        AND (pv.stock_quantity - pv.reserved_quantity) <= $1
      ORDER BY (pv.stock_quantity - pv.reserved_quantity) ASC
    `;
    const result = await query(sql, [threshold]);
    return result.rows;
  }
  
  /**
   * Delete variant
   */
  static async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM product_variants WHERE id = $1';
    const result = await query(sql, [id]);
    return (result.rowCount ?? 0) > 0;
  }
  
  /**
   * Check if SKU exists
   */
  static async skuExists(sku: string, excludeId?: string): Promise<boolean> {
    let sql = 'SELECT id FROM product_variants WHERE sku = $1';
    const values: any[] = [sku];
    
    if (excludeId) {
      sql += ' AND id != $2';
      values.push(excludeId);
    }
    
    const result = await query(sql, values);
    return result.rows.length > 0;
  }
}

export default ProductVariantModel;
