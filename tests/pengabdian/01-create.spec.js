const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Modul Pengabdian - Create', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'sheva');
    await page.fill('input[name="password"]', 'dosen123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/home');
  });

  test('Harus bisa melihat daftar pengabdian', async ({ page }) => {
    await page.click('text="Daftar Pengabdian"');
    await expect(page).toHaveURL(/\/pengabdian/);
    await expect(page.locator('h2').nth(1)).toContainText('Daftar Pengabdian');
    await expect(page.locator('a[href="/pengabdian/create"]').first()).toBeVisible();
  });

  test('Gagal menambahkan pengabdian baru jika data kosong', async ({ page }) => {
    await page.goto('/pengabdian/create');
    
    await page.evaluate(() => {
      document.querySelectorAll('[required]').forEach(el => el.removeAttribute('required'));
    });
    
    const dialogMsg = new Promise(resolve => {
      page.once('dialog', dialog => {
        resolve(dialog.message());
        dialog.accept();
      });
    });

    await page.click('button[type="submit"]');
    
    const msg = await dialogMsg;
    expect(msg).toContain('Judul wajib diisi');
    expect(msg).toContain('Lokasi wajib diisi');
    expect(msg).toContain('File Proposal (PDF) wajib diunggah saat membuat pengabdian.');
  });

  test('Harus bisa menambahkan pengabdian baru dengan data benar', async ({ page }) => {
    await page.goto('/pengabdian/create');
    
    const dummyTitle = `Pengabdian Khusus Create ${Date.now()}`;
    await page.fill('input[name="title"]', dummyTitle);
    await page.fill('input[name="location"]', 'Desa Testing E2E');
    await page.fill('input[name="start_date"]', '2026-06-01');
    
    const filePath = path.join(__dirname, '..', 'fixtures', 'dummy.pdf');
    await page.setInputFiles('input[name="proposal_file"]', filePath);
    
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/pengabdian/);
    await expect(page.locator('tbody').locator(`text="${dummyTitle}"`).first()).toBeVisible();
  });

});
