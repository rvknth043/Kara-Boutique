import { query } from '../config/database';

export interface SalesChartData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
}

export interface CategoryPerformance {
  category_name: string;
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  percentage_of_total: number;
}

export interface ProductPerformance {
  product_id: string;
  product_name: string;
  total_revenue: number;
  units_sold: number;
  average_rating: number;
  conversion_rate: number;
}

export interface CustomerSegment {
  segment: string;
  customer_count: number;
  total_revenue: number;
  average_order_value: number;
  lifetime_value: number;
}

export class AdvancedAnalyticsService {
  /**
   * Get sales trend data for charts
   */
  static async getSalesTrend(days: number = 30): Promise<SalesChartData[]> {
    const sql = `
      WITH date_series AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '${days} days',
          CURRENT_DATE,
          INTERVAL '1 day'
        )::date AS date
      )
      SELECT 
        ds.date::text,
        COALESCE(SUM(o.final_amount), 0) as revenue,
        COUNT(DISTINCT o.id) as orders,
        COUNT(DISTINCT o.user_id) as customers
      FROM date_series ds
      LEFT JOIN orders o ON o.created_at::date = ds.date
        AND o.payment_status = 'paid'
      GROUP BY ds.date
      ORDER BY ds.date
    `;

    const result = await query(sql);
    return result.rows;
  }

  /**
   * Get revenue breakdown by category
   */
  static async getCategoryPerformance(): Promise<CategoryPerformance[]> {
    const sql = `
      WITH total_revenue AS (
        SELECT SUM(final_amount) as total
        FROM orders
        WHERE payment_status = 'paid'
          AND created_at >= NOW() - INTERVAL '30 days'
      )
      SELECT 
        c.name as category_name,
        COALESCE(SUM(oi.subtotal), 0) as total_revenue,
        COUNT(DISTINCT o.id) as total_orders,
        ROUND(AVG(o.final_amount)::numeric, 2) as average_order_value,
        ROUND((COALESCE(SUM(oi.subtotal), 0) / NULLIF((SELECT total FROM total_revenue), 0) * 100)::numeric, 2) as percentage_of_total
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN order_items oi ON pv.id = oi.product_variant_id
      LEFT JOIN orders o ON oi.order_id = o.id
        AND o.payment_status = 'paid'
        AND o.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY c.id, c.name
      ORDER BY total_revenue DESC
    `;

    const result = await query(sql);
    return result.rows;
  }

