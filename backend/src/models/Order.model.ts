import { query, transaction } from '../config/database';
import { PoolClient } from 'pg';
import { Order, OrderStatus, PaymentStatus, PaymentMethod } from '../types/shared.types';

export interface CreateOrderData {
  user_id: string;
  order_number: string;
  total_amount: number;
  shipping_charge: number;
  discount_amount: number;
  final_amount: number;
  payment_method: PaymentMethod;
  shipping_address_id: string;
  coupon_code?: string;
  payment_status?: PaymentStatus;
  order_status?: OrderStatus;
}

export interface UpdateOrderData {
  payment_status?: PaymentStatus;
  order_status?: OrderStatus;
  tracking_number?: string;
  invoice_url?: string;
  shipped_at?: Date;
  delivered_at?: Date;
}

export interface OrderWithDetails extends Order {
  user_email: string;
  user_name: string;
  shipping_address: {
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  items: Array<{
    id: string;
    product_name: string;
    product_slug: string;
    variant_size: string;
    variant_color: string;
    variant_sku: string;
    quantity: number;
    price: number;
    subtotal: number;
    product_image?: string;
  }>;
}

export class OrderModel {
  /**
   * Create new order
   */
  static async create(data: CreateOrderData, client?: PoolClient): Promise<Order> {
    const sql = `
      INSERT INTO orders (
        user_id, order_number, total_amount, shipping_charge, 
        discount_amount, final_amount, payment_method, shipping_address_id,
        coupon_code, payment_status, order_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const values = [
      data.user_id,
      data.order_number,
      data.total_amount,
      data.shipping_charge,
      data.discount_amount,
      data.final_amount,
      data.payment_method,
      data.shipping_address_id,
      data.coupon_code || null,
      data.payment_status || PaymentStatus.PENDING,
      data.order_status || OrderStatus.PLACED,
    ];
    
    const result = client 
      ? await client.query(sql, values)
      : await query(sql, values);
      
    return result.rows[0];
  }
  
  /**
   * Find order by ID
   */
  static async findById(id: string): Promise<Order | null> {
    const sql = 'SELECT * FROM orders WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Find order by order number
   */
  static async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const sql = 'SELECT * FROM orders WHERE order_number = $1';
    const result = await query(sql, [orderNumber]);
    return result.rows[0] || null;
  }
  
  /**
   * Get order with complete details
   */
  static async findByIdWithDetails(id: string): Promise<OrderWithDetails | null> {
    const sql = `
      SELECT 
        o.*,
        u.email as user_email,
        u.full_name as user_name,
        ua.address_line1, ua.address_line2, ua.city, ua.state, 
        ua.pincode, ua.country,
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_name', p.name,
            'product_slug', p.slug,
            'variant_size', pv.size,
            'variant_color', pv.color,
            'variant_sku', pv.sku,
            'quantity', oi.quantity,
            'price', oi.price,
            'subtotal', oi.subtotal,
            'product_image', pi.image_url
          ) ORDER BY oi.created_at
        ) as items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN user_addresses ua ON o.shipping_address_id = ua.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
      LEFT JOIN products p ON pv.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      WHERE o.id = $1
      GROUP BY o.id, u.id, ua.id
    `;
    
    const result = await query(sql, [id]);
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    
    return {
      ...row,
      shipping_address: {
        address_line1: row.address_line1,
        address_line2: row.address_line2,
        city: row.city,
        state: row.state,
        pincode: row.pincode,
        country: row.country,
      },
    };
  }
  
  /**
   * Get user's orders
   */
  static async getUserOrders(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ orders: Order[]; total: number }> {
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT * FROM orders 
      WHERE user_id = $1 
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const countSql = `
      SELECT COUNT(*) as total 
      FROM orders 
      WHERE user_id = $1
    `;
    
    const [ordersResult, countResult] = await Promise.all([
      query(sql, [userId, limit, offset]),
      query(countSql, [userId]),
    ]);
    
    return {
      orders: ordersResult.rows,
      total: parseInt(countResult.rows[0].total),
    };
  }
  
  /**
   * Get all orders (admin)
   */
  static async getAllOrders(
    filters: {
      payment_status?: PaymentStatus;
      order_status?: OrderStatus;
      date_from?: Date;
      date_to?: Date;
    } = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ orders: Order[]; total: number }> {
    const offset = (page - 1) * limit;
    
    const whereClauses: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (filters.payment_status) {
      whereClauses.push(`payment_status = $${paramCount++}`);
      values.push(filters.payment_status);
    }
    
    if (filters.order_status) {
      whereClauses.push(`order_status = $${paramCount++}`);
      values.push(filters.order_status);
    }
    
    if (filters.date_from) {
      whereClauses.push(`created_at >= $${paramCount++}`);
      values.push(filters.date_from);
    }
    
    if (filters.date_to) {
      whereClauses.push(`created_at <= $${paramCount++}`);
      values.push(filters.date_to);
    }
    
    const whereClause = whereClauses.length > 0 
      ? `WHERE ${whereClauses.join(' AND ')}` 
      : '';
    
    const sql = `
      SELECT * FROM orders 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;
    
