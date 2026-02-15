import { query } from '../config/database';
import { PoolClient } from 'pg';

export interface OrderItem {
  id: string;
  order_id: string;
  product_variant_id: string;
  quantity: number;
  price: number;
  subtotal: number;
  created_at: Date;
}

export interface CreateOrderItemData {
  order_id: string;
  product_variant_id: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export class OrderItemModel {
  /**
   * Create order item
   */
  static async create(data: CreateOrderItemData, client?: PoolClient): Promise<OrderItem> {
    const sql = `
      INSERT INTO order_items (
        order_id, product_variant_id, quantity, price, subtotal
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      data.order_id,
      data.product_variant_id,
      data.quantity,
      data.price,
      data.subtotal,
    ];
    
    const result = client 
      ? await client.query(sql, values)
      : await query(sql, values);
      
    return result.rows[0];
  }
  
  /**
   * Create multiple order items
   */
  static async createMany(
    items: CreateOrderItemData[],
    client?: PoolClient
  ): Promise<OrderItem[]> {
    if (items.length === 0) return [];
    
    const values: any[] = [];
    const placeholders: string[] = [];
    
    items.forEach((item, index) => {
      const base = index * 5;
      placeholders.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`
      );
      values.push(
        item.order_id,
        item.product_variant_id,
        item.quantity,
        item.price,
        item.subtotal
      );
    });
    
    const sql = `
      INSERT INTO order_items (
        order_id, product_variant_id, quantity, price, subtotal
      )
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;
    
    const result = client 
      ? await client.query(sql, values)
      : await query(sql, values);
      
    return result.rows;
  }
  
  /**
   * Get order items by order ID
   */
  static async getByOrderId(orderId: string): Promise<OrderItem[]> {
    const sql = `
      SELECT * FROM order_items 
      WHERE order_id = $1
      ORDER BY created_at ASC
    `;
    const result = await query(sql, [orderId]);
    return result.rows;
  }
  
  /**
   * Get order items with product details
   */
  static async getByOrderIdWithDetails(orderId: string) {
    const sql = `
      SELECT 
        oi.*,
        p.name as product_name,
        p.slug as product_slug,
        pv.size as variant_size,
        pv.color as variant_color,
        pv.sku as variant_sku,
        pi.image_url as product_image
      FROM order_items oi
      JOIN product_variants pv ON oi.product_variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      WHERE oi.order_id = $1
      ORDER BY oi.created_at ASC
    `;
    const result = await query(sql, [orderId]);
    return result.rows;
  }
  
  /**
   * Delete order items by order ID
   */
  static async deleteByOrderId(orderId: string, client?: PoolClient): Promise<boolean> {
    const sql = 'DELETE FROM order_items WHERE order_id = $1';
    const result = client 
      ? await client.query(sql, [orderId])
      : await query(sql, [orderId]);
      
    return (result.rowCount ?? 0) > 0;
  }
}

export default OrderItemModel;
