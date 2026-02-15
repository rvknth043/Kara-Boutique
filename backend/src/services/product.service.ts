import ProductModel, { CreateProductData, UpdateProductData, ProductFilters } from '../models/Product.model';
import ProductVariantModel, { CreateVariantData } from '../models/ProductVariant.model';
import ProductImageModel, { CreateImageData } from '../models/ProductImage.model';
import SizeChartModel, { CreateSizeChartData } from '../models/SizeChart.model';
import CategoryModel from '../models/Category.model';
import { AppError } from '../middleware/errorHandler';
import { generateSlug, generateSKU } from '../utils/helpers';
import { CacheService, CACHE_KEYS, CACHE_TTL } from '../config/redis';
import { ProductWithDetails } from '../types/shared.types';

export interface CreateCompleteProductData {
  name: string;
  description?: string;
  category_id: string;
  base_price: number;
  discount_price?: number;
  hsn_code?: string;
  is_featured?: boolean;
  variants: Array<{
    size: string;
    color: string;
    stock_quantity: number;
  }>;
  images?: Array<{
    image_url: string;
    color_variant?: string;
    is_primary?: boolean;
  }>;
  size_chart?: Array<{
    size: string;
    bust?: string;
    waist?: string;
    hips?: string;
    length?: string;
    shoulder?: string;
  }>;
}

export class ProductService {
  /**
   * Create complete product with variants, images, and size chart
   */
  static async createProduct(data: CreateCompleteProductData): Promise<ProductWithDetails> {
    // Validate category exists
    const category = await CategoryModel.findById(data.category_id);
    if (!category) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }
    
    // Generate unique slug
    let slug = generateSlug(data.name);
    let counter = 1;
    while (await ProductModel.slugExists(slug)) {
      slug = `${generateSlug(data.name)}-${counter}`;
      counter++;
    }
    
    // Create product
    const productData: CreateProductData = {
      name: data.name,
      slug,
      description: data.description,
      category_id: data.category_id,
      base_price: data.base_price,
      discount_price: data.discount_price,
      hsn_code: data.hsn_code,
      is_featured: data.is_featured,
    };
    
    const product = await ProductModel.create(productData);
    
    // Create variants
    if (data.variants && data.variants.length > 0) {
      const variantData: CreateVariantData[] = data.variants.map((variant) => ({
        product_id: product.id,
        size: variant.size as any,
        color: variant.color,
        stock_quantity: variant.stock_quantity,
        sku: generateSKU(product.name, variant.color, variant.size),
      }));
      
      await ProductVariantModel.createMany(variantData);
    }
    
    // Create images
    if (data.images && data.images.length > 0) {
      const imageData: CreateImageData[] = data.images.map((image, index) => ({
        product_id: product.id,
        image_url: image.image_url,
        color_variant: image.color_variant,
        display_order: index,
        is_primary: image.is_primary || index === 0,
      }));
      
      await ProductImageModel.createMany(imageData);
    }
    
    // Create size chart
    if (data.size_chart && data.size_chart.length > 0) {
      const sizeChartData: CreateSizeChartData[] = data.size_chart.map((chart) => ({
        product_id: product.id,
        size: chart.size as any,
        bust: chart.bust,
        waist: chart.waist,
        hips: chart.hips,
        length: chart.length,
        shoulder: chart.shoulder,
      }));
      
      await SizeChartModel.createMany(sizeChartData);
    }
    
    // Clear cache
    await CacheService.delPattern('products:*');
    
    // Return complete product
    const completeProduct = await ProductModel.findByIdWithDetails(product.id);
    if (!completeProduct) {
      throw new AppError('Product created but not found', 500, 'PRODUCT_NOT_FOUND');
    }
    
