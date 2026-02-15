import { query } from '../config/database';
import { Payment, PaymentGateway, PaymentStatus } from '../types/shared.types';

export interface CreatePaymentData {
  order_id: string;
  transaction_id?: string;
  gateway: PaymentGateway;
  amount: number;
  status: string;
  webhook_data?: any;
}

export interface UpdatePaymentData {
  transaction_id?: string;
  status?: string;
  webhook_data?: any;
}

export class PaymentModel {
  /**
   * Create payment record
   */
  static async create(data: CreatePaymentData): Promise<Payment> {
    const sql = `
      INSERT INTO payments (
        order_id, transaction_id, gateway, amount, status, webhook_data
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      data.order_id,
      data.transaction_id || null,
      data.gateway,
      data.amount,
      data.status,
      data.webhook_data ? JSON.stringify(data.webhook_data) : null,
    ];
    
    const result = await query(sql, values);
    return result.rows[0];
  }
  
  /**
   * Find payment by ID
   */
  static async findById(id: string): Promise<Payment | null> {
    const sql = 'SELECT * FROM payments WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }
  
  /**
   * Find payment by order ID
   */
  static async findByOrderId(orderId: string): Promise<Payment | null> {
    const sql = `
      SELECT * FROM payments 
      WHERE order_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    const result = await query(sql, [orderId]);
    return result.rows[0] || null;
  }
  
  /**
   * Find payment by transaction ID
   */
  static async findByTransactionId(transactionId: string): Promise<Payment | null> {
    const sql = 'SELECT * FROM payments WHERE transaction_id = $1';
    const result = await query(sql, [transactionId]);
    return result.rows[0] || null;
  }
  
  /**
   * Update payment
   */
  static async update(id: string, data: UpdatePaymentData): Promise<Payment | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (data.transaction_id !== undefined) {
      fields.push(`transaction_id = $${paramCount++}`);
      values.push(data.transaction_id);
    }
    
    if (data.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(data.status);
    }
    
    if (data.webhook_data !== undefined) {
      fields.push(`webhook_data = $${paramCount++}`);
      values.push(JSON.stringify(data.webhook_data));
    }
    
    if (fields.length === 0) {
      return this.findById(id);
    }
    
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const sql = `
      UPDATE payments
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await query(sql, values);
    return result.rows[0] || null;
  }
  
  /**
   * Get payments by date range (admin)
   */
  static async getByDateRange(
    dateFrom: Date,
    dateTo: Date,
    page: number = 1,
    limit: number = 20
  ): Promise<{ payments: Payment[]; total: number }> {
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT p.*, o.order_number, u.email as user_email
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN users u ON o.user_id = u.id
      WHERE p.created_at >= $1 AND p.created_at <= $2
      ORDER BY p.created_at DESC
      LIMIT $3 OFFSET $4
    `;
    
    const countSql = `
      SELECT COUNT(*) as total
      FROM payments
      WHERE created_at >= $1 AND created_at <= $2
    `;
    
    const [paymentsResult, countResult] = await Promise.all([
      query(sql, [dateFrom, dateTo, limit, offset]),
      query(countSql, [dateFrom, dateTo]),
    ]);
    
    return {
      payments: paymentsResult.rows,
      total: parseInt(countResult.rows[0].total),
    };
  }
  
  /**
   * Get payment statistics
   */
  static async getStatistics(dateFrom?: Date, dateTo?: Date) {
    let whereClause = '';
    const values: any[] = [];
    
    if (dateFrom && dateTo) {
      whereClause = 'WHERE created_at >= $1 AND created_at <= $2';
      values.push(dateFrom, dateTo);
    }
    
    const sql = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN status = 'captured' THEN amount ELSE 0 END) as total_captured,
        SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) as total_failed,
        COUNT(CASE WHEN status = 'captured' THEN 1 END) as successful_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
        AVG(CASE WHEN status = 'captured' THEN amount END) as average_transaction
      FROM payments
      ${whereClause}
    `;
    
    const result = await query(sql, values);
    
    return {
      total_transactions: parseInt(result.rows[0].total_transactions),
      total_captured: parseFloat(result.rows[0].total_captured || 0),
      total_failed: parseFloat(result.rows[0].total_failed || 0),
      successful_count: parseInt(result.rows[0].successful_count),
      failed_count: parseInt(result.rows[0].failed_count),
      average_transaction: parseFloat(result.rows[0].average_transaction || 0),
    };
  }
}

export default PaymentModel;
