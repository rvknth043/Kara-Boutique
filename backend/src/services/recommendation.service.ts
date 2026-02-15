import { query } from '../config/database';

export interface RecommendationResult {
  product_id: string;
  product_name: string;
  product_slug: string;
  base_price: number;
  discount_price: number | null;
  product_image: string;
  score: number;
  reason: string;
}

export class RecommendationService {
  /**
   * Get personalized recommendations for a user
   */
  static async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<RecommendationResult[]> {
    // Collaborative filtering approach
    const recommendations = await this.collaborativeFiltering(userId, limit);

    if (recommendations.length < limit) {
      // Fill with trending products if not enough recommendations
      const trending = await this.getTrendingProducts(limit - recommendations.length);
      recommendations.push(...trending);
    }

    return recommendations;
  }

  /**
   * Collaborative filtering - "Users who bought this also bought..."
   */
  private static async collaborativeFiltering(
    userId: string,
    limit: number
  ): Promise<RecommendationResult[]> {
    const sql = `
      WITH user_orders AS (
        -- Get products the user has purchased
        SELECT DISTINCT oi.product_variant_id, pv.product_id
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN product_variants pv ON oi.product_variant_id = pv.id
        WHERE o.user_id = $1
      ),
      similar_users AS (
        -- Find users who bought similar products
        SELECT DISTINCT o.user_id, COUNT(*) as common_products
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN product_variants pv ON oi.product_variant_id = pv.id
        WHERE pv.product_id IN (SELECT product_id FROM user_orders)
          AND o.user_id != $1
        GROUP BY o.user_id
        HAVING COUNT(*) >= 2
        ORDER BY common_products DESC
        LIMIT 50
      ),
      recommended_products AS (
        -- Get products purchased by similar users
        SELECT 
          pv.product_id,
          COUNT(*) as purchase_count
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN product_variants pv ON oi.product_variant_id = pv.id
        WHERE o.user_id IN (SELECT user_id FROM similar_users)
          AND pv.product_id NOT IN (SELECT product_id FROM user_orders)
        GROUP BY pv.product_id
        ORDER BY purchase_count DESC
        LIMIT $2
      )
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.slug as product_slug,
        p.base_price,
        p.discount_price,
        pi.image_url as product_image,
        rp.purchase_count as score,
        'Recommended based on your purchase history' as reason
      FROM recommended_products rp
      JOIN products p ON rp.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      WHERE p.is_active = true
    `;

    const result = await query(sql, [userId, limit]);
    return result.rows;
  }

  /**
   * Content-based filtering - Similar products
   */
  static async getSimilarProducts(
    productId: string,
    limit: number = 6
  ): Promise<RecommendationResult[]> {
    const sql = `
      WITH product_info AS (
        SELECT category_id, base_price FROM products WHERE id = $1
      )
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.slug as product_slug,
        p.base_price,
        p.discount_price,
        pi.image_url as product_image,
        (
          CASE 
            WHEN ABS(p.base_price - product_info.base_price) < 1000 THEN 10
            WHEN ABS(p.base_price - product_info.base_price) < 2000 THEN 8
            ELSE 5
          END
        ) as score,
        'Similar style and price range' as reason
      FROM products p
      CROSS JOIN product_info
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      WHERE p.category_id = product_info.category_id
        AND p.id != $1
        AND p.is_active = true
      ORDER BY 
        ABS(p.base_price - product_info.base_price),
        p.is_featured DESC,
        RANDOM()
      LIMIT $2
    `;

    const result = await query(sql, [productId, limit]);
    return result.rows;
  }

