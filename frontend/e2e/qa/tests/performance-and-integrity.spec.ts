import { test, expect } from '@playwright/test';
import { mockCommonApis } from '../utils/apiMocks';
import { setUserSession } from '../utils/session';
import testData from '../data/testData.json';

test.describe('Performance and data integrity', () => {
  test('Products table count equals mocked API record count and api time < 2s', async ({ context, page }) => {
    await setUserSession(context, testData.users.admin as any);
    await mockCommonApis(page);

    const t0 = Date.now();
    const responsePromise = page.waitForResponse((r) => r.url().includes('/products') && r.request().method() === 'GET');
    await page.goto('/admin/products');
    const response = await responsePromise;
    const apiMs = Date.now() - t0;

    expect(response.ok()).toBeTruthy();
    expect(apiMs).toBeLessThan(2000);

    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(testData.products.length);
  });

  test('Orders pagination metadata rendered and table data consistent', async ({ context, page }) => {
    await setUserSession(context, testData.users.admin as any);
    await mockCommonApis(page);

    await page.goto('/admin/orders');
    await expect(page.getByText('Page 1 of 1')).toBeVisible();
    await expect(page.getByText('Total: 1')).toBeVisible();
    await expect(page.getByText('ORD-20260101-0001')).toBeVisible();
  });
});
