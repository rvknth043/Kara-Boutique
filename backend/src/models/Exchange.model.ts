import { query } from '../config/database';

export enum ExchangeStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PICKED_UP = 'picked_up',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ExchangeReason {
  SIZE_ISSUE = 'size_issue',
  COLOR_DIFFERENCE = 'color_difference',
  DEFECTIVE = 'defective',
  WRONG_ITEM = 'wrong_item',
  OTHER = 'other',
}

export interface Exchange {
  id: string;
  order_id: string;
  user_id: string;
  reason: ExchangeReason;
  reason_details: string;
  exchange_variant_id?: string;
  status: ExchangeStatus;
  admin_notes?: string;
  requested_at: Date;
  approved_at?: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateExchangeData {
  order_id: string;
  user_id: string;
  reason: ExchangeReason;
  reason_details: string;
  exchange_variant_id?: string;
}

export class ExchangeModel {
  /**
   * Create exchange request
   */
  static async create(data: CreateExchangeData): Promise<Exchange> {
    const sql = `
      INSERT INTO exchanges (
        order_id, user_id, reason, reason_details, 
        exchange_variant_id, status
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      data.order_id,
      data.user_id,
      data.reason,
      data.reason_details,
      data.exchange_variant_id || null,
      ExchangeStatus.REQUESTED,
    ];
    
    const result = await query(sql, values);
    return result.rows[0];
  }
  
  /**
   * Get exchange by ID
   */
  static async findById(id: string): Promise<Exchange | null> {
    const sql = 'SELECT * FROM exchanges WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Get user's exchanges
   */
  static async getUserExchanges(userId: string): Promise<Exchange[]> {
    const sql = `
      SELECT e.*, o.order_number, o.final_amount
      FROM exchanges e
      JOIN orders o ON e.order_id = o.id
      WHERE e.user_id = $1
      ORDER BY e.created_at DESC
    `;
    const result = await query(sql, [userId]);
    return result.rows;
  }
  
  /**
   * Get all exchanges (admin)
   */
  static async getAll(
    status?: ExchangeStatus,
    page: number = 1,
    limit: number = 20
  ): Promise<{ exchanges: any[]; total: number }> {
    const offset = (page - 1) * limit;
    
    const whereClause = status ? `WHERE e.status = $1` : '';
    const values: any[] = status ? [status] : [];
    
    const sql = `
      SELECT 
        e.*,
        o.order_number,
        o.final_amount,
        u.full_name as user_name,
        u.email as user_email
      FROM exchanges e
      JOIN orders o ON e.order_id = o.id
      JOIN users u ON e.user_id = u.id
      ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    
    const countSql = `
      SELECT COUNT(*) as total FROM exchanges e
      ${whereClause}
    `;
    
    const [exchangesResult, countResult] = await Promise.all([
      query(sql, [...values, limit, offset]),
      query(countSql, values),
    ]);
    
    return {
      exchanges: exchangesResult.rows,
      total: parseInt(countResult.rows[0].total),
    };
  }
  
  /**
   * Update exchange status
   */
  static async updateStatus(
    id: string,
    status: ExchangeStatus,
    adminNotes?: string
  ): Promise<Exchange | null> {
    const fields = ['status = $1'];
    const values: any[] = [status];
    let paramCount = 2;
    
    if (adminNotes) {
      fields.push(`admin_notes = $${paramCount++}`);
      values.push(adminNotes);
    }
    
    if (status === ExchangeStatus.APPROVED) {
      fields.push('approved_at = CURRENT_TIMESTAMP');
    }
    
    if (status === ExchangeStatus.COMPLETED) {
      fields.push('completed_at = CURRENT_TIMESTAMP');
    }
    
    values.push(id);
    
    const sql = `
      UPDATE exchanges
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await query(sql, values);
    return result.rows[0] || null;
  }
  
  /**
   * Check if order is eligible for exchange
   */
  static async isEligibleForExchange(orderId: string): Promise<{
    eligible: boolean;
    reason?: string;
  }> {
    const sql = `
      SELECT 
        o.order_status,
        o.delivered_at,
        COUNT(e.id) as exchange_count
      FROM orders o
      LEFT JOIN exchanges e ON o.id = e.order_id AND e.status != 'cancelled'
      WHERE o.id = $1
      GROUP BY o.id, o.order_status, o.delivered_at
    `;
    
    const result = await query(sql, [orderId]);
    
    if (result.rows.length === 0) {
      return { eligible: false, reason: 'Order not found' };
    }
    
    const order = result.rows[0];
    
    // Must be delivered
    if (order.order_status !== 'delivered') {
      return { eligible: false, reason: 'Order must be delivered' };
    }
    
    // Within 7 days
    if (!order.delivered_at) {
      return { eligible: false, reason: 'Delivery date not found' };
    }
    
    const daysSinceDelivery = (Date.now() - new Date(order.delivered_at).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceDelivery > 7) {
      return { eligible: false, reason: 'Exchange window expired (7 days)' };
    }
    
    // No existing exchange request
    if (parseInt(order.exchange_count) > 0) {
      return { eligible: false, reason: 'Exchange already requested for this order' };
    }
    
    return { eligible: true };
  }
}

export default ExchangeModel;
