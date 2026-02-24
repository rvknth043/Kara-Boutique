import { Request, Response } from 'express';
import OrderService from '../services/order.service';
import { asyncHandler } from '../middleware/errorHandler';
import { sanitizePaginationParams, getPaginationMeta } from '../utils/pagination';
import { OrderStatus, PaymentStatus } from '../types/shared.types';

export class OrderController {
  /**
   * Get user's orders
   * GET /api/v1/orders
   */
  static getUserOrders = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { page, limit } = sanitizePaginationParams(req.query.page, req.query.limit);
    
    const result = await OrderService.getUserOrders(userId, page, limit);
    
    res.status(200).json({
      success: true,
      data: {
        orders: result.orders,
        pagination: getPaginationMeta(page, limit, result.total),
      },
    });
  });
  
  /**
   * Get order by ID
   * GET /api/v1/orders/:id
   */
  static getOrderById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const isAdminUser = ['admin', 'manager', 'staff'].includes(req.user!.role);
    const userId = isAdminUser ? undefined : req.user!.userId;

    const order = await OrderService.getOrderById(id, userId);
    
    res.status(200).json({
      success: true,
      data: order,
    });
  });
  
  /**
   * Get order by order number
   * GET /api/v1/orders/number/:orderNumber
   */
  static getOrderByNumber = asyncHandler(async (req: Request, res: Response) => {
    const { orderNumber } = req.params;
    const userId = req.user!.userId;
    
    const order = await OrderService.getOrderByNumber(orderNumber, userId);
    
    res.status(200).json({
      success: true,
      data: order,
    });
  });
  
  /**
   * Cancel order
   * POST /api/v1/orders/:id/cancel
   */
  static cancelOrder = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;
    
    const order = await OrderService.cancelOrder(id, userId);
    
    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    });
  });
  
  /**
   * Request return
   * POST /api/v1/orders/:id/return
   */
  static requestReturn = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { reason } = req.body;
    
    const order = await OrderService.requestReturn(id, userId, reason);
    
    res.status(200).json({
      success: true,
      message: 'Return request submitted successfully',
      data: order,
    });
  });
  
  /**
   * Get all orders (admin)
   * GET /api/v1/orders/admin/all
   */
  static getAllOrders = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = sanitizePaginationParams(req.query.page, req.query.limit);
    
    const filters: any = {};
    
    if (req.query.payment_status) {
      filters.payment_status = req.query.payment_status as PaymentStatus;
    }
    
    if (req.query.order_status) {
      filters.order_status = req.query.order_status as OrderStatus;
    }
    
    if (req.query.date_from) {
      filters.date_from = new Date(req.query.date_from as string);
    }
    
    if (req.query.date_to) {
      filters.date_to = new Date(req.query.date_to as string);
    }
    
    const result = await OrderService.getAllOrders(filters, page, limit);
    
    res.status(200).json({
      success: true,
      data: {
        orders: result.orders,
        pagination: getPaginationMeta(page, limit, result.total),
      },
    });
  });
  
  /**
   * Update order status (admin)
   * PUT /api/v1/orders/admin/:id/status
   */
  static updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { order_status, tracking_number } = req.body;
    
    const order = await OrderService.updateOrderStatus(id, order_status, tracking_number);
    
    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order,
    });
  });
  
  /**
   * Get order statistics (admin)
   * GET /api/v1/orders/admin/statistics
   */
  static getOrderStatistics = asyncHandler(async (req: Request, res: Response) => {
    const dateFrom = req.query.date_from 
      ? new Date(req.query.date_from as string) 
      : undefined;
    const dateTo = req.query.date_to 
      ? new Date(req.query.date_to as string) 
      : undefined;
    
    const statistics = await OrderService.getOrderStatistics(dateFrom, dateTo);
    
    res.status(200).json({
      success: true,
      data: statistics,
    });
  });
}

export default OrderController;
