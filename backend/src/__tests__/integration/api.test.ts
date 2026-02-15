import request from 'supertest';
import app from '../../server';

describe('API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let productId: string;
  let orderId: string;

  // =====================================================
  // AUTHENTICATION TESTS
  // =====================================================
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `test${Date.now()}@example.com`,
          password: 'Password123!',
          full_name: 'Test User',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
    });

    it('should reject duplicate email', async () => {
      const email = `duplicate${Date.now()}@example.com`;
      
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'Password123!',
          full_name: 'Test User',
        });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'Password123!',
          full_name: 'Test User 2',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid@email.com',
          // missing password and full_name
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeAll(async () => {
      // Create a user for login tests
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'logintest@example.com',
          password: 'Password123!',
          full_name: 'Login Test User',
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      
      authToken = response.body.data.token;
      userId = response.body.data.user.id;
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  // =====================================================
  // PRODUCT TESTS
  // =====================================================
  describe('GET /api/v1/products', () => {
    it('should return list of products', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      
      if (response.body.data.products.length > 0) {
        productId = response.body.data.products[0].id;
      }
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/v1/products?category=sarees')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });

    it('should search products', async () => {
      const response = await request(app)
        .get('/api/v1/products?search=silk')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/products?page=1&limit=5')
        .expect(200);

      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(5);
    });
  });

  describe('GET /api/v1/products/:slug', () => {
    it('should return product details', async () => {
      const response = await request(app)
        .get('/api/v1/products/banarasi-silk-saree-royal-blue')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('variants');
      expect(response.body.data).toHaveProperty('images');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/v1/products/non-existent-product')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  // =====================================================
  // CART TESTS
  // =====================================================
  describe('Cart Operations', () => {
    let variantId: string;

    beforeAll(async () => {
      // Get a product variant
      const productRes = await request(app)
        .get('/api/v1/products/banarasi-silk-saree-royal-blue');
      
      if (productRes.body.data.variants && productRes.body.data.variants.length > 0) {
        variantId = productRes.body.data.variants[0].id;
      }
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/cart')
        .send({
          product_variant_id: variantId,
          quantity: 1,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should add item to cart', async () => {
      const response = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_variant_id: variantId,
          quantity: 2,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });

    it('should get user cart', async () => {
      const response = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should update cart item quantity', async () => {
      // First, get cart items
      const cartRes = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`);

      if (cartRes.body.data.length > 0) {
        const cartItemId = cartRes.body.data[0].id;

        const response = await request(app)
          .put(`/api/v1/cart/${cartItemId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ quantity: 3 })
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });
  });

  // =====================================================
  // COUPON TESTS
  // =====================================================
  describe('POST /api/v1/coupons/validate', () => {
    it('should validate a valid coupon', async () => {
      const response = await request(app)
        .post('/api/v1/coupons/validate')
        .send({
          code: 'WELCOME10',
          order_value: 2000,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('discount');
      expect(response.body.data.discount).toBeGreaterThan(0);
    });

    it('should reject invalid coupon', async () => {
      const response = await request(app)
        .post('/api/v1/coupons/validate')
        .send({
          code: 'INVALID_CODE',
          order_value: 2000,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject order below minimum value', async () => {
      const response = await request(app)
        .post('/api/v1/coupons/validate')
        .send({
          code: 'WELCOME10',
          order_value: 500, // Below minimum
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // =====================================================
  // CHECKOUT TESTS
  // =====================================================
  describe('Checkout Flow', () => {
    let addressId: string;

    it('should create user address', async () => {
      const response = await request(app)
        .post('/api/v1/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          address_line1: 'Test Address Line 1',
          address_line2: 'Test Address Line 2',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          country: 'India',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      addressId = response.body.data.id;
    });

    it('should complete checkout with COD', async () => {
      // First add items to cart
      const productRes = await request(app)
        .get('/api/v1/products/banarasi-silk-saree-royal-blue');
      
      const variantId = productRes.body.data.variants[0].id;

      await request(app)
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_variant_id: variantId,
          quantity: 1,
        });

      // Complete checkout
      const response = await request(app)
        .post('/api/v1/checkout/complete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shipping_address_id: addressId,
          payment_method: 'cod',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('order');
      orderId = response.body.data.order.id;
    });
  });

  // =====================================================
  // ORDER TESTS
  // =====================================================
  describe('GET /api/v1/orders', () => {
    it('should get user orders', async () => {
      const response = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get specific order details', async () => {
      if (orderId) {
        const response = await request(app)
          .get(`/api/v1/orders/${orderId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('order_number');
        expect(response.body.data).toHaveProperty('items');
      }
    });
  });

  // =====================================================
  // REVIEW TESTS
  // =====================================================
  describe('Reviews', () => {
    it('should submit a review', async () => {
      if (productId) {
        const response = await request(app)
          .post('/api/v1/reviews')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            product_id: productId,
            rating: 5,
            review_text: 'Excellent product! Highly recommend.',
          })
          .expect(201);

        expect(response.body.success).toBe(true);
      }
    });

    it('should get product reviews', async () => {
      if (productId) {
        const response = await request(app)
          .get(`/api/v1/reviews/product/${productId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });
  });

  // =====================================================
  // WISHLIST TESTS
  // =====================================================
  describe('Wishlist', () => {
    it('should add product to wishlist', async () => {
      if (productId) {
        const response = await request(app)
          .post('/api/v1/wishlist')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ product_id: productId })
          .expect(201);

        expect(response.body.success).toBe(true);
      }
    });

    it('should get wishlist items', async () => {
      const response = await request(app)
        .get('/api/v1/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  // =====================================================
  // ANALYTICS TESTS (Admin only)
  // =====================================================
  describe('Analytics (Admin)', () => {
    let adminToken: string;

    beforeAll(async () => {
      // Login as admin
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@karaboutique.com',
          password: 'password123',
        });

      adminToken = response.body.data.token;
    });

    it('should get dashboard analytics', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('orders');
      expect(response.body.data).toHaveProperty('customers');
    });

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
