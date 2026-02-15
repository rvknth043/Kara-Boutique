import { Request, Response } from 'express';
import ProductService from '../services/product.service';
import { asyncHandler } from '../middleware/errorHandler';
import { sanitizePaginationParams } from '../utils/pagination';
import { getPaginationMeta } from '../utils/pagination';

export class ProductController {
  /**
   * Create new product
   * POST /api/v1/products
   * Admin only
   */
  static createProduct = asyncHandler(async (req: Request, res: Response) => {
    const productData = req.body;
    
    const product = await ProductService.createProduct(productData);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  });
  
  /**
   * Get all products with filters
   * GET /api/v1/products
   * Public
   */
  static getAllProducts = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = sanitizePaginationParams(req.query.page, req.query.limit);
    
    const filters: any = {};
    
    // Apply filters
    if (req.query.category_id) {
      filters.category_id = req.query.category_id as string;
    }
    
    if (req.query.min_price) {
      filters.min_price = parseFloat(req.query.min_price as string);
    }
    
    if (req.query.max_price) {
      filters.max_price = parseFloat(req.query.max_price as string);
    }
    
    if (req.query.is_featured !== undefined) {
      filters.is_featured = req.query.is_featured === 'true';
    }
    
    if (req.query.search) {
      filters.search = req.query.search as string;
    }
    
    // Sorting
    const sortBy = (req.query.sort_by as string) || 'created_at';
    const sortOrder = (req.query.sort_order as 'ASC' | 'DESC') || 'DESC';
    
    const result = await ProductService.getAllProducts(
      filters,
      page,
      limit,
      sortBy,
      sortOrder
    );
    
    res.status(200).json({
      success: true,
      data: {
        products: result.products,
        pagination: getPaginationMeta(page, limit, result.total),
      },
    });
  });
  
  /**
   * Get product by ID
   * GET /api/v1/products/:id
   * Public
   */
  static getProductById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const product = await ProductService.getProductById(id);
    
    res.status(200).json({
      success: true,
      data: product,
    });
  });
  
  /**
   * Get product by slug
   * GET /api/v1/products/slug/:slug
   * Public
   */
  static getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;
    
    const product = await ProductService.getProductBySlug(slug);
    
    res.status(200).json({
      success: true,
      data: product,
    });
  });
  
  /**
   * Search products
   * GET /api/v1/products/search
   * Public
   */
  static searchProducts = asyncHandler(async (req: Request, res: Response) => {
    const searchTerm = req.query.q as string;
    
    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SEARCH_TERM_REQUIRED',
          message: 'Search term is required',
        },
      });
    }
    
    const { page, limit } = sanitizePaginationParams(req.query.page, req.query.limit);
    
    const result = await ProductService.searchProducts(searchTerm, page, limit);
    
    res.status(200).json({
      success: true,
      data: {
        products: result.products,
        pagination: getPaginationMeta(page, limit, result.total),
      },
    });
  });
  
  /**
   * Get featured products
   * GET /api/v1/products/featured
   * Public
   */
  static getFeaturedProducts = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const products = await ProductService.getFeaturedProducts(limit);
    
    res.status(200).json({
      success: true,
      data: products,
    });
  });
  
  /**
   * Get products by category
   * GET /api/v1/products/category/:slug
   * Public
   */
  static getProductsByCategory = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;
    const { page, limit } = sanitizePaginationParams(req.query.page, req.query.limit);
    
    const result = await ProductService.getProductsByCategory(slug, page, limit);
    
    res.status(200).json({
      success: true,
      data: {
        category: result.category,
        products: result.products,
        pagination: getPaginationMeta(page, limit, result.total),
      },
    });
  });
  
  /**
   * Update product
   * PUT /api/v1/products/:id
   * Admin only
   */
  static updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const product = await ProductService.updateProduct(id, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  });
  
  /**
   * Delete product
   * DELETE /api/v1/products/:id
   * Admin only
   */
  static deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    await ProductService.deleteProduct(id);
    
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  });
  
  /**
   * Add variant to product
   * POST /api/v1/products/:id/variants
   * Admin only
   */
  static addVariant = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const variantData = req.body;
    
    const variant = await ProductService.addVariant(id, variantData);
    
    res.status(201).json({
      success: true,
      message: 'Variant added successfully',
      data: variant,
    });
  });
  
  /**
   * Update variant stock
   * PUT /api/v1/products/variants/:variantId/stock
   * Admin only
   */
  static updateVariantStock = asyncHandler(async (req: Request, res: Response) => {
    const { variantId } = req.params;
    const { quantity_change } = req.body;
    
    const variant = await ProductService.updateVariantStock(variantId, quantity_change);
    
    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: variant,
    });
  });
  
  /**
   * Get low stock products
   * GET /api/v1/products/low-stock
   * Admin only
   */
  static getLowStockProducts = asyncHandler(async (req: Request, res: Response) => {
    const threshold = parseInt(req.query.threshold as string) || 10;
    
    const products = await ProductService.getLowStockProducts(threshold);
    
    res.status(200).json({
      success: true,
      data: products,
    });
  });
}

export default ProductController;
