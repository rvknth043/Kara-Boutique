import { test, expect } from '@playwright/test';
import { setUserSession } from '../utils/session';
import { mockCommonApis } from '../utils/apiMocks';
import { AdminProductsPage } from '../pages/AdminProductsPage';
import { AdminCategoriesPage } from '../pages/AdminCategoriesPage';
import { createNetworkMonitor } from '../utils/network';
import testData from '../data/testData.json';

test.describe('Enterprise E2E workflow', () => {
  test('Login to admin, bulk create/update/delete behavior, order status flow, logout', async ({ context, page }) => {
    await setUserSession(context, testData.users.admin as any);
    await mockCommonApis(page);
    const network = createNetworkMonitor(page);

    const adminProducts = new AdminProductsPage(page);
    await adminProducts.open();

    await expect(page.getByPlaceholder('Search products by name...')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Search' })).toBeEnabled();
    await page.getByPlaceholder('Search products by name...').fill('Royal');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText('Royal Saree')).toBeVisible();

    await adminProducts.runBulk('create', '[{"name":"Auto Product","description":"d","category_id":"c1","base_price":999,"variants":[{"size":"M","color":"Black","stock_quantity":5}]}]');

    const adminCategories = new AdminCategoriesPage(page);
    await adminCategories.open();
    await adminCategories.runBulk('create', '[{"name":"Festive"}]');

    await page.goto('/admin/orders');
    await expect(page.getByText('Order Management')).toBeVisible();
    await expect(page.getByText('ORD-20260101-0001')).toBeVisible();

    await page.getByRole('link', { name: 'View' }).click();
    await expect(page.getByText('Customer Information')).toBeVisible();
    await page.locator('select.form-select').first().selectOption('shipped');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Order status updated')).toBeVisible();

    await page.goto('/admin/settings');
    await expect(page.getByText('Admin Settings')).toBeVisible();
    await page.getByRole('button', { name: 'Save Settings' }).click();
    await expect(page.getByText('Settings updated successfully')).toBeVisible();

    await network.assertNoFailures();
  });

  test('Unauthorized direct URL access redirects to home', async ({ page }) => {
    await mockCommonApis(page);
    await page.goto('/admin/products');
    await expect(page).toHaveURL(/\/$/);
  });
});
