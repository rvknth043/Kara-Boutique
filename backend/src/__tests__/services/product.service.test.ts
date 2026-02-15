import { ProductService } from '../../services/product.service';
import ProductModel from '../../models/Product.model';
import CategoryModel from '../../models/Category.model';

// Mock the models
jest.mock('../../models/Product.model');
jest.mock('../../models/Category.model');

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllProducts', () => {
    it('should return all active products', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Test Product 1',
          slug: 'test-product-1',
          base_price: 1000,
          is_active: true,
        },
        {
          id: '2',
          name: 'Test Product 2',
          slug: 'test-product-2',
          base_price: 2000,
          is_active: true,
        },
      ];

      (ProductModel.getAll as jest.Mock).mockResolvedValue({
        products: mockProducts,
        total: 2,
      });

      const result = await ProductService.getAllProducts();

      expect(result.products).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(ProductModel.getAll).toHaveBeenCalledTimes(1);
    });

    it('should filter products by category', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Saree',
          category_id: 'cat-1',
        },
      ];

      (ProductModel.getAll as jest.Mock).mockResolvedValue({
        products: mockProducts,
        total: 1,
      });

      const result = await ProductService.getAllProducts({
        category: 'cat-1',
      });

      expect(result.products).toHaveLength(1);
      expect(result.products[0].category_id).toBe('cat-1');
    });

    it('should handle search query', async () => {
      (ProductModel.getAll as jest.Mock).mockResolvedValue({
        products: [],
        total: 0,
      });

      await ProductService.getAllProducts({ search: 'silk saree' });

      expect(ProductModel.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'silk saree',
        })
      );
    });
  });

  describe('getProductBySlug', () => {
    it('should return product with details by slug', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        slug: 'test-product',
        base_price: 1000,
        variants: [],
        images: [],
      };

      (ProductModel.findBySlugWithDetails as jest.Mock).mockResolvedValue(
        mockProduct
      );

      const result = await ProductService.getProductBySlug('test-product');

      expect(result).toEqual(mockProduct);
      expect(ProductModel.findBySlugWithDetails).toHaveBeenCalledWith(
        'test-product'
      );
    });

    it('should throw error if product not found', async () => {
      (ProductModel.findBySlugWithDetails as jest.Mock).mockResolvedValue(
        null
      );

      await expect(
        ProductService.getProductBySlug('non-existent')
      ).rejects.toThrow('Product not found');
    });
  });

  describe('createProduct', () => {
    it('should create a new product successfully', async () => {
      const productData = {
        name: 'New Product',
        slug: 'new-product',
        description: 'Test description',
        base_price: 1500,
        category_id: 'cat-1',
      };

      const mockCreatedProduct = {
        id: '1',
        ...productData,
        created_at: new Date(),
      };

      (ProductModel.create as jest.Mock).mockResolvedValue(
        mockCreatedProduct
      );

      const result = await ProductService.createProduct(productData);

      expect(result).toEqual(mockCreatedProduct);
      expect(ProductModel.create).toHaveBeenCalledWith(productData);
    });

    it('should validate product data before creation', async () => {
      const invalidData = {
        name: '',
        slug: 'test',
        base_price: -100, // Invalid negative price
        category_id: 'cat-1',
      };

      await expect(
        ProductService.createProduct(invalidData)
      ).rejects.toThrow();
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      const updateData = {
        name: 'Updated Product',
        base_price: 2000,
      };

      const mockUpdatedProduct = {
        id: '1',
        ...updateData,
      };

      (ProductModel.update as jest.Mock).mockResolvedValue(
        mockUpdatedProduct
      );

      const result = await ProductService.updateProduct('1', updateData);

      expect(result).toEqual(mockUpdatedProduct);
      expect(ProductModel.update).toHaveBeenCalledWith('1', updateData);
    });
  });

  describe('toggleProductActive', () => {
    it('should toggle product active status', async () => {
      const mockProduct = {
        id: '1',
        is_active: false,
      };

      (ProductModel.toggleActive as jest.Mock).mockResolvedValue(mockProduct);

      const result = await ProductService.toggleProductActive('1');

      expect(result.is_active).toBe(false);
      expect(ProductModel.toggleActive).toHaveBeenCalledWith('1');
    });
  });

  describe('getFeaturedProducts', () => {
    it('should return only featured products', async () => {
      const mockFeaturedProducts = [
        {
          id: '1',
          name: 'Featured Product',
          is_featured: true,
        },
      ];

      (ProductModel.getFeatured as jest.Mock).mockResolvedValue(
        mockFeaturedProducts
      );

      const result = await ProductService.getFeaturedProducts(5);

      expect(result).toHaveLength(1);
      expect(result[0].is_featured).toBe(true);
      expect(ProductModel.getFeatured).toHaveBeenCalledWith(5);
    });
  });
});
