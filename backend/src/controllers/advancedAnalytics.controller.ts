import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import AdvancedAnalyticsService from '../services/advancedAnalytics.service';

export class AdvancedAnalyticsController {
  /**
   * @route   GET /api/v1/analytics/advanced/sales-trend
   * @desc    Get sales trend data for charts
   * @access  Private (Admin)
   */
  static getSalesTrend = asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;

    const data = await AdvancedAnalyticsService.getSalesTrend(days);

    res.status(200).json({
      success: true,
      data,
    });
  });

  /**
   * @route   GET /api/v1/analytics/advanced/category-performance
   * @desc    Get category performance metrics
   * @access  Private (Admin)
   */
  static getCategoryPerformance = asyncHandler(async (req: Request, res: Response) => {
    const data = await AdvancedAnalyticsService.getCategoryPerformance();

    res.status(200).json({
      success: true,
      data,
    });
  });

  /**
   * @route   GET /api/v1/analytics/advanced/product-performance
   * @desc    Get product performance metrics
   * @access  Private (Admin)
   */
  static getProductPerformance = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;

    const data = await AdvancedAnalyticsService.getProductPerformance(limit);

    res.status(200).json({
      success: true,
      data,
    });
  });

  /**
   * @route   GET /api/v1/analytics/advanced/customer-segments
   * @desc    Get customer segments
   * @access  Private (Admin)
   */
  static getCustomerSegments = asyncHandler(async (req: Request, res: Response) => {
    const data = await AdvancedAnalyticsService.getCustomerSegments();

    res.status(200).json({
      success: true,
      data,
    });
  });

  /**
   * @route   GET /api/v1/analytics/advanced/hourly-distribution
   * @desc    Get hourly order distribution
   * @access  Private (Admin)
   */
  static getHourlyDistribution = asyncHandler(async (req: Request, res: Response) => {
    const data = await AdvancedAnalyticsService.getHourlyOrderDistribution();

    res.status(200).json({
      success: true,
      data,
    });
  });

  /**
   * @route   GET /api/v1/analytics/advanced/day-of-week
   * @desc    Get day of week performance
   * @access  Private (Admin)
   */
  static getDayOfWeek = asyncHandler(async (req: Request, res: Response) => {
    const data = await AdvancedAnalyticsService.getDayOfWeekPerformance();

    res.status(200).json({
      success: true,
      data,
    });
  });

  /**
   * @route   GET /api/v1/analytics/advanced/payment-methods
   * @desc    Get payment method distribution
   * @access  Private (Admin)
   */
  static getPaymentMethods = asyncHandler(async (req: Request, res: Response) => {
    const data = await AdvancedAnalyticsService.getPaymentMethodDistribution();

    res.status(200).json({
      success: true,
      data,
    });
  });

  /**
   * @route   GET /api/v1/analytics/advanced/aov-trend
   * @desc    Get average order value trend
   * @access  Private (Admin)
   */
  static getAOVTrend = asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;

    const data = await AdvancedAnalyticsService.getAOVTrend(days);

    res.status(200).json({
      success: true,
      data,
    });
  });

  /**
   * @route   GET /api/v1/analytics/advanced/retention
   * @desc    Get customer retention metrics
   * @access  Private (Admin)
   */
  static getRetention = asyncHandler(async (req: Request, res: Response) => {
    const data = await AdvancedAnalyticsService.getRetentionMetrics();

    res.status(200).json({
      success: true,
      data,
    });
  });

  /**
   * @route   GET /api/v1/analytics/advanced/conversion-funnel
   * @desc    Get conversion funnel data
   * @access  Private (Admin)
   */
  static getConversionFunnel = asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;

    const data = await AdvancedAnalyticsService.getConversionFunnel(days);

    res.status(200).json({
      success: true,
      data,
    });
  });

  /**
   * @route   GET /api/v1/analytics/advanced/top-products
   * @desc    Get top performing products
   * @access  Private (Admin)
   */
  static getTopProducts = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;

    const data = await AdvancedAnalyticsService.getTopPerformingProducts(limit);

    res.status(200).json({
      success: true,
      data,
    });
  });

  /**
   * @route   GET /api/v1/analytics/advanced/coupon-stats
   * @desc    Get coupon usage statistics
   * @access  Private (Admin)
   */
  static getCouponStats = asyncHandler(async (req: Request, res: Response) => {
    const data = await AdvancedAnalyticsService.getCouponStatistics();

    res.status(200).json({
      success: true,
      data,
    });
  });
}

export default AdvancedAnalyticsController;
