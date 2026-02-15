import { query } from '../config/database';

export class AnalyticsService {
  /**
   * Get dashboard overview
   */
  static async getDashboardOverview(dateFrom?: Date, dateTo?: Date) {
    let whereClause = '';
    const values: any[] = [];
    
    if (dateFrom && dateTo) {
      whereClause = 'WHERE created_at >= $1 AND created_at <= $2';
      values.push(dateFrom, dateTo);
    }
    
    // Get order statistics
    const orderStatsSql = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(final_amount) as total_revenue,
        AVG(final_amount) as average_order_value,
        COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN order_status = 'cancelled' THEN 1 END) as cancelled_orders,
        COUNT(CASE WHEN payment_method = 'COD' THEN 1 END) as cod_orders,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders
      FROM orders
      ${whereClause}
    `;
    
    const orderStats = await query(orderStatsSql, values);
    
    // Get customer statistics
    const customerStatsSql = `
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_customers_30d
      FROM users
      WHERE role = 'customer'
    `;
    
    const customerStats = await query(customerStatsSql);
    
    // Get product statistics
    const productStatsSql = `
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_products,
        COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_products
      FROM products
    `;
    
    const productStats = await query(productStatsSql);
    
    // Get low stock count
    const lowStockSql = `
      SELECT COUNT(*) as low_stock_count
      FROM product_variants
      WHERE (stock_quantity - reserved_quantity) <= 10 AND is_active = true
    `;
    
    const lowStockStats = await query(lowStockSql);
    
    return {
      orders: {
        total: parseInt(orderStats.rows[0].total_orders),
        revenue: parseFloat(orderStats.rows[0].total_revenue || 0),
        average_value: parseFloat(orderStats.rows[0].average_order_value || 0),
        delivered: parseInt(orderStats.rows[0].delivered_orders),
        cancelled: parseInt(orderStats.rows[0].cancelled_orders),
        cod_orders: parseInt(orderStats.rows[0].cod_orders),
        paid_orders: parseInt(orderStats.rows[0].paid_orders),
      },
      customers: {
        total: parseInt(customerStats.rows[0].total_customers),
        new_last_30_days: parseInt(customerStats.rows[0].new_customers_30d),
      },
      products: {
        total: parseInt(productStats.rows[0].total_products),
        active: parseInt(productStats.rows[0].active_products),
        featured: parseInt(productStats.rows[0].featured_products),
        low_stock: parseInt(lowStockStats.rows[0].low_stock_count),
      },
    };
  }
  
  /**
   * Get sales chart data
   */
  static async getSalesChartData(days: number = 30) {
    const sql = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        SUM(final_amount) as revenue
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '${days} days'
        AND payment_status = 'paid'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    
    const result = await query(sql);
    
    return result.rows.map(row => ({
      date: row.date,
      orders: parseInt(row.order_count),
      revenue: parseFloat(row.revenue),
    }));
  }
  
  /**
   * Get top selling products
   */
  static async getTopSellingProducts(limit: number = 10) {
    const sql = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        COUNT(oi.id) as order_count,
        SUM(oi.quantity) as units_sold,
        SUM(oi.subtotal) as total_revenue
      FROM products p
      JOIN product_variants pv ON p.id = pv.product_id
      JOIN order_items oi ON pv.id = oi.product_variant_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.payment_status = 'paid'
      GROUP BY p.id, p.name, p.slug
      ORDER BY units_sold DESC
      LIMIT $1
    `;
    
    const result = await query(sql, [limit]);
    
