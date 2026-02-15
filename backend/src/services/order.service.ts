import OrderModel, { UpdateOrderData, OrderWithDetails } from '../models/Order.model';
import OrderItemModel from '../models/OrderItem.model';
import ProductVariantModel from '../models/ProductVariant.model';
import { AppError } from '../middleware/errorHandler';
import { OrderStatus, PaymentStatus } from '../types/shared.types';
import { transaction } from '../config/database';

export class OrderService {
  /**
   * Get order by ID
   */
  static async getOrderById(orderId: string, userId?: string): Promise<OrderWithDetails> {
    const order = await OrderModel.findByIdWithDetails(orderId);
    
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }
    
    // If userId provided, verify ownership
    if (userId && order.user_id !== userId) {
      throw new AppError('Access denied', 403, 'ACCESS_DENIED');
    }
    
    return order;
  }
  
  /**
   * Get order by order number
   */
  static async getOrderByNumber(orderNumber: string, userId?: string) {
    const order = await OrderModel.findByOrderNumber(orderNumber);
    
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }
    
    // If userId provided, verify ownership
    if (userId && order.user_id !== userId) {
      throw new AppError('Access denied', 403, 'ACCESS_DENIED');
    }
    
    const completeOrder = await OrderModel.findByIdWithDetails(order.id);
    return completeOrder;
  }
  
  /**
   * Get user's orders
   */
  static async getUserOrders(userId: string, page: number = 1, limit: number = 20) {
    const result = await OrderModel.getUserOrders(userId, page, limit);
    
    return {
      orders: result.orders,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }
  
  /**
   * Get all orders (admin)
   */
  static async getAllOrders(
    filters: any = {},
    page: number = 1,
    limit: number = 20
  ) {
    const result = await OrderModel.getAllOrders(filters, page, limit);
    
    return {
      orders: result.orders,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }
  
  /**
   * Update order status (admin)
   */
  static async updateOrderStatus(
    orderId: string,
    orderStatus: OrderStatus,
    trackingNumber?: string
  ) {
    const order = await OrderModel.findById(orderId);
    
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }
    
    const updateData: UpdateOrderData = {
      order_status: orderStatus,
    };
    
    if (trackingNumber) {
      updateData.tracking_number = trackingNumber;
    }
    
    const updatedOrder = await OrderModel.update(orderId, updateData);
    
    return updatedOrder;
  }
  
  /**
   * Update payment status
   */
  static async updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus) {
    const order = await OrderModel.findById(orderId);
    
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }
    
    const updatedOrder = await OrderModel.update(orderId, { payment_status: paymentStatus });
    
    return updatedOrder;
  }
  
  /**
   * Cancel order
   */
  static async cancelOrder(orderId: string, userId: string) {
    const order = await OrderModel.findById(orderId);
    
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }
    
    // Verify ownership
    if (order.user_id !== userId) {
      throw new AppError('Access denied', 403, 'ACCESS_DENIED');
    }
    
    // Check if order can be cancelled
    const canCancel = await OrderModel.canBeCancelled(orderId);
    
    if (!canCancel) {
      throw new AppError(
        'Order cannot be cancelled. Please contact support.',
        400,
        'CANNOT_CANCEL'
      );
    }
    
    // Cancel order and restore stock
    await transaction(async (client) => {
      // Update order status
      await client.query(
        'UPDATE orders SET order_status = $1 WHERE id = $2',
        [OrderStatus.CANCELLED, orderId]
      );
      
      // Get order items
      const orderItems = await OrderItemModel.getByOrderId(orderId);
      
      // Restore stock
      for (const item of orderItems) {
        await ProductVariantModel.updateStock(
          item.product_variant_id,
          item.quantity
        );
      }
    });
    
    const updatedOrder = await OrderModel.findByIdWithDetails(orderId);
    
    return updatedOrder;
  }
  
  /**
   * Request return
   */
  static async requestReturn(orderId: string, userId: string, reason: string) {
    const order = await OrderModel.findById(orderId);
    
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }
    
    // Verify ownership
    if (order.user_id !== userId) {
      throw new AppError('Access denied', 403, 'ACCESS_DENIED');
    }
    
    // Check if order can be returned
    const canReturn = await OrderModel.canBeReturned(orderId);
    
    if (!canReturn) {
      throw new AppError(
        'Order cannot be returned. Return window has expired.',
        400,
        'CANNOT_RETURN'
      );
    }
    
    // Update order status to returned
    const updatedOrder = await OrderModel.update(orderId, {
      order_status: OrderStatus.RETURNED,
    });
    
    // TODO: Send notification to admin
    // TODO: Create return request record
    
    return updatedOrder;
  }
  
  /**
   * Get order statistics (admin)
   */
  static async getOrderStatistics(dateFrom?: Date, dateTo?: Date) {
    const { query } = await import('../config/database');
    
    let whereClause = '';
    const values: any[] = [];
    
    if (dateFrom && dateTo) {
      whereClause = 'WHERE created_at >= $1 AND created_at <= $2';
      values.push(dateFrom, dateTo);
    }
    
    const sql = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN payment_status = 'paid' THEN final_amount ELSE 0 END) as total_revenue,
        COUNT(CASE WHEN order_status = 'placed' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN order_status = 'shipped' THEN 1 END) as shipped_orders,
        COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN order_status = 'cancelled' THEN 1 END) as cancelled_orders,
        COUNT(CASE WHEN order_status = 'returned' THEN 1 END) as returned_orders,
        AVG(final_amount) as average_order_value
      FROM orders
      ${whereClause}
    `;
    
    const result = await query(sql, values);
    
    return {
      total_orders: parseInt(result.rows[0].total_orders),
      total_revenue: parseFloat(result.rows[0].total_revenue || 0),
      pending_orders: parseInt(result.rows[0].pending_orders),
      shipped_orders: parseInt(result.rows[0].shipped_orders),
      delivered_orders: parseInt(result.rows[0].delivered_orders),
      cancelled_orders: parseInt(result.rows[0].cancelled_orders),
      returned_orders: parseInt(result.rows[0].returned_orders),
      average_order_value: parseFloat(result.rows[0].average_order_value || 0),
    };
  }
}

export default OrderService;
