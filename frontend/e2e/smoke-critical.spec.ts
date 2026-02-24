import { test, expect } from '@playwright/test';

const api = 'http://localhost:5000/api/v1';

test.describe('critical storefront smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`${api}/categories`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ id: '1', name: 'Sarees', slug: 'sarees' }] }),
      });
    });

    await page.route(`${api}/products*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            products: [
              {
                id: 'p1',
                slug: 'royal-saree',
                name: 'Royal Saree',
                base_price: 2000,
                discount_price: 1500,
                images: [{ image_url: '/uploads/sample.jpg' }],
              },
            ],
          },
        }),
      });
    });
  });

  test('products page renders and range slider updates values', async ({ page }) => {
    await page.goto('/products');

    await expect(page.getByText('All Products')).toBeVisible();
    await expect(page.getByText('Royal Saree')).toBeVisible();

    const sliders = page.locator('input[type="range"]');
    await expect(sliders).toHaveCount(2);

    await sliders.nth(0).fill('1000');
    await sliders.nth(1).fill('5000');

    await expect(page.getByText('₹1,000')).toBeVisible();
    await expect(page.getByText('₹5,000')).toBeVisible();
  });

  test('authenticated user can open profile menu and navigate to orders', async ({ context, page }) => {
    await context.addCookies([
      { name: 'token', value: 'demo-token', domain: 'localhost', path: '/' },
      {
        name: 'user',
        value: encodeURIComponent(JSON.stringify({ id: 'u1', full_name: 'Demo User', role: 'customer' })),
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.route(`${api}/auth/me`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { id: 'u1' } }),
      });
    });

    await page.route(`${api}/orders*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.goto('/');
    await page.getByRole('button', { name: /user/i }).click();
    await page.getByRole('link', { name: 'My Orders' }).click();

    await expect(page).toHaveURL(/\/orders/);
  });
});
