import { Request, Response } from 'express';
import AnalyticsService from '../services/analytics.service';
import { asyncHandler } from '../middleware/errorHandler';

export class AnalyticsController {
  /**
   * Get dashboard overview
   * GET /api/v1/analytics/dashboard
   */
  static getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const dateFrom = req.query.date_from 
      ? new Date(req.query.date_from as string) 
      : undefined;
    const dateTo = req.query.date_to 
      ? new Date(req.query.date_to as string) 
      : undefined;
    
    const dashboard = await AnalyticsService.getDashboardOverview(dateFrom, dateTo);
    
    res.status(200).json({
      success: true,
      data: dashboard,
    });
  });
  
  /**
   * Get sales chart data
   * GET /api/v1/analytics/sales-chart
   */
  static getSalesChart = asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;
    
    const chartData = await AnalyticsService.getSalesChartData(days);
    
    res.status(200).json({
      success: true,
      data: chartData,
    });
  });
  
  /**
   * Get top selling products
   * GET /api/v1/analytics/top-products
   */
  static getTopProducts = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const products = await AnalyticsService.getTopSellingProducts(limit);
    
    res.status(200).json({
      success: true,
      data: products,
    });
  });
  
  /**
   * Get customer analytics
   * GET /api/v1/analytics/customers
   */
  static getCustomerAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const customers = await AnalyticsService.getCustomerAnalytics();
    
    res.status(200).json({
      success: true,
      data: customers,
    });
  });
  
  /**
   * Get category performance
   * GET /api/v1/analytics/categories
   */
  static getCategoryPerformance = asyncHandler(async (req: Request, res: Response) => {
    const categories = await AnalyticsService.getCategoryPerformance();
    
    res.status(200).json({
      success: true,
      data: categories,
    });
  });
  
  /**
   * Get revenue by payment method
   * GET /api/v1/analytics/revenue-by-payment
   */
  static getRevenueByPayment = asyncHandler(async (req: Request, res: Response) => {
    const data = await AnalyticsService.getRevenueByPaymentMethod();
    
    res.status(200).json({
      success: true,
      data,
    });
  });
  
  /**
   * Get abandoned cart stats
   * GET /api/v1/analytics/abandoned-carts
   */
  static getAbandonedCarts = asyncHandler(async (req: Request, res: Response) => {
    const stats = await AnalyticsService.getAbandonedCartStats();
    
    res.status(200).json({
      success: true,
      data: stats,
    });
  });
  
  /**
   * Get conversion funnel
   * GET /api/v1/analytics/conversion-funnel
   */
  static getConversionFunnel = asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;
    
    const funnel = await AnalyticsService.getConversionFunnel(days);
    
    res.status(200).json({
      success: true,
      data: funnel,
    });
  });
}

export default AnalyticsController;
