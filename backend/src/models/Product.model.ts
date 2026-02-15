import { pool, query, transaction } from '../config/database';
import { Product, ProductWithDetails, Category } from '../types/shared.types';
import { PoolClient } from 'pg';

export interface CreateProductData {
  name: string;
  slug: string;
  description?: string;
  category_id: string;
  base_price: number;
  discount_price?: number;
  hsn_code?: string;
  is_featured?: boolean;
}

export interface UpdateProductData {
  name?: string;
  slug?: string;
  description?: string;
  category_id?: string;
  base_price?: number;
  discount_price?: number;
  hsn_code?: string;
  is_active?: boolean;
  is_featured?: boolean;
}

export interface ProductFilters {
  category_id?: string;
  min_price?: number;
  max_price?: number;
  is_featured?: boolean;
  search?: string;
}

export class ProductModel {
  /**
   * Create new product
   */
  static async create(data: CreateProductData): Promise<Product> {
    const sql = `
      INSERT INTO products (
        name, slug, description, category_id, base_price, 
        discount_price, hsn_code, is_featured
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      data.name,
      data.slug,
      data.description || null,
      data.category_id,
      data.base_price,
      data.discount_price || null,
      data.hsn_code || null,
      data.is_featured || false,
    ];
    
    const result = await query(sql, values);
    return result.rows[0];
  }
  
  /**
   * Find product by ID
   */
  static async findById(id: string): Promise<Product | null> {
    const sql = 'SELECT * FROM products WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Find product by slug
   */
  static async findBySlug(slug: string): Promise<Product | null> {
    const sql = 'SELECT * FROM products WHERE slug = $1';
    const result = await query(sql, [slug]);
    return result.rows[0] || null;
  }
  
  /**
   * Get product with full details (category, variants, images)
   */
  static async findByIdWithDetails(id: string): Promise<ProductWithDetails | null> {
    const sql = `
      SELECT 
        p.*,
        c.id as category_id, c.name as category_name, c.slug as category_slug,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', pi.id,
              'image_url', pi.image_url,
              'color_variant', pi.color_variant,
              'display_order', pi.display_order,
              'is_primary', pi.is_primary
            )
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'
        ) as images,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', pv.id,
              'size', pv.size,
              'color', pv.color,
              'stock_quantity', pv.stock_quantity,
              'reserved_quantity', pv.reserved_quantity,
              'sku', pv.sku,
              'is_active', pv.is_active
            )
          ) FILTER (WHERE pv.id IS NOT NULL),
          '[]'
        ) as variants,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'size', sc.size,
              'bust', sc.bust,
              'waist', sc.waist,
              'hips', sc.hips,
              'length', sc.length,
              'shoulder', sc.shoulder
            )
          ) FILTER (WHERE sc.id IS NOT NULL),
          '[]'
        ) as size_chart,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN size_charts sc ON p.id = sc.product_id
      LEFT JOIN reviews r ON p.id = r.product_id AND r.is_flagged = false
      WHERE p.id = $1
      GROUP BY p.id, c.id, c.name, c.slug
    `;
    
    const result = await query(sql, [id]);
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    
    return {
      ...row,
      category: {
        id: row.category_id,
        name: row.category_name,
        slug: row.category_slug,
      },
      avg_rating: parseFloat(row.avg_rating),
      review_count: parseInt(row.review_count),
    };
  }
  
  /**
   * Get all products with filters and pagination
   */
  static async getAll(
    filters: ProductFilters = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'created_at',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Promise<{ products: Product[]; total: number }> {
    const offset = (page - 1) * limit;
    
    const whereClauses: string[] = ['p.is_active = true'];
    const values: any[] = [];
    let paramCount = 1;
    
    // Category filter
    if (filters.category_id) {
      whereClauses.push(`p.category_id = $${paramCount++}`);
      values.push(filters.category_id);
    }
    
    // Price range filter
    if (filters.min_price !== undefined) {
      whereClauses.push(`p.base_price >= $${paramCount++}`);
      values.push(filters.min_price);
    }
    
    if (filters.max_price !== undefined) {
      whereClauses.push(`p.base_price <= $${paramCount++}`);
      values.push(filters.max_price);
    }
    
    // Featured filter
    if (filters.is_featured !== undefined) {
      whereClauses.push(`p.is_featured = $${paramCount++}`);
      values.push(filters.is_featured);
    }
    
    // Search filter
    if (filters.search) {
      whereClauses.push(`(
        to_tsvector('english', p.name || ' ' || COALESCE(p.description, '')) 
        @@ plainto_tsquery('english', $${paramCount++})
      )`);
      values.push(filters.search);
    }
    
    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    // Validate sort column
    const validSortColumns = ['created_at', 'base_price', 'name', 'view_count'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    
    const sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.${sortColumn} ${sortOrder}
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;
    
    const countSql = `
      SELECT COUNT(*) as total
      FROM products p
      ${whereClause}
    `;
    
    const [productsResult, countResult] = await Promise.all([
      query(sql, [...values, limit, offset]),
      query(countSql, values),
    ]);
    
    return {
      products: productsResult.rows,
      total: parseInt(countResult.rows[0].total),
    };
  }
  
  /**
   * Get featured products
   */
  static async getFeatured(limit: number = 10): Promise<Product[]> {
    const sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true AND p.is_featured = true
      ORDER BY p.created_at DESC
      LIMIT $1
    `;
    const result = await query(sql, [limit]);
    return result.rows;
  }
  
  /**
   * Search products
   */
  static async search(
    searchTerm: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ products: Product[]; total: number }> {
    return this.getAll(
      { search: searchTerm },
      page,
      limit
    );
  }
  
  /**
   * Update product
   */
  static async update(id: string, data: UpdateProductData): Promise<Product | null> {
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
    
    if (data.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    
    if (data.category_id !== undefined) {
      fields.push(`category_id = $${paramCount++}`);
      values.push(data.category_id);
    }
    
    if (data.base_price !== undefined) {
      fields.push(`base_price = $${paramCount++}`);
      values.push(data.base_price);
    }
    
    if (data.discount_price !== undefined) {
      fields.push(`discount_price = $${paramCount++}`);
      values.push(data.discount_price);
    }
    
    if (data.hsn_code !== undefined) {
      fields.push(`hsn_code = $${paramCount++}`);
      values.push(data.hsn_code);
    }
    
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(data.is_active);
    }
    
    if (data.is_featured !== undefined) {
      fields.push(`is_featured = $${paramCount++}`);
      values.push(data.is_featured);
    }
    
    if (fields.length === 0) {
      return this.findById(id);
    }
    
    values.push(id);
    
    const sql = `
      UPDATE products
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await query(sql, values);
    return result.rows[0] || null;
  }
  
  /**
   * Delete product (soft delete)
   */
  static async delete(id: string): Promise<boolean> {
    const sql = 'UPDATE products SET is_active = false WHERE id = $1';
    const result = await query(sql, [id]);
    return (result.rowCount ?? 0) > 0;
  }
  
  /**
   * Increment view count
   */
  static async incrementViewCount(id: string): Promise<void> {
    const sql = 'UPDATE products SET view_count = view_count + 1 WHERE id = $1';
    await query(sql, [id]);
  }
  
  /**
   * Check if slug exists
   */
  static async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    let sql = 'SELECT id FROM products WHERE slug = $1';
    const values: any[] = [slug];
    
    if (excludeId) {
      sql += ' AND id != $2';
      values.push(excludeId);
    }
    
    const result = await query(sql, values);
    return result.rows.length > 0;
  }
  
  /**
   * Get products by category
   */
  static async getByCategory(
    categoryId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ products: Product[]; total: number }> {
    return this.getAll({ category_id: categoryId }, page, limit);
  }
}

export default ProductModel;
