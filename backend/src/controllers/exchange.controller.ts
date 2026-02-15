import { Request, Response } from 'express';
import ExchangeService from '../services/exchange.service';
import { asyncHandler } from '../middleware/errorHandler';
import { ExchangeReason, ExchangeStatus } from '../models/Exchange.model';

export class ExchangeController {
  /**
   * Request exchange
   * POST /api/v1/exchanges
   */
  static requestExchange = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { order_id, reason, reason_details, exchange_variant_id } = req.body;
    
    const exchange = await ExchangeService.requestExchange({
      order_id,
      user_id: userId,
      reason: reason as ExchangeReason,
      reason_details,
      exchange_variant_id,
    });
    
    res.status(201).json({
      success: true,
      message: 'Exchange request submitted successfully',
      data: exchange,
    });
  });
  
  /**
   * Get user's exchange requests
   * GET /api/v1/exchanges/my-exchanges
   */
  static getMyExchanges = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    
    const exchanges = await ExchangeService.getUserExchanges(userId);
    
    res.status(200).json({
      success: true,
      data: exchanges,
    });
  });
  
  /**
   * Get exchange by ID
   * GET /api/v1/exchanges/:id
   */
  static getExchangeById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'manager';
    
    const exchange = await ExchangeService.getExchangeById(
      id,
      isAdmin ? undefined : userId
    );
    
    res.status(200).json({
      success: true,
      data: exchange,
    });
  });
  
  /**
   * Cancel exchange request
   * POST /api/v1/exchanges/:id/cancel
   */
  static cancelExchange = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;
    
    const exchange = await ExchangeService.cancelExchange(id, userId);
    
    res.status(200).json({
      success: true,
      message: 'Exchange request cancelled',
      data: exchange,
    });
  });
  
  /**
   * Get all exchanges (admin)
   * GET /api/v1/exchanges/admin/all
   */
  static getAllExchanges = asyncHandler(async (req: Request, res: Response) => {
    const { status, page, limit } = req.query;
    
    const result = await ExchangeService.getAllExchanges(
      status as ExchangeStatus | undefined,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20
    );
    
    res.status(200).json({
      success: true,
      data: result,
    });
  });
  
  /**
   * Update exchange status (admin)
   * PUT /api/v1/exchanges/admin/:id/status
   */
  static updateExchangeStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    
    const exchange = await ExchangeService.updateExchangeStatus(
      id,
      status as ExchangeStatus,
      admin_notes
    );
    
    res.status(200).json({
      success: true,
      message: 'Exchange status updated',
      data: exchange,
    });
  });
}

export default ExchangeController;
