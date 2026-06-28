import { test, expect } from '@playwright/test';

test('landing page loads with hero illustration', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Talk freely.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start Session' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Join Session' })).toBeVisible();
  await expect(page.getByAltText('Two people connecting remotely')).toBeVisible();
});

test('health endpoint responds', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.status).toBe('ok');
});

test('create session API', async ({ request }) => {
  const res = await request.post('/api/sessions', {
    data: {
      displayName: 'Test Host',
      durationMinutes: 30,
      access: 'public',
    },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.roomId).toBeTruthy();
  expect(body.joinToken).toBeTruthy();
});

test('get session info API', async ({ request }) => {
  const create = await request.post('/api/sessions', {
    data: { displayName: 'Host', durationMinutes: 15, access: 'public' },
  });
  const { roomId } = await create.json();

  const res = await request.get(`/api/sessions/${roomId}`);
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.exists).toBe(true);
});

test('join session API', async ({ request }) => {
  const create = await request.post('/api/sessions', {
    data: { displayName: 'Host', durationMinutes: 15, access: 'public' },
  });
  const { roomId } = await create.json();

  const res = await request.post(`/api/sessions/${roomId}/join`, {
    data: { displayName: 'Guest' },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.joinToken).toBeTruthy();
  expect(body.displayName).toBe('Guest');
});

test('end session API (host)', async ({ request }) => {
  const create = await request.post('/api/sessions', {
    data: { displayName: 'Host', durationMinutes: 15, access: 'public' },
  });
  const { roomId, joinToken } = await create.json();

  const res = await request.post(`/api/sessions/${roomId}/end`, {
    headers: { Authorization: `Bearer ${joinToken}` },
  });
  expect(res.ok()).toBeTruthy();
});

test('turn credentials API', async ({ request }) => {
  const res = await request.get('/api/turn');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(Array.isArray(body.iceServers)).toBe(true);
});

test('landing to start keeps header visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'WhisperLink' })).toBeVisible();
  await page.getByRole('link', { name: 'Start Session' }).click();
  await expect(page).toHaveURL('/start');
  await expect(page.getByRole('link', { name: 'WhisperLink' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Start a session' })).toBeVisible();
});

test('create public session flow', async ({ page }) => {
  await page.goto('/start');
  await page.getByPlaceholder('How others will see you').fill('Test User');
  await page.getByRole('button', { name: 'Start Session →' }).click();
  await page.waitForURL(/\/r\/.+/);
  await expect(page.getByText('Ready to talk?')).toBeVisible();
});

test('session ended page go home works', async ({ page }) => {
  await page.goto('/session-ended');
  await expect(page.getByRole('heading', { name: 'This session has ended' })).toBeVisible();
  await page.getByRole('button', { name: 'Go home' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'Talk freely.' })).toBeVisible();
});

test('join page shows room input', async ({ page }) => {
  await page.goto('/join');
  await expect(page.getByPlaceholder('Paste room code or link')).toBeVisible();
});