    return completeProduct;
  }
  
  /**
   * Get product by ID with caching
   */
  static async getProductById(id: string): Promise<ProductWithDetails> {
    // Check cache
    const cacheKey = CACHE_KEYS.PRODUCT(id);
    const cached = await CacheService.get<ProductWithDetails>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    // Fetch from database
    const product = await ProductModel.findByIdWithDetails(id);
    
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }
    
    if (!product.is_active) {
      throw new AppError('Product is not available', 404, 'PRODUCT_INACTIVE');
    }
    
    // Increment view count (async, don't wait)
    ProductModel.incrementViewCount(id).catch(err => 
      console.error('Failed to increment view count:', err)
    );
    
    // Cache product
    await CacheService.set(cacheKey, product, CACHE_TTL.PRODUCT);
    
    return product;
  }
  
  /**
   * Get product by slug with caching
   */
  static async getProductBySlug(slug: string): Promise<ProductWithDetails> {
    // Check cache
    const cacheKey = CACHE_KEYS.PRODUCT_BY_SLUG(slug);
    const cached = await CacheService.get<ProductWithDetails>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    // Fetch from database
    const product = await ProductModel.findBySlug(slug);
    
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }
    
    // Get complete details
    const completeProduct = await ProductModel.findByIdWithDetails(product.id);
    
    if (!completeProduct) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }
    
    if (!completeProduct.is_active) {
      throw new AppError('Product is not available', 404, 'PRODUCT_INACTIVE');
    }
    
    // Increment view count
    ProductModel.incrementViewCount(product.id).catch(err => 
      console.error('Failed to increment view count:', err)
    );
    
    // Cache product
    await CacheService.set(cacheKey, completeProduct, CACHE_TTL.PRODUCT);
    
    return completeProduct;
  }
  
  /**
   * Get all products with filters and pagination
   */
  static async getAllProducts(
    filters: ProductFilters = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'created_at',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ) {
    const result = await ProductModel.getAll(filters, page, limit, sortBy, sortOrder);
    
    return {
      products: result.products,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }
  
  /**
   * Search products
   */
  static async searchProducts(
    searchTerm: string,
    page: number = 1,
    limit: number = 20
  ) {
    const result = await ProductModel.search(searchTerm, page, limit);
    
    return {
      products: result.products,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }
  
  /**
   * Get featured products
   */
  static async getFeaturedProducts(limit: number = 10) {
    return await ProductModel.getFeatured(limit);
  }
  
  /**
   * Get products by category
   */
  static async getProductsByCategory(
    categorySlug: string,
    page: number = 1,
    limit: number = 20
  ) {
    const category = await CategoryModel.findBySlug(categorySlug);
    
    if (!category) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }
    
    const result = await ProductModel.getByCategory(category.id, page, limit);
    
    return {
      category,
      products: result.products,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }
  
  /**
   * Update product
   */
  static async updateProduct(
    id: string,
    data: UpdateProductData
  ): Promise<ProductWithDetails> {
    // Check if product exists
    const existingProduct = await ProductModel.findById(id);
    if (!existingProduct) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }
    
    // If updating category, validate it exists
    if (data.category_id) {
      const category = await CategoryModel.findById(data.category_id);
      if (!category) {
        throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
      }
    }
    
    // If updating name, generate new slug
    if (data.name && data.name !== existingProduct.name) {
      let slug = generateSlug(data.name);
      let counter = 1;
      while (await ProductModel.slugExists(slug, id)) {
        slug = `${generateSlug(data.name)}-${counter}`;
        counter++;
      }
      data.slug = slug;
    }
    
    // Update product
    await ProductModel.update(id, data);
    
    // Clear cache
    await CacheService.del(CACHE_KEYS.PRODUCT(id));
    await CacheService.del(CACHE_KEYS.PRODUCT_BY_SLUG(existingProduct.slug));
    await CacheService.delPattern('products:*');
    
    // Return updated product
    const updatedProduct = await ProductModel.findByIdWithDetails(id);
    if (!updatedProduct) {
      throw new AppError('Product not found after update', 500, 'PRODUCT_NOT_FOUND');
    }
    
    return updatedProduct;
  }
  
  /**
   * Delete product (soft delete)
   */
  static async deleteProduct(id: string): Promise<void> {
    const product = await ProductModel.findById(id);
    
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }
    
    await ProductModel.delete(id);
    
    // Clear cache
    await CacheService.del(CACHE_KEYS.PRODUCT(id));
    await CacheService.del(CACHE_KEYS.PRODUCT_BY_SLUG(product.slug));
    await CacheService.delPattern('products:*');
  }
  
  /**
   * Add variant to existing product
   */
  static async addVariant(
    productId: string,
    variantData: { size: string; color: string; stock_quantity: number }
  ) {
    const product = await ProductModel.findById(productId);
    
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }
    
    const sku = generateSKU(product.name, variantData.color, variantData.size);
    
    const variant = await ProductVariantModel.create({
      product_id: productId,
      size: variantData.size as any,
      color: variantData.color,
      stock_quantity: variantData.stock_quantity,
      sku,
    });
    
    // Clear cache
    await CacheService.del(CACHE_KEYS.PRODUCT(productId));
    
    return variant;
  }
  
  /**
   * Update variant stock
   */
  static async updateVariantStock(
    variantId: string,
    quantityChange: number
  ) {
    const variant = await ProductVariantModel.updateStock(variantId, quantityChange);
    
    if (!variant) {
      throw new AppError('Variant not found', 404, 'VARIANT_NOT_FOUND');
    }
    
    // Clear product cache
    await CacheService.del(CACHE_KEYS.PRODUCT(variant.product_id));
    
    return variant;
  }
  
  /**
   * Get low stock products
   */
  static async getLowStockProducts(threshold: number = 10) {
    return await ProductVariantModel.getLowStock(threshold);
  }
}

export default ProductService;
