import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import RecommendationService from '../services/recommendation.service';

export class RecommendationController {
  /**
   * @route   GET /api/v1/recommendations/personalized
   * @desc    Get personalized recommendations for user
   * @access  Private
   */
  static getPersonalized = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    const recommendations = await RecommendationService.getPersonalizedRecommendations(
      userId,
      limit
    );

    res.status(200).json({
      success: true,
      data: recommendations,
    });
  });

  /**
   * @route   GET /api/v1/recommendations/similar/:productId
   * @desc    Get similar products
   * @access  Public
   */
  static getSimilar = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit as string) || 6;

    const recommendations = await RecommendationService.getSimilarProducts(
      productId,
      limit
    );

    res.status(200).json({
      success: true,
      data: recommendations,
    });
  });

  /**
   * @route   GET /api/v1/recommendations/trending
   * @desc    Get trending products
   * @access  Public
   */
  static getTrending = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;

    const recommendations = await RecommendationService.getTrendingProducts(limit);

    res.status(200).json({
      success: true,
      data: recommendations,
    });
  });

  /**
   * @route   GET /api/v1/recommendations/bought-together/:productId
   * @desc    Get frequently bought together products
   * @access  Public
   */
  static getBoughtTogether = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit as string) || 4;

    const recommendations = await RecommendationService.getFrequentlyBoughtTogether(
      productId,
      limit
    );

    res.status(200).json({
      success: true,
      data: recommendations,
    });
  });

  /**
   * @route   GET /api/v1/recommendations/browsing-history
   * @desc    Get recommendations based on browsing history
   * @access  Private
   */
  static getBasedOnHistory = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 8;

    const recommendations = await RecommendationService.getBasedOnBrowsingHistory(
      userId,
      limit
    );

    res.status(200).json({
      success: true,
      data: recommendations,
    });
  });

  /**
   * @route   GET /api/v1/recommendations/new-arrivals
   * @desc    Get new arrivals
   * @access  Public
   */
  static getNewArrivals = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 12;

    const recommendations = await RecommendationService.getNewArrivals(limit);

    res.status(200).json({
      success: true,
      data: recommendations,
    });
  });

  /**
   * @route   GET /api/v1/recommendations/best-deals
   * @desc    Get best deals
   * @access  Public
   */
  static getBestDeals = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;

    const recommendations = await RecommendationService.getBestDeals(limit);

    res.status(200).json({
      success: true,
      data: recommendations,
    });
  });

  /**
   * @route   GET /api/v1/recommendations/complete-look/:productId
   * @desc    Get complete the look recommendations
   * @access  Public
   */
  static getCompleteTheLook = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit as string) || 4;

    const recommendations = await RecommendationService.getCompleteTheLook(
      productId,
      limit
    );

    res.status(200).json({
      success: true,
      data: recommendations,
    });
  });
}

export default RecommendationController;