    return result.rows.map(row => ({
      product_id: row.id,
      product_name: row.name,
      product_slug: row.slug,
      order_count: parseInt(row.order_count),
      units_sold: parseInt(row.units_sold),
      total_revenue: parseFloat(row.total_revenue),
    }));
  }
  
  /**
   * Get customer analytics
   */
  static async getCustomerAnalytics() {
    const sql = `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        COUNT(o.id) as total_orders,
        SUM(o.final_amount) as lifetime_value,
        MAX(o.created_at) as last_order_date
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role = 'customer'
      GROUP BY u.id, u.full_name, u.email
      HAVING COUNT(o.id) > 0
      ORDER BY lifetime_value DESC
      LIMIT 20
    `;
    
    const result = await query(sql);
    
    return result.rows.map(row => ({
      customer_id: row.id,
      customer_name: row.full_name,
      customer_email: row.email,
      total_orders: parseInt(row.total_orders),
      lifetime_value: parseFloat(row.lifetime_value || 0),
      last_order_date: row.last_order_date,
    }));
  }
  
  /**
   * Get category performance
   */
  static async getCategoryPerformance() {
    const sql = `
      SELECT 
        c.id,
        c.name,
        COUNT(DISTINCT p.id) as product_count,
        COUNT(oi.id) as order_count,
        SUM(oi.quantity) as units_sold,
        SUM(oi.subtotal) as total_revenue
      FROM categories c
      JOIN products p ON c.id = p.category_id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN order_items oi ON pv.id = oi.product_variant_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid'
      WHERE c.is_active = true
      GROUP BY c.id, c.name
      ORDER BY total_revenue DESC NULLS LAST
    `;
    
    const result = await query(sql);
    
    return result.rows.map(row => ({
      category_id: row.id,
      category_name: row.name,
      product_count: parseInt(row.product_count),
      order_count: parseInt(row.order_count || 0),
      units_sold: parseInt(row.units_sold || 0),
      total_revenue: parseFloat(row.total_revenue || 0),
    }));
  }
  
  /**
   * Get revenue by payment method
   */
  static async getRevenueByPaymentMethod() {
    const sql = `
      SELECT 
        payment_method,
        COUNT(*) as order_count,
        SUM(final_amount) as total_revenue
      FROM orders
      WHERE payment_status = 'paid'
      GROUP BY payment_method
      ORDER BY total_revenue DESC
    `;
    
    const result = await query(sql);
    
    return result.rows.map(row => ({
      payment_method: row.payment_method,
      order_count: parseInt(row.order_count),
      total_revenue: parseFloat(row.total_revenue),
    }));
  }
  
  /**
   * Get abandoned cart statistics
   */
  static async getAbandonedCartStats() {
    const sql = `
      SELECT 
        COUNT(DISTINCT user_id) as users_with_abandoned_carts,
        COUNT(*) as total_cart_items,
        SUM(c.quantity * COALESCE(p.discount_price, p.base_price)) as potential_revenue
      FROM cart c
      JOIN product_variants pv ON c.product_variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE c.updated_at < NOW() - INTERVAL '1 day'
    `;
    
    const result = await query(sql);
    
    return {
      users_with_abandoned_carts: parseInt(result.rows[0].users_with_abandoned_carts || 0),
      total_items: parseInt(result.rows[0].total_cart_items || 0),
      potential_revenue: parseFloat(result.rows[0].potential_revenue || 0),
    };
  }
  
  /**
   * Get conversion funnel
   */
  static async getConversionFunnel(days: number = 30) {
    const dateFilter = `WHERE created_at >= NOW() - INTERVAL '${days} days'`;
    
    const [users, carts, checkouts, orders, payments] = await Promise.all([
      query(`SELECT COUNT(DISTINCT id) as count FROM users WHERE role = 'customer' ${dateFilter}`),
      query(`SELECT COUNT(DISTINCT user_id) as count FROM cart`),
      query(`SELECT COUNT(DISTINCT user_id) as count FROM orders ${dateFilter}`),
      query(`SELECT COUNT(*) as count FROM orders ${dateFilter}`),
      query(`SELECT COUNT(*) as count FROM orders WHERE payment_status = 'paid' ${dateFilter}`),
    ]);
    
    return {
      new_users: parseInt(users.rows[0].count),
      users_with_carts: parseInt(carts.rows[0].count),
      users_who_checked_out: parseInt(checkouts.rows[0].count),
      total_orders: parseInt(orders.rows[0].count),
      completed_payments: parseInt(payments.rows[0].count),
    };
  }
}

export default AnalyticsService;
