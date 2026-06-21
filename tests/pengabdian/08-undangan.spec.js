const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Modul Undangan Keanggotaan', () => {

  test('Dosen B bisa menerima undangan keanggotaan dari Dosen A', async ({ browser }) => {
    // ----------------------------------------------------
    // SISI 1: DOSEN A (Membuat Pengabdian dan Mengundang)
    // ----------------------------------------------------
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    
    // Login Dosen A (Sheva)
    await pageA.goto('/login');
    await pageA.fill('input[name="username"]', 'sheva');
    await pageA.fill('input[name="password"]', 'dosen123');
    await pageA.click('button[type="submit"]');
    await expect(pageA).toHaveURL('/home');

    // Buat data dummy
    const dummyTitle = `Pengabdian Terima Undangan ${Date.now()}`;
    await pageA.goto('/pengabdian/create');
    await pageA.fill('input[name="title"]', dummyTitle);
    await pageA.fill('input[name="location"]', 'Desa Testing Terima');
    await pageA.fill('input[name="start_date"]', '2026-06-01');
    const filePath = path.join(__dirname, '..', 'fixtures', 'dummy.pdf');
    await pageA.setInputFiles('input[name="proposal_file"]', filePath);
    await pageA.click('button[type="submit"]');
    await expect(pageA).toHaveURL(/\/pengabdian/);
    
    // Buka detail
    const row = pageA.locator('tr', { hasText: dummyTitle }).first();
    await row.locator('a[title="Detail"]').click();
    await pageA.waitForURL(/\/pengabdian\/\d+/);

    // Tambah Dosen B (Athaya) sebagai anggota
    await pageA.click('button:has-text("+ Tambah Anggota")');
    const addModal = pageA.locator('#addMemberModal');
    await expect(addModal).toBeVisible();
    await addModal.locator('select[name="lecturer_id"]').selectOption({ index: 1 });
    await addModal.locator('input[name="role"]').fill('Anggota Diundang');
    await addModal.locator('button[type="submit"]').click();
    await expect(pageA.locator('.flash-success')).toBeVisible();

    // Tutup sesi Dosen A
    await pageA.close();
    await contextA.close();

    // ----------------------------------------------------
    // SISI 2: DOSEN B (Menerima Undangan)
    // ----------------------------------------------------
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    
    // Login Dosen B (Athaya)
    await pageB.goto('/login');
    await pageB.fill('input[name="username"]', 'athaya');
    await pageB.fill('input[name="password"]', 'dosen123');
    await pageB.click('button[type="submit"]');
    await expect(pageB).toHaveURL('/home');

    // Buka halaman Undangan
    await pageB.goto('/undangan');
    
    // Verifikasi ada undangan dari Dosen A dengan judul yang tepat
    const rowUndangan = pageB.locator('tr', { hasText: dummyTitle }).first();
    await expect(rowUndangan).toBeVisible();
    await expect(rowUndangan.locator('.badge-pending')).toBeVisible();

    // Klik tombol Terima
    await rowUndangan.locator('button:has-text("Terima")').click();

    // Modal konfirmasi muncul
    const acceptModal = pageB.locator('#modal-accept');
    await expect(acceptModal).toBeVisible();

    // Klik Ya, Terima di modal
    await acceptModal.locator('a.modal-btn-confirm-accept').click();

    // Verifikasi flash message sukses dan status berubah
    await expect(pageB.locator('.flash-success')).toContainText('Undangan berhasil diterima');
    await expect(pageB.locator('tr', { hasText: dummyTitle }).first().locator('.badge-approved')).toBeVisible();

    // Tutup sesi Dosen B
    await pageB.close();
    await contextB.close();
  });

  test('Dosen B bisa menolak undangan keanggotaan dari Dosen A', async ({ browser }) => {
    // ----------------------------------------------------
    // SISI 1: DOSEN A (Membuat Pengabdian dan Mengundang)
    // ----------------------------------------------------
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    
    // Login Dosen A (Sheva)
    await pageA.goto('/login');
    await pageA.fill('input[name="username"]', 'sheva');
    await pageA.fill('input[name="password"]', 'dosen123');
    await pageA.click('button[type="submit"]');
    await expect(pageA).toHaveURL('/home');

    // Buat data dummy
    const dummyTitle = `Pengabdian Tolak Undangan ${Date.now()}`;
    await pageA.goto('/pengabdian/create');
    await pageA.fill('input[name="title"]', dummyTitle);
    await pageA.fill('input[name="location"]', 'Desa Testing Tolak');
    await pageA.fill('input[name="start_date"]', '2026-06-01');
    const filePath = path.join(__dirname, '..', 'fixtures', 'dummy.pdf');
    await pageA.setInputFiles('input[name="proposal_file"]', filePath);
    await pageA.click('button[type="submit"]');
    await expect(pageA).toHaveURL(/\/pengabdian/);
    
    // Buka detail
    const row = pageA.locator('tr', { hasText: dummyTitle }).first();
    await row.locator('a[title="Detail"]').click();
    await pageA.waitForURL(/\/pengabdian\/\d+/);

    // Tambah Dosen B (Athaya) sebagai anggota
    await pageA.click('button:has-text("+ Tambah Anggota")');
    const addModal = pageA.locator('#addMemberModal');
    await expect(addModal).toBeVisible();
    await addModal.locator('select[name="lecturer_id"]').selectOption({ index: 1 });
    await addModal.locator('input[name="role"]').fill('Anggota Ditolak');
    await addModal.locator('button[type="submit"]').click();
    await expect(pageA.locator('.flash-success')).toBeVisible();

    // Tutup sesi Dosen A
    await pageA.close();
    await contextA.close();

    // ----------------------------------------------------
    // SISI 2: DOSEN B (Menolak Undangan)
    // ----------------------------------------------------
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    
    // Login Dosen B (Athaya)
    await pageB.goto('/login');
    await pageB.fill('input[name="username"]', 'athaya');
    await pageB.fill('input[name="password"]', 'dosen123');
    await pageB.click('button[type="submit"]');
    await expect(pageB).toHaveURL('/home');

    // Buka halaman Undangan
    await pageB.goto('/undangan');
    
    // Verifikasi ada undangan dari Dosen A dengan judul yang tepat
    const rowUndangan = pageB.locator('tr', { hasText: dummyTitle }).first();
    await expect(rowUndangan).toBeVisible();
    await expect(rowUndangan.locator('.badge-pending')).toBeVisible();

    // Klik tombol Tolak
    await rowUndangan.locator('button:has-text("Tolak")').click();

    // Modal konfirmasi muncul
    const rejectModal = pageB.locator('#modal-reject');
    await expect(rejectModal).toBeVisible();

    // Klik Ya, Tolak di modal
    await rejectModal.locator('a.modal-btn-confirm-reject').click();

    // Verifikasi flash message peringatan dan status berubah
    await expect(pageB.locator('.flash-warning')).toContainText('Undangan telah ditolak');
    await expect(pageB.locator('tr', { hasText: dummyTitle }).first().locator('.badge-rejected')).toBeVisible();

    // Tutup sesi Dosen B
    await pageB.close();
    await contextB.close();
  });

});