  /**
   * Get trending/popular products
   */
  static async getTrendingProducts(limit: number = 10): Promise<RecommendationResult[]> {
    const sql = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.slug as product_slug,
        p.base_price,
        p.discount_price,
        pi.image_url as product_image,
        COALESCE(order_count.total, 0) as score,
        'Trending now - Popular choice' as reason
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      LEFT JOIN (
        SELECT 
          pv.product_id,
          COUNT(*) as total
        FROM order_items oi
        JOIN product_variants pv ON oi.product_variant_id = pv.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY pv.product_id
      ) order_count ON p.id = order_count.product_id
      WHERE p.is_active = true
      ORDER BY 
        order_count.total DESC NULLS LAST,
        p.is_featured DESC,
        p.created_at DESC
      LIMIT $1
    `;

    const result = await query(sql, [limit]);
    return result.rows;
  }

  /**
   * Get "frequently bought together" recommendations
   */
  static async getFrequentlyBoughtTogether(
    productId: string,
    limit: number = 4
  ): Promise<RecommendationResult[]> {
    const sql = `
      WITH product_orders AS (
        -- Orders containing the specified product
        SELECT DISTINCT o.id as order_id
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN product_variants pv ON oi.product_variant_id = pv.id
        WHERE pv.product_id = $1
      ),
      bundled_products AS (
        -- Products bought together with the specified product
        SELECT 
          pv.product_id,
          COUNT(DISTINCT po.order_id) as bundle_count
        FROM product_orders po
        JOIN order_items oi ON po.order_id = oi.order_id
        JOIN product_variants pv ON oi.product_variant_id = pv.id
        WHERE pv.product_id != $1
        GROUP BY pv.product_id
        HAVING COUNT(DISTINCT po.order_id) >= 2
        ORDER BY bundle_count DESC
        LIMIT $2
      )
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.slug as product_slug,
        p.base_price,
        p.discount_price,
        pi.image_url as product_image,
        bp.bundle_count as score,
        'Frequently bought together' as reason
      FROM bundled_products bp
      JOIN products p ON bp.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      WHERE p.is_active = true
    `;

    const result = await query(sql, [productId, limit]);
    return result.rows;
  }

  /**
   * Get recommendations based on browsing history
   */
  static async getBasedOnBrowsingHistory(
    userId: string,
    limit: number = 8
  ): Promise<RecommendationResult[]> {
    // This would require tracking user views in a separate table
    // For now, we'll use wishlist as a proxy for browsing interest
    const sql = `
      WITH wishlist_categories AS (
        SELECT DISTINCT p.category_id
        FROM wishlist w
        JOIN products p ON w.product_id = p.id
        WHERE w.user_id = $1
      )
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.slug as product_slug,
        p.base_price,
        p.discount_price,
        pi.image_url as product_image,
        (p.is_featured::int * 10 + RANDOM() * 5) as score,
        'Based on items in your wishlist' as reason
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      WHERE p.category_id IN (SELECT category_id FROM wishlist_categories)
        AND p.id NOT IN (SELECT product_id FROM wishlist WHERE user_id = $1)
        AND p.is_active = true
      ORDER BY score DESC, p.created_at DESC
      LIMIT $2
    `;

    const result = await query(sql, [userId, limit]);
    return result.rows;
  }

  /**
   * Get new arrivals
   */
  static async getNewArrivals(limit: number = 12): Promise<RecommendationResult[]> {
    const sql = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.slug as product_slug,
        p.base_price,
        p.discount_price,
        pi.image_url as product_image,
        EXTRACT(EPOCH FROM (NOW() - p.created_at)) as score,
        'New Arrival' as reason
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      WHERE p.is_active = true
        AND p.created_at >= NOW() - INTERVAL '30 days'
      ORDER BY p.created_at DESC
      LIMIT $1
    `;

    const result = await query(sql, [limit]);
    return result.rows;
  }

  /**
   * Get best deals (highest discount percentage)
   */
  static async getBestDeals(limit: number = 10): Promise<RecommendationResult[]> {
    const sql = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.slug as product_slug,
        p.base_price,
        p.discount_price,
        pi.image_url as product_image,
        ROUND(((p.base_price - p.discount_price) / p.base_price * 100)::numeric, 0) as score,
        CONCAT(ROUND(((p.base_price - p.discount_price) / p.base_price * 100)::numeric, 0), '% OFF') as reason
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      WHERE p.is_active = true
        AND p.discount_price IS NOT NULL
        AND p.discount_price < p.base_price
      ORDER BY score DESC
      LIMIT $1
    `;

    const result = await query(sql, [limit]);
    return result.rows;
  }

  /**
   * Get complete your look recommendations
   */
  static async getCompleteTheLook(
    productId: string,
    limit: number = 4
  ): Promise<RecommendationResult[]> {
    // Get complementary products from different categories
    const sql = `
      WITH product_category AS (
        SELECT category_id FROM products WHERE id = $1
      )
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.slug as product_slug,
        p.base_price,
        p.discount_price,
        pi.image_url as product_image,
        (p.is_featured::int * 10 + RANDOM() * 5) as score,
        'Complete your look' as reason
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      WHERE p.category_id != (SELECT category_id FROM product_category)
        AND p.category_id IN (
          SELECT id FROM categories 
          WHERE slug IN ('dupattas', 'accessories')
        )
        AND p.is_active = true
      ORDER BY score DESC
      LIMIT $2
    `;

    const result = await query(sql, [productId, limit]);
    return result.rows;
  }
}

export default RecommendationService;
