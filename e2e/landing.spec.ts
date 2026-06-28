import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Talk freely.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Session', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Join Session' })).toBeVisible();
});

test('health endpoint responds', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.status).toBe('ok');
});

test('create public session flow', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Session →' }).click();
  await page.waitForURL(/\/r\/.+/);
  await expect(page.getByText('Ready to talk?')).toBeVisible();
});

test('join panel toggles', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Join Session' }).click();
  await expect(page.getByPlaceholder('Paste room code or link')).toBeVisible();
});
