import { Router } from 'express';
import RecommendationController from '../controllers/recommendation.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/v1/recommendations/personalized
 * @desc    Get personalized recommendations
 * @access  Private
 */
router.get('/personalized', authenticate, RecommendationController.getPersonalized);

/**
 * @route   GET /api/v1/recommendations/similar/:productId
 * @desc    Get similar products
 * @access  Public
 */
router.get('/similar/:productId', RecommendationController.getSimilar);

/**
 * @route   GET /api/v1/recommendations/trending
 * @desc    Get trending products
 * @access  Public
 */
router.get('/trending', RecommendationController.getTrending);

/**
 * @route   GET /api/v1/recommendations/bought-together/:productId
 * @desc    Get frequently bought together
 * @access  Public
 */
router.get('/bought-together/:productId', RecommendationController.getBoughtTogether);

/**
 * @route   GET /api/v1/recommendations/browsing-history
 * @desc    Get based on browsing history
 * @access  Private
 */
router.get('/browsing-history', authenticate, RecommendationController.getBasedOnHistory);

/**
 * @route   GET /api/v1/recommendations/new-arrivals
 * @desc    Get new arrivals
 * @access  Public
 */
router.get('/new-arrivals', RecommendationController.getNewArrivals);

/**
 * @route   GET /api/v1/recommendations/best-deals
 * @desc    Get best deals
 * @access  Public
 */
router.get('/best-deals', RecommendationController.getBestDeals);

/**
 * @route   GET /api/v1/recommendations/complete-look/:productId
 * @desc    Get complete the look
 * @access  Public
 */
router.get('/complete-look/:productId', RecommendationController.getCompleteTheLook);

export default router;
