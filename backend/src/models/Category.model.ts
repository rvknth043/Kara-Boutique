import { pool, query } from '../config/database';
import { Category } from '../types/shared.types';

export interface CreateCategoryData {
  name: string;
  slug: string;
  parent_id?: string;
  meta_title?: string;
  meta_description?: string;
  display_order?: number;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  parent_id?: string;
  meta_title?: string;
  meta_description?: string;
  is_active?: boolean;
  display_order?: number;
}

export class CategoryModel {
  /**
   * Create new category
   */
  static async create(data: CreateCategoryData): Promise<Category> {
    const sql = `
      INSERT INTO categories (name, slug, parent_id, meta_title, meta_description, display_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      data.name,
      data.slug,
      data.parent_id || null,
      data.meta_title || null,
      data.meta_description || null,
      data.display_order || 0,
    ];
    
    const result = await query(sql, values);
    return result.rows[0];
  }
  
  /**
   * Find category by ID
   */
  static async findById(id: string): Promise<Category | null> {
    const sql = 'SELECT * FROM categories WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Find category by slug
   */
  static async findBySlug(slug: string): Promise<Category | null> {
    const sql = 'SELECT * FROM categories WHERE slug = $1';
    const result = await query(sql, [slug]);
    return result.rows[0] || null;
  }
  
  /**
   * Get all categories with subcategories
   */
  static async getAll(includeInactive: boolean = false): Promise<Category[]> {
    let sql = 'SELECT * FROM categories';
    
    if (!includeInactive) {
      sql += ' WHERE is_active = true';
    }
    
    sql += ' ORDER BY display_order ASC, name ASC';
    
    const result = await query(sql);
    return result.rows;
  }
  
  /**
   * Get root categories (no parent)
   */
  static async getRootCategories(): Promise<Category[]> {
    const sql = `
      SELECT * FROM categories 
      WHERE parent_id IS NULL AND is_active = true
      ORDER BY display_order ASC, name ASC
    `;
    const result = await query(sql);
    return result.rows;
  }
  
  /**
   * Get subcategories by parent ID
   */
  static async getSubcategories(parentId: string): Promise<Category[]> {
    const sql = `
      SELECT * FROM categories 
      WHERE parent_id = $1 AND is_active = true
      ORDER BY display_order ASC, name ASC
    `;
    const result = await query(sql, [parentId]);
    return result.rows;
  }
  
  /**
   * Update category
   */
  static async update(id: string, data: UpdateCategoryData): Promise<Category | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (data.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    
    if (data.slug !== undefined) {
      fields.push(`slug = $${paramCount++}`);
      values.push(data.slug);
    }
    
    if (data.parent_id !== undefined) {
      fields.push(`parent_id = $${paramCount++}`);
      values.push(data.parent_id || null);
    }
    
    if (data.meta_title !== undefined) {
      fields.push(`meta_title = $${paramCount++}`);
      values.push(data.meta_title);
    }
    
    if (data.meta_description !== undefined) {
      fields.push(`meta_description = $${paramCount++}`);
      values.push(data.meta_description);
    }
    
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(data.is_active);
    }
    
    if (data.display_order !== undefined) {
      fields.push(`display_order = $${paramCount++}`);
      values.push(data.display_order);
    }
    
    if (fields.length === 0) {
      return this.findById(id);
    }
    
    values.push(id);
    
    const sql = `
      UPDATE categories
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await query(sql, values);
    return result.rows[0] || null;
  }
  
  /**
   * Delete category (soft delete)
   */
  static async delete(id: string): Promise<boolean> {
    const sql = 'UPDATE categories SET is_active = false WHERE id = $1';
    const result = await query(sql, [id]);
    return (result.rowCount ?? 0) > 0;
  }
  
  /**
   * Check if slug exists
   */
  static async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    let sql = 'SELECT id FROM categories WHERE slug = $1';
    const values: any[] = [slug];
    
    if (excludeId) {
      sql += ' AND id != $2';
      values.push(excludeId);
    }
    
    const result = await query(sql, values);
    return result.rows.length > 0;
  }
  
  /**
   * Get product count for category
   */
  static async getProductCount(categoryId: string): Promise<number> {
    const sql = `
      SELECT COUNT(*) as count 
      FROM products 
      WHERE category_id = $1 AND is_active = true
    `;
    const result = await query(sql, [categoryId]);
    return parseInt(result.rows[0].count);
  }
}

export default CategoryModel;
