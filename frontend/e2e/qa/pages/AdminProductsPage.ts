import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdminProductsPage extends BasePage {
  constructor(page: Page) { super(page); }

  async open() {
    await this.goto('/admin/products');
    await expect(this.page.getByText('Product Management')).toBeVisible();
  }

  async runBulk(action: 'create'|'update'|'delete', payload: string) {
    await this.page.selectOption('select.form-select', action);
    await this.page.locator('textarea.form-control').fill(payload);
    await this.page.getByRole('button', { name: 'Run Bulk Operation' }).click();
    await expect(this.page.getByText(new RegExp(`Bulk ${action}`))).toBeVisible();
  }
}
