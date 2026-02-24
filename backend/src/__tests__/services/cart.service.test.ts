import { CartService } from '../../services/cart.service';
import CartModel from '../../models/Cart.model';
import ProductVariantModel from '../../models/ProductVariant.model';
import { CacheService } from '../../config/redis';

jest.mock('../../models/Cart.model');
jest.mock('../../models/ProductVariant.model');
jest.mock('../../models/Product.model');
jest.mock('../../config/redis', () => ({
  CacheService: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
  CACHE_KEYS: {
    CART: (userId: string) => `cart:${userId}`,
  },
  CACHE_TTL: {
    CART: 3600,
  },
}));

describe('CartService', () => {
  const userId = 'user-1';
  const variantId = 'variant-1';

  beforeEach(() => {
    jest.clearAllMocks();
    (CacheService.get as jest.Mock).mockResolvedValue(null);
    (CacheService.set as jest.Mock).mockResolvedValue(undefined);
    (CacheService.del as jest.Mock).mockResolvedValue(undefined);
  });

  it('adds item to cart when stock is available', async () => {
    (ProductVariantModel.findById as jest.Mock).mockResolvedValue({
      id: variantId,
      is_active: true,
      stock_quantity: 10,
      reserved_quantity: 0,
    });
    (ProductVariantModel.hasStock as jest.Mock).mockResolvedValue(true);
    (CartModel.getItemByVariant as jest.Mock).mockResolvedValue(null);
    (CartModel.addItem as jest.Mock).mockResolvedValue({ id: 'cart-1', user_id: userId, product_variant_id: variantId, quantity: 2 });

    const result = await CartService.addToCart(userId, variantId, 2);

    expect(CartModel.addItem).toHaveBeenCalledWith(userId, variantId, 2);
    expect(result.id).toBe('cart-1');
  });

  it('returns summarized cart payload', async () => {
    (CartModel.getUserCart as jest.Mock).mockResolvedValue([
      { id: '1', quantity: 2, subtotal: 1000 },
      { id: '2', quantity: 1, subtotal: 500 },
    ]);

    const result = await CartService.getCart(userId);

    expect(result.subtotal).toBe(1500);
    expect(result.item_count).toBe(3);
    expect(result.total).toBeGreaterThanOrEqual(1500);
  });

  it('updates quantity for existing cart item', async () => {
    (CartModel.getItemById as jest.Mock).mockResolvedValue({
      id: 'item-1',
      user_id: userId,
      product_variant_id: variantId,
      quantity: 1,
    });
    (ProductVariantModel.hasStock as jest.Mock).mockResolvedValue(true);
    (CartModel.updateQuantity as jest.Mock).mockResolvedValue({ id: 'item-1', quantity: 3 });

    const result = await CartService.updateQuantity(userId, 'item-1', 3);

    expect(CartModel.updateQuantity).toHaveBeenCalledWith('item-1', userId, 3);
    expect(result.quantity).toBe(3);
  });

  it('removes item from cart', async () => {
    (CartModel.removeItem as jest.Mock).mockResolvedValue(true);

    const result = await CartService.removeItem(userId, 'item-1');

    expect(result.success).toBe(true);
    expect(CartModel.removeItem).toHaveBeenCalledWith('item-1', userId);
  });

  it('clears cart', async () => {
    (CartModel.clearCart as jest.Mock).mockResolvedValue(true);

    const result = await CartService.clearCart(userId);

    expect(result.success).toBe(true);
    expect(CartModel.clearCart).toHaveBeenCalledWith(userId);
  });
});
