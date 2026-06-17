const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Modul Pengabdian - Delete', () => {

  let dummyTitle;

  test.beforeEach(async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[name="username"]', 'sheva');
    await page.fill('input[name="password"]', 'dosen123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/home');

    // 2. Buat data dummy khusus untuk dihapus agar terisolasi
    dummyTitle = `Pengabdian Khusus Delete ${Date.now()}`;
    await page.goto('/pengabdian/create');
    await page.fill('input[name="title"]', dummyTitle);
    await page.fill('input[name="location"]', 'Desa Testing E2E');
    await page.fill('input[name="start_date"]', '2026-06-01');
    const filePath = path.join(__dirname, '..', 'fixtures', 'dummy.pdf');
    await page.setInputFiles('input[name="proposal_file"]', filePath);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/pengabdian/);
  });

  test('Harus bisa menghapus pengabdian', async ({ page }) => {
    await page.goto('/pengabdian');
    
    // Tangani dialog konfirmasi browser (Window Alert) secara otomatis
    page.on('dialog', dialog => dialog.accept());
    
    const row = page.locator('tr', { hasText: dummyTitle }).first();
    await row.locator('button[title="Hapus"]').click();
    
    // Pastikan data sudah hilang dari tabel
    await expect(page).toHaveURL(/\/pengabdian/);
    await expect(page.locator(`text="${dummyTitle}"`)).toHaveCount(0);
  });

});
