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
    const adminRow = adminPage.locator('tr', { hasText: dummyTitle }).first();
    await expect(adminRow).toBeVisible();
    await expect(adminRow).toContainText('Diusulkan');

    // Admin klik Lihat Detail
    await adminRow.locator('a[title="Lihat Detail"]').click();
    await adminPage.waitForURL(/\/pengabdian\/\d+/);
    
    // Admin menekan tombol Setujui (Ubah ke Berjalan)
    adminPage.on('dialog', dialog => dialog.accept()); // Setujui confirm dialog
    await adminPage.click('button:has-text("Setujui (Ubah ke Berjalan)")');

    // Setelah disetujui, akan kembali ke halaman detail dengan param ?success=approved
    await adminPage.waitForURL(/\/pengabdian\/\d+\?success=approved/);

    // Kembali ke halaman list untuk verifikasi
    await adminPage.goto('/pengabdian');

    // Verifikasi perubahan status di tabel Admin
    const updatedRow = adminPage.locator('tr', { hasText: dummyTitle }).first();
    await expect(updatedRow).toBeVisible();
    await expect(updatedRow).toContainText('Berjalan');

    // Tutup sesi admin
    await adminPage.close();
    await adminContext.close();
  });

});
