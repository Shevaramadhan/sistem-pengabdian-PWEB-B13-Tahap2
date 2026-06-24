const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Modul Pengabdian - Skenario Multi-User (Admin)', () => {

  let dummyTitle;

  // Setup: Dosen membuat pengabdian, lalu Admin menyetujuinya
  test('Admin bisa merubah status pengabdian menjadi Sedang Berjalan', async ({ browser }) => {
    // ----------------------------------------------------
    // SISI 1: DOSEN (Membuat Data)
    // ----------------------------------------------------
    const dosenContext = await browser.newContext();
    const dosenPage = await dosenContext.newPage();
    
    // Login Dosen
    await dosenPage.goto('/login');
    await dosenPage.fill('input[name="username"]', 'sheva');
    await dosenPage.fill('input[name="password"]', 'dosen123');
    await dosenPage.click('button[type="submit"]');
    await expect(dosenPage).toHaveURL('/home');

    // Dosen Buat Pengabdian
    dummyTitle = `Pengabdian Khusus Admin ${Date.now()}`;
    await dosenPage.goto('/pengabdian/create');
    await dosenPage.fill('input[name="title"]', dummyTitle);
    await dosenPage.fill('input[name="location"]', 'Desa Testing Admin E2E');
    await dosenPage.fill('input[name="start_date"]', '2026-06-01');
    const filePath = path.join(__dirname, '..', 'fixtures', 'dummy.pdf');
    await dosenPage.setInputFiles('input[name="proposal_file"]', filePath);
    await dosenPage.click('button[type="submit"]');
    
    // Pastikan data tersimpan & muncul di tabel dosen dengan status "Diusulkan"
    await expect(dosenPage).toHaveURL(/\/pengabdian/);
    const dosenRow = dosenPage.locator('tr', { hasText: dummyTitle }).first();
    await expect(dosenRow).toBeVisible();
    await expect(dosenRow).toContainText('Diusulkan');
    
    // Tutup sesi dosen
    await dosenPage.close();
    await dosenContext.close();


    // ----------------------------------------------------
    // SISI 2: ADMIN (Menerima dan Merubah Status)
    // ----------------------------------------------------
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    
    // Login Admin
    await adminPage.goto('/login');
    await adminPage.fill('input[name="username"]', 'admin');
    await adminPage.fill('input[name="password"]', 'admin123');
    await adminPage.click('button[type="submit"]');
    await expect(adminPage).toHaveURL('/home');

    // Admin Buka Daftar Pengabdian (Melihat semua pengabdian)
    await adminPage.goto('/pengabdian');
    
    // Cari judul untuk memastikan muncul (handle pagination)
    await adminPage.fill('input[name="search"]', dummyTitle);
    await adminPage.click('button:has-text("Filter")');
    await adminPage.waitForTimeout(500);
    
    const adminRow = adminPage.locator('tr', { hasText: dummyTitle }).first();
    await expect(adminRow).toBeVisible();
    await expect(adminRow).toContainText('Diusulkan');

    // Admin klik Lihat Detail
    await adminRow.locator('a[title="Detail"]').click();
    await adminPage.waitForURL(/\/pengabdian\/\d+/);

    // Handle confirm dialog SEBELUM click
    adminPage.on('dialog', dialog => dialog.accept());

    // Tunggu response dari POST /approve, lalu ikuti redirect-nya
    const [approveResponse] = await Promise.all([
      adminPage.waitForResponse(resp => resp.url().includes('/approve') && resp.status() === 302, { timeout: 15000 }),
      adminPage.click('button:has-text("Setujui (Ubah ke Berjalan)")'),
    ]);

    // Navigate ke URL setelah redirect (success=approved)
    const redirectUrl = approveResponse.headers()['location'];
    await adminPage.goto(redirectUrl || `/pengabdian`);

    // Verifikasi flash success muncul
    await expect(adminPage.locator('.flash-success').first()).toBeVisible({ timeout: 5000 });

    // Kembali ke halaman list untuk verifikasi status
    await adminPage.goto('/pengabdian');

    // Cari data dengan filter
    await adminPage.fill('input[name="search"]', dummyTitle);
    await adminPage.click('button:has-text("Filter")');
    await adminPage.waitForTimeout(500);

    // Verifikasi status berhasil berubah menjadi "Berjalan"
    const updatedRow = adminPage.locator('tr', { hasText: dummyTitle }).first();
    await expect(updatedRow).toBeVisible();
    await expect(updatedRow).toContainText('Berjalan');

    // Tutup sesi admin
    await adminPage.close();
    await adminContext.close();
  });
});