  /**
   * Get product performance metrics
   */
  static async getProductPerformance(limit: number = 20): Promise<ProductPerformance[]> {
    const sql = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        COALESCE(SUM(oi.subtotal), 0) as total_revenue,
        COALESCE(SUM(oi.quantity), 0) as units_sold,
        ROUND(AVG(r.rating)::numeric, 1) as average_rating,
        ROUND((
          COUNT(DISTINCT CASE WHEN o.id IS NOT NULL THEN o.user_id END)::numeric / 
          NULLIF(COUNT(DISTINCT w.user_id), 0) * 100
        )::numeric, 2) as conversion_rate
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN order_items oi ON pv.id = oi.product_variant_id
      LEFT JOIN orders o ON oi.order_id = o.id
        AND o.payment_status = 'paid'
        AND o.created_at >= NOW() - INTERVAL '30 days'
      LEFT JOIN reviews r ON p.id = r.product_id
      LEFT JOIN wishlist w ON p.id = w.product_id
        AND w.created_at >= NOW() - INTERVAL '30 days'
      WHERE p.is_active = true
      GROUP BY p.id, p.name
      ORDER BY total_revenue DESC
      LIMIT $1
    `;

    const result = await query(sql, [limit]);
    return result.rows;
  }

  /**
   * Get customer segments
   */
  static async getCustomerSegments(): Promise<CustomerSegment[]> {
    const sql = `
      WITH customer_stats AS (
        SELECT 
          u.id,
          COUNT(o.id) as order_count,
          COALESCE(SUM(o.final_amount), 0) as total_spent
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
          AND o.payment_status = 'paid'
        WHERE u.role = 'customer'
        GROUP BY u.id
      )
      SELECT 
        CASE 
          WHEN total_spent >= 50000 THEN 'VIP'
          WHEN total_spent >= 20000 THEN 'Premium'
          WHEN total_spent >= 5000 THEN 'Regular'
          WHEN order_count > 0 THEN 'New'
          ELSE 'Inactive'
        END as segment,
        COUNT(*) as customer_count,
        COALESCE(SUM(total_spent), 0) as total_revenue,
        ROUND(AVG(total_spent)::numeric, 2) as average_order_value,
        ROUND(AVG(total_spent)::numeric, 2) as lifetime_value
      FROM customer_stats
      GROUP BY segment
      ORDER BY 
        CASE segment
          WHEN 'VIP' THEN 1
          WHEN 'Premium' THEN 2
          WHEN 'Regular' THEN 3
          WHEN 'New' THEN 4
          ELSE 5
        END
    `;

    const result = await query(sql);
    return result.rows;
  }

  /**
   * Get hourly order distribution
   */
  static async getHourlyOrderDistribution() {
    const sql = `
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as order_count,
        SUM(final_amount) as revenue
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '7 days'
        AND payment_status = 'paid'
      GROUP BY hour
      ORDER BY hour
    `;

    const result = await query(sql);
    return result.rows;
  }

  /**
   * Get day of week performance
   */
  static async getDayOfWeekPerformance() {
    const sql = `
      SELECT 
        TO_CHAR(created_at, 'Day') as day_name,
        EXTRACT(DOW FROM created_at) as day_number,
        COUNT(*) as order_count,
        SUM(final_amount) as revenue,
        ROUND(AVG(final_amount)::numeric, 2) as average_order_value
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '30 days'
        AND payment_status = 'paid'
      GROUP BY day_name, day_number
      ORDER BY day_number
    `;

    const result = await query(sql);
    return result.rows;
  }

  /**
   * Get payment method distribution
   */
  static async getPaymentMethodDistribution() {
    const sql = `
      SELECT 
        payment_method,
        COUNT(*) as order_count,
        SUM(final_amount) as total_revenue,
        ROUND((COUNT(*)::numeric / (SELECT COUNT(*) FROM orders WHERE payment_status = 'paid') * 100)::numeric, 2) as percentage
      FROM orders
      WHERE payment_status = 'paid'
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY payment_method
      ORDER BY order_count DESC
    `;

    const result = await query(sql);
    return result.rows;
  }

  /**
   * Get average order value trend
   */
  static async getAOVTrend(days: number = 30) {
    const sql = `
      SELECT 
        DATE_TRUNC('day', created_at)::date as date,
        ROUND(AVG(final_amount)::numeric, 2) as average_order_value,
        COUNT(*) as order_count
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '${days} days'
        AND payment_status = 'paid'
      GROUP BY date
      ORDER BY date
    `;

    const result = await query(sql);
    return result.rows;
  }

  /**
   * Get customer retention metrics
   */
  static async getRetentionMetrics() {
    const sql = `
      WITH first_orders AS (
        SELECT 
          user_id,
          MIN(created_at) as first_order_date
        FROM orders
        WHERE payment_status = 'paid'
        GROUP BY user_id
      ),
      cohorts AS (
        SELECT 
          DATE_TRUNC('month', first_order_date) as cohort_month,
          COUNT(DISTINCT user_id) as cohort_size
        FROM first_orders
        WHERE first_order_date >= NOW() - INTERVAL '12 months'
        GROUP BY cohort_month
      ),
      repeat_customers AS (
        SELECT 
          DATE_TRUNC('month', fo.first_order_date) as cohort_month,
          EXTRACT(MONTH FROM AGE(o.created_at, fo.first_order_date)) as months_since_first,
          COUNT(DISTINCT o.user_id) as returning_customers
        FROM orders o
        JOIN first_orders fo ON o.user_id = fo.user_id
        WHERE o.created_at > fo.first_order_date
          AND o.payment_status = 'paid'
          AND fo.first_order_date >= NOW() - INTERVAL '12 months'
        GROUP BY cohort_month, months_since_first
      )
      SELECT 
        c.cohort_month::text,
        c.cohort_size,
        rc.months_since_first,
        rc.returning_customers,
        ROUND((rc.returning_customers::numeric / c.cohort_size * 100)::numeric, 2) as retention_rate
      FROM cohorts c
      LEFT JOIN repeat_customers rc ON c.cohort_month = rc.cohort_month
      ORDER BY c.cohort_month, rc.months_since_first
    `;

    const result = await query(sql);
    return result.rows;
  }

  /**
   * Get conversion funnel data
   */
  static async getConversionFunnel(days: number = 30) {
    const sql = `
      WITH funnel_data AS (
        SELECT 
          (SELECT COUNT(DISTINCT id) FROM users 
           WHERE created_at >= NOW() - INTERVAL '${days} days') as registrations,
          (SELECT COUNT(DISTINCT user_id) FROM cart 
           WHERE created_at >= NOW() - INTERVAL '${days} days') as added_to_cart,
          (SELECT COUNT(DISTINCT user_id) FROM orders 
           WHERE created_at >= NOW() - INTERVAL '${days} days') as initiated_checkout,
          (SELECT COUNT(DISTINCT user_id) FROM orders 
           WHERE payment_status = 'paid'
             AND created_at >= NOW() - INTERVAL '${days} days') as completed_purchase
      )
      SELECT 
        'Registrations' as step,
        registrations as count,
        100.0 as percentage,
        1 as step_order
      FROM funnel_data
      UNION ALL
      SELECT 
        'Added to Cart',
        added_to_cart,
        ROUND((added_to_cart::numeric / NULLIF(registrations, 0) * 100)::numeric, 2),
        2
      FROM funnel_data
      UNION ALL
      SELECT 
        'Initiated Checkout',
        initiated_checkout,
        ROUND((initiated_checkout::numeric / NULLIF(added_to_cart, 0) * 100)::numeric, 2),
        3
      FROM funnel_data
      UNION ALL
      SELECT 
        'Completed Purchase',
        completed_purchase,
        ROUND((completed_purchase::numeric / NULLIF(initiated_checkout, 0) * 100)::numeric, 2),
        4
      FROM funnel_data
      ORDER BY step_order
    `;

    const result = await query(sql);
    return result.rows;
  }

  /**
   * Get top performing products by revenue
   */
  static async getTopPerformingProducts(limit: number = 10) {
    const sql = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        SUM(oi.subtotal) as total_revenue,
        SUM(oi.quantity) as units_sold,
        COUNT(DISTINCT o.id) as order_count,
        ROUND(AVG(r.rating)::numeric, 1) as average_rating
      FROM products p
      JOIN product_variants pv ON p.id = pv.product_id
      JOIN order_items oi ON pv.id = oi.product_variant_id
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE o.payment_status = 'paid'
        AND o.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY p.id, p.name, p.slug
      ORDER BY total_revenue DESC
      LIMIT $1
    `;

    const result = await query(sql, [limit]);
    return result.rows;
  }

  /**
   * Get coupon usage statistics
   */
  static async getCouponStatistics() {
    const sql = `
      SELECT 
        c.code,
        c.type,
        c.value,
        c.used_count,
        c.usage_limit,
        ROUND((c.used_count::numeric / NULLIF(c.usage_limit, 0) * 100)::numeric, 2) as usage_percentage,
        SUM(o.discount_amount) as total_discount_given,
        COUNT(o.id) as orders_with_coupon
      FROM coupons c
      LEFT JOIN orders o ON c.code = o.coupon_code
        AND o.created_at >= NOW() - INTERVAL '30 days'
        AND o.payment_status = 'paid'
      WHERE c.is_active = true
      GROUP BY c.id, c.code, c.type, c.value, c.used_count, c.usage_limit
      ORDER BY total_discount_given DESC
    `;

    const result = await query(sql);
    return result.rows;
  }
}

export default AdvancedAnalyticsService;