    const countSql = `
      SELECT COUNT(*) as total 
      FROM orders 
      ${whereClause}
    `;
    
    const [ordersResult, countResult] = await Promise.all([
      query(sql, [...values, limit, offset]),
      query(countSql, values),
    ]);
    
    return {
      orders: ordersResult.rows,
      total: parseInt(countResult.rows[0].total),
    };
  }
  
  /**
   * Update order
   */
  static async update(id: string, data: UpdateOrderData): Promise<Order | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (data.payment_status !== undefined) {
      fields.push(`payment_status = $${paramCount++}`);
      values.push(data.payment_status);
    }
    
    if (data.order_status !== undefined) {
      fields.push(`order_status = $${paramCount++}`);
      values.push(data.order_status);
      
      // Auto-set timestamps
      if (data.order_status === OrderStatus.SHIPPED && !data.shipped_at) {
        fields.push(`shipped_at = CURRENT_TIMESTAMP`);
      }
      if (data.order_status === OrderStatus.DELIVERED && !data.delivered_at) {
        fields.push(`delivered_at = CURRENT_TIMESTAMP`);
      }
    }
    
    if (data.tracking_number !== undefined) {
      fields.push(`tracking_number = $${paramCount++}`);
      values.push(data.tracking_number);
    }
    
    if (data.invoice_url !== undefined) {
      fields.push(`invoice_url = $${paramCount++}`);
      values.push(data.invoice_url);
    }
    
    if (data.shipped_at !== undefined) {
      fields.push(`shipped_at = $${paramCount++}`);
      values.push(data.shipped_at);
    }
    
    if (data.delivered_at !== undefined) {
      fields.push(`delivered_at = $${paramCount++}`);
      values.push(data.delivered_at);
    }
    
    if (fields.length === 0) {
      return this.findById(id);
    }
    
    values.push(id);
    
    const sql = `
      UPDATE orders
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await query(sql, values);
    return result.rows[0] || null;
  }
  
  /**
   * Check if order belongs to user
   */
  static async belongsToUser(orderId: string, userId: string): Promise<boolean> {
    const sql = 'SELECT id FROM orders WHERE id = $1 AND user_id = $2';
    const result = await query(sql, [orderId, userId]);
    return result.rows.length > 0;
  }
  
  /**
   * Check if order can be cancelled
   */
  static async canBeCancelled(orderId: string): Promise<boolean> {
    const sql = `
      SELECT order_status FROM orders WHERE id = $1
    `;
    const result = await query(sql, [orderId]);
    
    if (result.rows.length === 0) return false;
    
    const status = result.rows[0].order_status;
    return status === OrderStatus.PLACED;
  }
  
  /**
   * Check if order can be returned
   */
  static async canBeReturned(orderId: string): Promise<boolean> {
    const sql = `
      SELECT order_status, delivered_at FROM orders WHERE id = $1
    `;
    const result = await query(sql, [orderId]);
    
    if (result.rows.length === 0) return false;
    
    const { order_status, delivered_at } = result.rows[0];
    
    // Can only return delivered orders within 7 days
    if (order_status !== OrderStatus.DELIVERED || !delivered_at) {
      return false;
    }
    
    const daysSinceDelivery = (Date.now() - new Date(delivered_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceDelivery <= 7;
  }
}

export default OrderModel;
