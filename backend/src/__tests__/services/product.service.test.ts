import { ProductService } from '../../services/product.service';
import ProductModel from '../../models/Product.model';
import CategoryModel from '../../models/Category.model';
import { CacheService } from '../../config/redis';

jest.mock('../../models/Product.model');
jest.mock('../../models/Category.model');
jest.mock('../../config/redis', () => ({
  CacheService: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delPattern: jest.fn(),
  },
  CACHE_KEYS: {
    PRODUCT: (id: string) => `product:${id}`,
    PRODUCT_BY_SLUG: (slug: string) => `product:slug:${slug}`,
  },
  CACHE_TTL: {
    PRODUCT: 3600,
  },
}));

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (CacheService.get as jest.Mock).mockResolvedValue(null);
    (CacheService.set as jest.Mock).mockResolvedValue(undefined);
    (CacheService.del as jest.Mock).mockResolvedValue(undefined);
    (CacheService.delPattern as jest.Mock).mockResolvedValue(undefined);
  });

  it('returns filtered products with pagination metadata', async () => {
    (ProductModel.getAll as jest.Mock).mockResolvedValue({
      products: [{ id: '1', name: 'Saree', category_id: 'cat-1' }],
      total: 1,
    });

    const result = await ProductService.getAllProducts({ category_id: 'cat-1' }, 1, 20);

    expect(ProductModel.getAll).toHaveBeenCalledWith({ category_id: 'cat-1' }, 1, 20, 'created_at', 'DESC');
    expect(result.products).toHaveLength(1);
    expect(result.totalPages).toBe(1);
  });

  it('returns product by slug', async () => {
    const baseProduct = { id: '1', slug: 'test-product' } as any;
    const fullProduct = { id: '1', slug: 'test-product', is_active: true, variants: [], images: [] } as any;

    (ProductModel.findBySlug as jest.Mock).mockResolvedValue(baseProduct);
    (ProductModel.findByIdWithDetails as jest.Mock).mockResolvedValue(fullProduct);
    (ProductModel.incrementViewCount as jest.Mock).mockResolvedValue(undefined);

    const result = await ProductService.getProductBySlug('test-product');

    expect(result).toEqual(fullProduct);
    expect(ProductModel.findBySlug).toHaveBeenCalledWith('test-product');
    expect(ProductModel.findByIdWithDetails).toHaveBeenCalledWith('1');
  });

  it('updates product and returns full details', async () => {
    (ProductModel.findById as jest.Mock).mockResolvedValue({ id: '1', name: 'Old Product', slug: 'old-product' });
    (ProductModel.update as jest.Mock).mockResolvedValue(undefined);
    (ProductModel.findByIdWithDetails as jest.Mock).mockResolvedValue({ id: '1', name: 'Updated Product', slug: 'updated-product', is_active: true });
    (ProductModel.slugExists as jest.Mock).mockResolvedValue(false);
    (CategoryModel.findById as jest.Mock).mockResolvedValue({ id: 'cat-1', name: 'Cat' });

    const result = await ProductService.updateProduct('1', { name: 'Updated Product', category_id: 'cat-1' } as any);

    expect(ProductModel.update).toHaveBeenCalled();
    expect(result.name).toBe('Updated Product');
  });
});
