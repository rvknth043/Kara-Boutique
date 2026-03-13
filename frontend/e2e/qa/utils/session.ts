import { BrowserContext } from '@playwright/test';

export async function setUserSession(context: BrowserContext, user: Record<string, any>) {
  await context.addCookies([
    { name: 'token', value: 'qa-token', domain: 'localhost', path: '/' },
    { name: 'user', value: encodeURIComponent(JSON.stringify(user)), domain: 'localhost', path: '/' },
  ]);
}
