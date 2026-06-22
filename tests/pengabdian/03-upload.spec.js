const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Modul Pengabdian - Upload Laporan', () => {

  let dummyTitle;

  test.beforeEach(async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[name="username"]', 'sheva');
    await page.fill('input[name="password"]', 'dosen123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/home');

    // 2. Buat data dummy khusus untuk upload agar terisolasi
    dummyTitle = `Pengabdian Khusus Upload ${Date.now()}`;
    await page.goto('/pengabdian/create');
    await page.fill('input[name="title"]', dummyTitle);
    await page.fill('input[name="location"]', 'Desa Testing E2E');
    await page.fill('input[name="start_date"]', '2026-06-01');
    const filePath = path.join(__dirname, '..', 'fixtures', 'dummy.pdf');
    await page.setInputFiles('input[name="proposal_file"]', filePath);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/pengabdian/);
    
    // Search for the newly created item to ensure it's on the first page
    await page.fill('input[name="search"]', dummyTitle);
    await page.click('button:has-text("Filter")');
    await page.waitForTimeout(500); // Wait for results

    // Get the ID of the newly created service from the link
    const row = page.locator('tr', { hasText: dummyTitle }).first();
    const detailHref = await row.locator('a[title="Detail"]').getAttribute('href');
    const serviceId = detailHref.split('/').pop();

    // 3. Admin Approve (via API context to save time/UI steps)
    const adminContext = await page.context().browser().newContext();
    const adminPage = await adminContext.newPage();
    await adminPage.goto('/login');
    await adminPage.fill('input[name="username"]', 'admin');
    await adminPage.fill('input[name="password"]', 'admin123');
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForURL('/home');
    
    // Admin directly posts to approve
    await adminPage.request.post(`/pengabdian/${serviceId}/approve`);
    await adminPage.close();
    await adminContext.close();
  });

  test('Gagal mengunggah laporan akhir jika file tidak dipilih', async ({ page }) => {
    await page.goto('/pengabdian');
    
    // Cari judul untuk memastikan muncul (handle pagination)
    await page.fill('input[name="search"]', dummyTitle);
    await page.click('button:has-text("Filter")');
    await page.waitForTimeout(500);
    
    const row = page.locator('tr', { hasText: dummyTitle }).first();
    await row.locator('a[title="Upload Laporan"]').click();
    
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
    expect(msg).toContain('File laporan wajib dipilih.');
  });

  test('Harus bisa mengunggah laporan akhir dengan benar', async ({ page }) => {
    await page.goto('/pengabdian');
    
    // Cari judul untuk memastikan muncul (handle pagination)
    await page.fill('input[name="search"]', dummyTitle);
    await page.click('button:has-text("Filter")');
    await page.waitForTimeout(500);
    
    const row = page.locator('tr', { hasText: dummyTitle }).first();
    await row.locator('a[title="Upload Laporan"]').click();
    
    const filePath = path.join(__dirname, '..', 'fixtures', 'dummy.pdf');
    await page.setInputFiles('input[name="report_file"]', filePath);
    await page.click('button[type="submit"]');
    
    // Redirect akan menuju /pengabdian/:id
    await page.waitForURL(/\/pengabdian\/\d+/);
    await expect(page.locator('body')).toContainText('Laporan hasil pengabdian berhasil diupload'); 
  });

});
