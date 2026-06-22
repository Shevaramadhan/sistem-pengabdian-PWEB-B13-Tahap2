const { test, expect } = require('@playwright/test');

test.describe('API Endpoint Tests', () => {

  test('Harus redirect ke halaman login jika akses API tanpa sesi', async ({ page }) => {
    await page.goto('/api/pengabdian');
    await expect(page).toHaveURL(/.*\/login/);
  });

});
