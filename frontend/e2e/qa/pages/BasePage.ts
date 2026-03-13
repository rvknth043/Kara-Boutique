import { expect, Page } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string) {
    const start = Date.now();
    await this.page.goto(path);
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(3000);
  }
}
