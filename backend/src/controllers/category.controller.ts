import { Request, Response } from 'express';
import CategoryModel from '../models/Category.model';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../middleware/errorHandler';
import { generateSlug } from '../utils/helpers';

export class CategoryController {
  /**
   * Create new category
   * POST /api/v1/categories
   * Admin only
   */
  static createCategory = asyncHandler(async (req: Request, res: Response) => {
    const { name, parent_id, meta_title, meta_description, display_order } = req.body;
    
    // Generate slug
    let slug = generateSlug(name);
    let counter = 1;
    while (await CategoryModel.slugExists(slug)) {
      slug = `${generateSlug(name)}-${counter}`;
      counter++;
    }
    
    const category = await CategoryModel.create({
      name,
      slug,
      parent_id,
      meta_title,
      meta_description,
      display_order,
    });
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  });
  
  /**
   * Get all categories
   * GET /api/v1/categories
   * Public
   */
  static getAllCategories = asyncHandler(async (req: Request, res: Response) => {
    const includeInactive = req.query.include_inactive === 'true';
    
    const categories = await CategoryModel.getAll(includeInactive);
    
    res.status(200).json({
      success: true,
      data: categories,
    });
  });
  
  /**
   * Get root categories (no parent)
   * GET /api/v1/categories/root
   * Public
   */
  static getRootCategories = asyncHandler(async (req: Request, res: Response) => {
    const categories = await CategoryModel.getRootCategories();
    
    res.status(200).json({
      success: true,
      data: categories,
    });
  });
  
  /**
   * Get category by ID
   * GET /api/v1/categories/:id
   * Public
   */
  static getCategoryById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const category = await CategoryModel.findById(id);
    
    if (!category) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }
    
    res.status(200).json({
      success: true,
      data: category,
    });
  });
  
  /**
   * Get category by slug
   * GET /api/v1/categories/slug/:slug
   * Public
   */
  static getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;
    
    const category = await CategoryModel.findBySlug(slug);
    
    if (!category) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }
    
    // Get subcategories
    const subcategories = await CategoryModel.getSubcategories(category.id);
    
    // Get product count
    const productCount = await CategoryModel.getProductCount(category.id);
    
    res.status(200).json({
      success: true,
      data: {
        ...category,
        subcategories,
        product_count: productCount,
      },
    });
  });
  
  /**
   * Get subcategories
   * GET /api/v1/categories/:id/subcategories
   * Public
   */
  static getSubcategories = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const subcategories = await CategoryModel.getSubcategories(id);
    
    res.status(200).json({
      success: true,
      data: subcategories,
    });
  });
  
  /**
   * Update category
   * PUT /api/v1/categories/:id
   * Admin only
   */
  static updateCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;
    
    // If updating name, generate new slug
    if (updateData.name) {
      let slug = generateSlug(updateData.name);
      let counter = 1;
      while (await CategoryModel.slugExists(slug, id)) {
        slug = `${generateSlug(updateData.name)}-${counter}`;
        counter++;
      }
      updateData.slug = slug;
    }
    
    const category = await CategoryModel.update(id, updateData);
    
    if (!category) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }
    
    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  });
  
  /**
   * Delete category
   * DELETE /api/v1/categories/:id
   * Admin only
   */
  static deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    // Check if category has products
    const productCount = await CategoryModel.getProductCount(id);
    
    if (productCount > 0) {
      throw new AppError(
        'Cannot delete category with products. Please reassign or delete products first.',
        400,
        'CATEGORY_HAS_PRODUCTS'
      );
    }
    
    // Check if category has subcategories
    const subcategories = await CategoryModel.getSubcategories(id);
    
    if (subcategories.length > 0) {
      throw new AppError(
        'Cannot delete category with subcategories. Please delete subcategories first.',
        400,
        'CATEGORY_HAS_SUBCATEGORIES'
      );
    }
    
    const deleted = await CategoryModel.delete(id);
    
    if (!deleted) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  });
}

export default CategoryController;
