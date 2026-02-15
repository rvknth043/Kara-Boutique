import { query } from '../config/database';
import { SizeChart, ProductSize } from '../types/shared.types';

export interface CreateSizeChartData {
  product_id: string;
  size: ProductSize;
  bust?: string;
  waist?: string;
  hips?: string;
  length?: string;
  shoulder?: string;
}

export class SizeChartModel {
  /**
   * Create new size chart entry
   */
  static async create(data: CreateSizeChartData): Promise<SizeChart> {
    const sql = `
      INSERT INTO size_charts (
        product_id, size, bust, waist, hips, length, shoulder
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      data.product_id,
      data.size,
      data.bust || null,
      data.waist || null,
      data.hips || null,
      data.length || null,
      data.shoulder || null,
    ];
    
    const result = await query(sql, values);
    return result.rows[0];
  }
  
  /**
   * Create multiple size chart entries
   */
  static async createMany(charts: CreateSizeChartData[]): Promise<SizeChart[]> {
    if (charts.length === 0) return [];
    
    const values: any[] = [];
    const placeholders: string[] = [];
    
    charts.forEach((chart, index) => {
      const base = index * 7;
      placeholders.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`
      );
      values.push(
        chart.product_id,
        chart.size,
        chart.bust || null,
        chart.waist || null,
        chart.hips || null,
        chart.length || null,
        chart.shoulder || null
      );
    });
    
    const sql = `
      INSERT INTO size_charts (product_id, size, bust, waist, hips, length, shoulder)
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;
    
    const result = await query(sql, values);
    return result.rows;
  }
  
  /**
   * Find size chart by ID
   */
  static async findById(id: string): Promise<SizeChart | null> {
    const sql = 'SELECT * FROM size_charts WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Get size chart for a product
   */
  static async getByProductId(productId: string): Promise<SizeChart[]> {
    const sql = `
      SELECT * FROM size_charts 
      WHERE product_id = $1 
      ORDER BY 
        CASE size
          WHEN 'S' THEN 1
          WHEN 'M' THEN 2
          WHEN 'L' THEN 3
          WHEN 'XL' THEN 4
          WHEN 'XXL' THEN 5
        END
    `;
    const result = await query(sql, [productId]);
    return result.rows;
  }
  
  /**
   * Get size chart for specific size
   */
  static async getBySize(
    productId: string,
    size: ProductSize
  ): Promise<SizeChart | null> {
    const sql = `
      SELECT * FROM size_charts 
      WHERE product_id = $1 AND size = $2
    `;
    const result = await query(sql, [productId, size]);
    return result.rows[0] || null;
  }
  
  /**
   * Update size chart
   */
  static async update(
    id: string,
    data: Partial<CreateSizeChartData>
  ): Promise<SizeChart | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (data.size !== undefined) {
      fields.push(`size = $${paramCount++}`);
      values.push(data.size);
    }
    
    if (data.bust !== undefined) {
      fields.push(`bust = $${paramCount++}`);
      values.push(data.bust);
    }
    
    if (data.waist !== undefined) {
      fields.push(`waist = $${paramCount++}`);
      values.push(data.waist);
    }
    
    if (data.hips !== undefined) {
      fields.push(`hips = $${paramCount++}`);
      values.push(data.hips);
    }
    
    if (data.length !== undefined) {
      fields.push(`length = $${paramCount++}`);
      values.push(data.length);
    }
    
    if (data.shoulder !== undefined) {
      fields.push(`shoulder = $${paramCount++}`);
      values.push(data.shoulder);
    }
    
    if (fields.length === 0) {
      return this.findById(id);
    }
    
    values.push(id);
    
    const sql = `
      UPDATE size_charts
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await query(sql, values);
    return result.rows[0] || null;
  }
  
  /**
   * Delete size chart entry
   */
  static async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM size_charts WHERE id = $1';
    const result = await query(sql, [id]);
    return (result.rowCount ?? 0) > 0;
  }
  
  /**
   * Delete all size charts for a product
   */
  static async deleteByProductId(productId: string): Promise<boolean> {
    const sql = 'DELETE FROM size_charts WHERE product_id = $1';
    const result = await query(sql, [productId]);
    return (result.rowCount ?? 0) > 0;
  }
  
  /**
   * Check if size chart exists for product and size
   */
  static async exists(productId: string, size: ProductSize): Promise<boolean> {
    const sql = `
      SELECT id FROM size_charts 
      WHERE product_id = $1 AND size = $2
    `;
    const result = await query(sql, [productId, size]);
    return result.rows.length > 0;
  }
}

export default SizeChartModel;
