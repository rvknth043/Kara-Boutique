import { query } from '../config/database';
import { Review } from '../types/shared.types';

export interface CreateReviewData {
  user_id: string;
  product_id: string;
  order_id: string;
  rating: number;
  review_text?: string;
}

export interface ReviewWithUser extends Review {
  user_name: string;
  user_email: string;
  product_name: string;
}

export class ReviewModel {
  /**
   * Create review
   */
  static async create(data: CreateReviewData): Promise<Review> {
    const sql = `
      INSERT INTO reviews (user_id, product_id, order_id, rating, review_text, is_verified)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
    `;
    
    const values = [
      data.user_id,
      data.product_id,
      data.order_id,
      data.rating,
      data.review_text || null,
    ];
    
    const result = await query(sql, values);
    return result.rows[0];
  }
  
  /**
   * Get product reviews
   */
  static async getProductReviews(
    productId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ reviews: ReviewWithUser[]; total: number; average_rating: number }> {
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT 
        r.*,
        u.full_name as user_name,
        u.email as user_email,
        p.name as product_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      WHERE r.product_id = $1 AND r.is_flagged = false
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const countSql = `
      SELECT COUNT(*) as total, AVG(rating) as avg_rating
      FROM reviews
      WHERE product_id = $1 AND is_flagged = false
    `;
    
    const [reviewsResult, statsResult] = await Promise.all([
      query(sql, [productId, limit, offset]),
      query(countSql, [productId]),
    ]);
    
    return {
      reviews: reviewsResult.rows,
      total: parseInt(statsResult.rows[0].total),
      average_rating: parseFloat(statsResult.rows[0].avg_rating || 0),
    };
  }
  
  /**
   * Get user reviews
   */
  static async getUserReviews(userId: string): Promise<ReviewWithUser[]> {
    const sql = `
      SELECT 
        r.*,
        u.full_name as user_name,
        u.email as user_email,
        p.name as product_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
    `;
    
    const result = await query(sql, [userId]);
    return result.rows;
  }
  
  /**
   * Check if user can review product
   */
  static async canUserReview(userId: string, productId: string): Promise<boolean> {
    // Check if user has purchased and received the product
    const sql = `
      SELECT EXISTS(
        SELECT 1 FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN product_variants pv ON oi.product_variant_id = pv.id
        WHERE o.user_id = $1 
          AND pv.product_id = $2
          AND o.order_status = 'delivered'
      ) as can_review
    `;
    
    const result = await query(sql, [userId, productId]);
    return result.rows[0].can_review;
  }
  
  /**
   * Check if user has already reviewed
   */
  static async hasUserReviewed(userId: string, productId: string): Promise<boolean> {
    const sql = `
      SELECT EXISTS(
        SELECT 1 FROM reviews
        WHERE user_id = $1 AND product_id = $2
      ) as has_reviewed
    `;
    
    const result = await query(sql, [userId, productId]);
    return result.rows[0].has_reviewed;
  }
  
  /**
   * Flag review
   */
  static async flagReview(reviewId: string): Promise<Review | null> {
    const sql = `
      UPDATE reviews
      SET is_flagged = true
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(sql, [reviewId]);
    return result.rows[0] || null;
  }
  
  /**
   * Delete review
   */
  static async delete(reviewId: string, userId: string): Promise<boolean> {
    const sql = `
      DELETE FROM reviews
      WHERE id = $1 AND user_id = $2
    `;
    
    const result = await query(sql, [reviewId, userId]);
    return (result.rowCount ?? 0) > 0;
  }
  
  /**
   * Get flagged reviews (admin)
   */
  static async getFlaggedReviews(): Promise<ReviewWithUser[]> {
    const sql = `
      SELECT 
        r.*,
        u.full_name as user_name,
        u.email as user_email,
        p.name as product_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      WHERE r.is_flagged = true
      ORDER BY r.created_at DESC
    `;
    
    const result = await query(sql);
    return result.rows;
  }
}

export default ReviewModel;
