import { Router } from 'express';
import AnalyticsController from '../controllers/analytics.controller';
import AdvancedAnalyticsController from '../controllers/advancedAnalytics.controller';
import { authenticate, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// All analytics routes require admin authentication
router.use(authenticate);
router.use(isAdmin);

/**
 * @route   GET /api/v1/analytics/dashboard
 * @desc    Get dashboard overview
 * @access  Admin
 */
router.get(
  '/dashboard',
  AnalyticsController.getDashboard
);

/**
 * @route   GET /api/v1/analytics/sales-chart
 * @desc    Get sales chart data
 * @access  Admin
 */
router.get(
  '/sales-chart',
  AnalyticsController.getSalesChart
);

/**
 * @route   GET /api/v1/analytics/top-products
 * @desc    Get top selling products
 * @access  Admin
 */
router.get(
  '/top-products',
  AnalyticsController.getTopProducts
);

/**
 * @route   GET /api/v1/analytics/customers
 * @desc    Get customer analytics
 * @access  Admin
 */
router.get(
  '/customers',
  AnalyticsController.getCustomerAnalytics
);

/**
 * @route   GET /api/v1/analytics/categories
 * @desc    Get category performance
 * @access  Admin
 */
router.get(
  '/categories',
  AnalyticsController.getCategoryPerformance
);

/**
 * @route   GET /api/v1/analytics/revenue-by-payment
 * @desc    Get revenue by payment method
 * @access  Admin
 */
router.get(
  '/revenue-by-payment',
  AnalyticsController.getRevenueByPayment
);

/**
 * @route   GET /api/v1/analytics/abandoned-carts
 * @desc    Get abandoned cart statistics
 * @access  Admin
 */
router.get(
  '/abandoned-carts',
  AnalyticsController.getAbandonedCarts
);

/**
 * @route   GET /api/v1/analytics/conversion-funnel
 * @desc    Get conversion funnel
 * @access  Admin
 */
router.get(
  '/conversion-funnel',
  AnalyticsController.getConversionFunnel
);

// =====================================================
// ADVANCED ANALYTICS ROUTES
// =====================================================

/**
 * @route   GET /api/v1/analytics/advanced/sales-trend
 * @desc    Get sales trend for charts
 * @access  Admin
 */
router.get(
  '/advanced/sales-trend',
  AdvancedAnalyticsController.getSalesTrend
);

/**
 * @route   GET /api/v1/analytics/advanced/category-performance
 * @desc    Get category performance metrics
 * @access  Admin
 */
router.get(
  '/advanced/category-performance',
  AdvancedAnalyticsController.getCategoryPerformance
);

/**
 * @route   GET /api/v1/analytics/advanced/product-performance
 * @desc    Get product performance metrics
 * @access  Admin
 */
router.get(
  '/advanced/product-performance',
  AdvancedAnalyticsController.getProductPerformance
);

/**
 * @route   GET /api/v1/analytics/advanced/customer-segments
 * @desc    Get customer segments
 * @access  Admin
 */
router.get(
  '/advanced/customer-segments',
  AdvancedAnalyticsController.getCustomerSegments
);

/**
 * @route   GET /api/v1/analytics/advanced/hourly-distribution
 * @desc    Get hourly order distribution
 * @access  Admin
 */
router.get(
  '/advanced/hourly-distribution',
  AdvancedAnalyticsController.getHourlyDistribution
);

/**
 * @route   GET /api/v1/analytics/advanced/day-of-week
 * @desc    Get day of week performance
 * @access  Admin
 */
router.get(
  '/advanced/day-of-week',
  AdvancedAnalyticsController.getDayOfWeek
);

/**
 * @route   GET /api/v1/analytics/advanced/payment-methods
 * @desc    Get payment method distribution
 * @access  Admin
 */
router.get(
  '/advanced/payment-methods',
  AdvancedAnalyticsController.getPaymentMethods
);

/**
 * @route   GET /api/v1/analytics/advanced/aov-trend
 * @desc    Get average order value trend
 * @access  Admin
 */
router.get(
  '/advanced/aov-trend',
  AdvancedAnalyticsController.getAOVTrend
);

/**
 * @route   GET /api/v1/analytics/advanced/retention
 * @desc    Get customer retention metrics
 * @access  Admin
 */
router.get(
  '/advanced/retention',
  AdvancedAnalyticsController.getRetention
);

/**
 * @route   GET /api/v1/analytics/advanced/conversion-funnel
 * @desc    Get conversion funnel data
 * @access  Admin
 */
router.get(
  '/advanced/conversion-funnel',
  AdvancedAnalyticsController.getConversionFunnel
);

/**
 * @route   GET /api/v1/analytics/advanced/top-products
 * @desc    Get top performing products
 * @access  Admin
 */
router.get(
  '/advanced/top-products',
  AdvancedAnalyticsController.getTopProducts
);

/**
 * @route   GET /api/v1/analytics/advanced/coupon-stats
 * @desc    Get coupon usage statistics
 * @access  Admin
 */
router.get(
  '/advanced/coupon-stats',
  AdvancedAnalyticsController.getCouponStats
);

export default router;
