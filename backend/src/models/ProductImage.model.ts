import { query } from '../config/database';
import { ProductImage } from '../types/shared.types';

export interface CreateImageData {
  product_id: string;
  image_url: string;
  color_variant?: string;
  display_order?: number;
  is_primary?: boolean;
}

export class ProductImageModel {
  /**
   * Create new image
   */
  static async create(data: CreateImageData): Promise<ProductImage> {
    const sql = `
      INSERT INTO product_images (
        product_id, image_url, color_variant, display_order, is_primary
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      data.product_id,
      data.image_url,
      data.color_variant || null,
      data.display_order || 0,
      data.is_primary || false,
    ];
    
    const result = await query(sql, values);
    return result.rows[0];
  }
  
  /**
   * Create multiple images
   */
  static async createMany(images: CreateImageData[]): Promise<ProductImage[]> {
    if (images.length === 0) return [];
    
    const values: any[] = [];
    const placeholders: string[] = [];
    
    images.forEach((image, index) => {
      const base = index * 5;
      placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
      values.push(
        image.product_id,
        image.image_url,
        image.color_variant || null,
        image.display_order || 0,
        image.is_primary || false
      );
    });
    
    const sql = `
      INSERT INTO product_images (product_id, image_url, color_variant, display_order, is_primary)
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;
    
    const result = await query(sql, values);
    return result.rows;
  }
  
  /**
   * Find image by ID
   */
  static async findById(id: string): Promise<ProductImage | null> {
    const sql = 'SELECT * FROM product_images WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Get all images for a product
   */
  static async getByProductId(productId: string): Promise<ProductImage[]> {
    const sql = `
      SELECT * FROM product_images 
      WHERE product_id = $1 
      ORDER BY display_order ASC, created_at ASC
    `;
    const result = await query(sql, [productId]);
    return result.rows;
  }
  
  /**
   * Get images by color variant
   */
  static async getByColorVariant(
    productId: string,
    colorVariant: string
  ): Promise<ProductImage[]> {
    const sql = `
      SELECT * FROM product_images 
      WHERE product_id = $1 
        AND (color_variant = $2 OR color_variant IS NULL)
      ORDER BY display_order ASC, created_at ASC
    `;
    const result = await query(sql, [productId, colorVariant]);
    return result.rows;
  }
  
  /**
   * Get primary image for product
   */
  static async getPrimaryImage(productId: string): Promise<ProductImage | null> {
    const sql = `
      SELECT * FROM product_images 
      WHERE product_id = $1 AND is_primary = true
      LIMIT 1
    `;
    const result = await query(sql, [productId]);
    return result.rows[0] || null;
  }
  
  /**
   * Set primary image (unsets other primary images)
   */
  static async setPrimary(id: string, productId: string): Promise<ProductImage | null> {
    // First, unset all primary images for this product
    await query(
      'UPDATE product_images SET is_primary = false WHERE product_id = $1',
      [productId]
    );
    
    // Then set the new primary
    const sql = `
      UPDATE product_images
      SET is_primary = true
      WHERE id = $1
      RETURNING *
    `;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Update image
   */
  static async update(
    id: string,
    data: Partial<CreateImageData>
  ): Promise<ProductImage | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (data.image_url !== undefined) {
      fields.push(`image_url = $${paramCount++}`);
      values.push(data.image_url);
    }
    
    if (data.color_variant !== undefined) {
      fields.push(`color_variant = $${paramCount++}`);
      values.push(data.color_variant);
    }
    
    if (data.display_order !== undefined) {
      fields.push(`display_order = $${paramCount++}`);
      values.push(data.display_order);
    }
    
    if (data.is_primary !== undefined) {
      fields.push(`is_primary = $${paramCount++}`);
      values.push(data.is_primary);
    }
    
    if (fields.length === 0) {
      return this.findById(id);
    }
    
    values.push(id);
    
    const sql = `
      UPDATE product_images
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await query(sql, values);
    return result.rows[0] || null;
  }
  
  /**
   * Delete image
   */
  static async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM product_images WHERE id = $1';
    const result = await query(sql, [id]);
    return (result.rowCount ?? 0) > 0;
  }
  
  /**
   * Delete all images for a product
   */
  static async deleteByProductId(productId: string): Promise<boolean> {
    const sql = 'DELETE FROM product_images WHERE product_id = $1';
    const result = await query(sql, [productId]);
    return (result.rowCount ?? 0) > 0;
  }
}

export default ProductImageModel;
