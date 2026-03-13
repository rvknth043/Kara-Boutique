import { test, expect } from '@playwright/test';
import { mockCommonApis } from '../utils/apiMocks';
import { setUserSession } from '../utils/session';
import testData from '../data/testData.json';

test.describe('Validation, boundary and security checks', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonApis(page);
  });

  test('Bulk JSON invalid payload shows validation error', async ({ context, page }) => {
    await setUserSession(context, testData.users.admin as any);
    await page.goto('/admin/products');
    await page.locator('textarea.form-control').fill('{invalid-json');
    await page.getByRole('button', { name: 'Run Bulk Operation' }).click();
    await expect(page.getByText('Invalid JSON payload')).toBeVisible();
  });

  test('Boundary: empty bulk array blocked', async ({ context, page }) => {
    await setUserSession(context, testData.users.admin as any);
    await page.goto('/admin/categories');
    await page.locator('textarea.form-control').fill('[]');
    await page.getByRole('button', { name: 'Run Bulk Operation' }).click();
    await expect(page.getByText('Bulk payload must be a non-empty JSON array')).toBeVisible();
  });

  test('Special characters/XSS payload does not execute script in UI', async ({ context, page }) => {
    await setUserSession(context, testData.users.admin as any);
    await page.goto('/admin/categories');
    await page.locator('textarea.form-control').fill('[{"name":"<script>alert(1)</script>"}]');
    await page.getByRole('button', { name: 'Run Bulk Operation' }).click();
    await expect(page.getByText(/Bulk create/)).toBeVisible();
    const dialogs: string[] = [];
    page.on('dialog', d => dialogs.push(d.message()));
    expect(dialogs).toEqual([]);
  });

  test('SQL injection-like search input does not break listing', async ({ context, page }) => {
    await setUserSession(context, testData.users.admin as any);
    await page.goto('/admin/products');
    await page.getByPlaceholder('Search products by name...').fill("' OR 1=1 --");
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText('Product Management')).toBeVisible();
  });
});
