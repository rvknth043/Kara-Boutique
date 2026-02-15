import { test, expect } from '@playwright/test';

// =====================================================
// USER JOURNEY TESTS
// =====================================================

test.describe('Complete Purchase Flow', () => {
  test('user can browse, add to cart, and complete purchase', async ({ page }) => {
    // 1. Visit homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/Kara Boutique/);

    // 2. Navigate to products
    await page.click('text=Products');
    await expect(page).toHaveURL(/\/products/);

    // 3. Click on a product
    await page.click('.product-card:first-child');
    await expect(page.locator('h1')).toBeVisible();

    // 4. Select size and color
    await page.click('button:has-text("M")');
    await page.click('button:has-text("Black")');

    // 5. Add to cart
    await page.click('button:has-text("Add to Cart")');
    
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/\/login/);

    // 6. Login
    await page.fill('input[type="email"]', 'priya.sharma@gmail.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 7. Should be back on product page or cart
    await page.waitForURL(/\/(products|cart)/);

    // 8. Go to cart
    await page.click('text=Cart');
    await expect(page).toHaveURL(/\/cart/);

    // 9. Apply coupon
    await page.fill('input[placeholder*="coupon"]', 'WELCOME10');
    await page.click('button:has-text("Apply")');
    await expect(page.locator('text=discount applied')).toBeVisible();

    // 10. Proceed to checkout
    await page.click('button:has-text("Proceed to Checkout")');
    await expect(page).toHaveURL(/\/checkout/);

    // 11. Select address
    await page.click('.address-card:first-child');

    // 12. Select payment method
    await page.click('input[value="cod"]');

    // 13. Place order
    await page.click('button:has-text("Place Order")');

    // 14. Verify order confirmation
    await expect(page.locator('text=Order placed')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('User Registration', () => {
  test('new user can register successfully', async ({ page }) => {
    await page.goto('/register');

    // Fill registration form
    await page.fill('input[name="full_name"]', 'Test User');
    await page.fill('input[type="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[type="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to home or profile
    await expect(page).toHaveURL(/\/(|account)/);
  });

  test('shows validation errors for invalid data', async ({ page }) => {
    await page.goto('/register');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=/required/i')).toBeVisible();
  });
});

test.describe('Product Browsing', () => {
  test('can filter products by category', async ({ page }) => {
    await page.goto('/products');

    // Click on a category filter
    await page.click('text=Sarees');

    // URL should update with category filter
    await expect(page).toHaveURL(/category=sarees/);

    // Products should be filtered
    await expect(page.locator('.product-card')).toHaveCount({ min: 1 });
  });

  test('can search for products', async ({ page }) => {
    await page.goto('/products');

    // Enter search query
    await page.fill('input[placeholder*="Search"]', 'silk');
    await page.press('input[placeholder*="Search"]', 'Enter');

    // URL should include search parameter
    await expect(page).toHaveURL(/search=silk/);

    // Results should be shown
    await expect(page.locator('.product-card')).toHaveCount({ min: 1 });
  });

  test('can sort products by price', async ({ page }) => {
    await page.goto('/products');

    // Select sort option
    await page.selectOption('select[name="sort"]', 'price_low');

    // Products should be re-ordered
    const firstPrice = await page.locator('.product-card:first-child .price').textContent();
    const lastPrice = await page.locator('.product-card:last-child .price').textContent();

    // First price should be less than or equal to last price
    expect(parseFloat(firstPrice!.replace(/[^\d.]/g, '')))
      .toBeLessThanOrEqual(parseFloat(lastPrice!.replace(/[^\d.]/g, '')));
  });
});

test.describe('Wishlist', () => {
  test.beforeEach(async ({ page }) => {
    // Login before wishlist tests
    await page.goto('/login');
    await page.fill('input[type="email"]', 'priya.sharma@gmail.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('can add product to wishlist', async ({ page }) => {
    await page.goto('/products');
    
    // Click on first product
    await page.click('.product-card:first-child');

    // Click wishlist button
    await page.click('button[aria-label="Add to Wishlist"]');

    // Should show success message
    await expect(page.locator('text=Added to wishlist')).toBeVisible();
  });

  test('can view and remove from wishlist', async ({ page }) => {
    await page.goto('/wishlist');

    // Should show wishlist items
    await expect(page.locator('.wishlist-item')).toHaveCount({ min: 1 });

    // Remove first item
    await page.click('.wishlist-item:first-child button:has-text("Remove")');

    // Should show confirmation
    await expect(page.locator('text=Removed from wishlist')).toBeVisible();
  });
});

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@karaboutique.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('admin can access dashboard', async ({ page }) => {
    await page.goto('/admin');

    // Should see dashboard
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('.stats-card')).toHaveCount({ min: 4 });
  });

  test('admin can manage orders', async ({ page }) => {
    await page.goto('/admin/orders');

    // Should see orders table
    await expect(page.locator('table')).toBeVisible();

    // Click on first order
    await page.click('tr:nth-child(2)');

    // Should see order details
    await expect(page.locator('text=Order Details')).toBeVisible();
  });

  test('admin can update order status', async ({ page }) => {
    await page.goto('/admin/orders');

    // Select first order
    await page.click('tr:nth-child(2) button:has-text("View")');

    // Change status
    await page.selectOption('select[name="order_status"]', 'shipped');
    await page.click('button:has-text("Save Changes")');

    // Should show success message
    await expect(page.locator('text=Order status updated')).toBeVisible();
  });

  test('admin can create coupon', async ({ page }) => {
    await page.goto('/admin/coupons');

    // Click create button
    await page.click('button:has-text("Create Coupon")');

    // Fill coupon form
    await page.fill('input[name="code"]', `TEST${Date.now()}`);
    await page.selectOption('select[name="type"]', 'percentage');
    await page.fill('input[name="value"]', '15');
    await page.fill('input[name="min_order_value"]', '1000');

    // Set dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('input[name="valid_from"]', tomorrow.toISOString().slice(0, 16));
    
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    await page.fill('input[name="valid_until"]', nextMonth.toISOString().slice(0, 16));

    // Submit
    await page.click('button[type="submit"]');

    // Should show success
    await expect(page.locator('text=Coupon created')).toBeVisible();
  });
});

test.describe('Reviews', () => {
  test.beforeEach(async ({ page }) => {
    // Login before review tests
    await page.goto('/login');
    await page.fill('input[type="email"]', 'priya.sharma@gmail.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('can submit product review', async ({ page }) => {
    await page.goto('/products/banarasi-silk-saree-royal-blue');

    // Click write review
    await page.click('button:has-text("Write a Review")');

    // Select star rating
    await page.click('button[aria-label="5 stars"]');

    // Write review text
    await page.fill('textarea', 'Excellent product! Beautiful color and quality.');

    // Submit
    await page.click('button:has-text("Submit Review")');

    // Should show success
    await expect(page.locator('text=Review submitted')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('mobile navigation works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Click hamburger menu
    await page.click('button[aria-label="Menu"]');

    // Menu should be visible
    await expect(page.locator('.mobile-menu')).toBeVisible();

    // Click on Products
    await page.click('.mobile-menu a:has-text("Products")');

    // Should navigate to products
    await expect(page).toHaveURL(/\/products/);
  });

  test('checkout works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'priya.sharma@gmail.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Go to checkout
    await page.goto('/checkout');

    // All checkout elements should be accessible
    await expect(page.locator('.address-selection')).toBeVisible();
    await expect(page.locator('.payment-method')).toBeVisible();
    await expect(page.locator('.order-summary')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('homepage loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('product listing is paginated', async ({ page }) => {
    await page.goto('/products');

    // Should have pagination controls if many products
    const productCount = await page.locator('.product-card').count();
    
    if (productCount >= 20) {
      await expect(page.locator('.pagination')).toBeVisible();
    }
  });
});
