import { Page, expect } from '@playwright/test';

export function createNetworkMonitor(page: Page) {
  const failedRequests: string[] = [];
  const consoleErrors: string[] = [];

  page.on('requestfailed', (req) => failedRequests.push(req.url()));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  return {
    assertNoFailures: async () => {
      expect(failedRequests, `Failed requests: ${failedRequests.join(', ')}`).toEqual([]);
      expect(consoleErrors, `Console errors: ${consoleErrors.join(' | ')}`).toEqual([]);
    },
  };
}
