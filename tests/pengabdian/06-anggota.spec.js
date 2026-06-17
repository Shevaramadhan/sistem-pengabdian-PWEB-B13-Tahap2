const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Modul Anggota Tim Pengabdian', () => {

  let dummyTitle;
  let serviceUrl;

  test.beforeEach(async ({ page }) => {
    // 1. Login sebagai dosen
    await page.goto('/login');
    await page.fill('input[name="username"]', 'sheva');
    await page.fill('input[name="password"]', 'dosen123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/home');

    // 2. Buat data dummy khusus untuk tes anggota
    dummyTitle = `Pengabdian Khusus Anggota ${Date.now()}`;
    await page.goto('/pengabdian/create');
    await page.fill('input[name="title"]', dummyTitle);
    await page.fill('input[name="location"]', 'Desa Testing Anggota');
    await page.fill('input[name="start_date"]', '2026-06-01');
    const filePath = path.join(__dirname, '..', 'fixtures', 'dummy.pdf');
    await page.setInputFiles('input[name="proposal_file"]', filePath);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/pengabdian/);
    
    // Buka halaman detail pengabdian tersebut
    const row = page.locator('tr', { hasText: dummyTitle }).first();
    await row.locator('a[title="Detail"]').click();
    
    // Simpan URL detail untuk tes-tes berikutnya (sebenarnya url tetap karena ini beforeEach)
    await page.waitForURL(/\/pengabdian\/\d+/);
  });

  test('Harus bisa menambahkan anggota baru', async ({ page }) => {
    // Klik tombol tambah anggota
    await page.click('button:has-text("+ Tambah Anggota")');
    
    // Pastikan modal muncul (Playwright otomatis menunggu visibility)
    const addModal = page.locator('#addMemberModal');
    await expect(addModal).toBeVisible();

    // Isi form di dalam modal
    // Pilih dosen index ke-1 (yang bukan placeholder)
    await addModal.locator('select[name="lecturer_id"]').selectOption({ index: 1 });
    await addModal.locator('input[name="role"]').fill('Anggota Peneliti Ahli');
    
    // Submit
    await addModal.locator('button[type="submit"]').click();
    
    // Pastikan flash message sukses muncul
    await expect(page.locator('.flash-success')).toContainText('Anggota berhasil ditambahkan');
    
    // Pastikan peran yang baru diinput ada di tabel anggota
    await expect(page.locator('table.data-table').last()).toContainText('Anggota Peneliti Ahli');
  });

  test('Harus bisa mengedit peran anggota', async ({ page }) => {
    // 1. Tambah anggota dulu agar ada yang bisa diedit
    await page.click('button:has-text("+ Tambah Anggota")');
    const addModal = page.locator('#addMemberModal');
    await addModal.locator('select[name="lecturer_id"]').selectOption({ index: 1 });
    await addModal.locator('input[name="role"]').fill('Peran Lama');
    await addModal.locator('button[type="submit"]').click();
    await expect(page.locator('.flash-success')).toBeVisible();

    // 2. Klik Edit pada baris anggota tersebut
    const memberRow = page.locator('table.data-table').last().locator('tr', { hasText: 'Peran Lama' }).first();
    await memberRow.locator('button:has-text("Edit")').click();

    // 3. Pastikan modal edit muncul
    const editModal = page.locator('#editMemberModal');
    await expect(editModal).toBeVisible();

    // 4. Ubah peran dan submit
    await editModal.locator('input[name="role"]').fill('Peran Baru Diupdate');
    await editModal.locator('select[name="status"]').selectOption('approved'); // Disetujui
    await editModal.locator('button[type="submit"]').click();

    // 5. Verifikasi
    await expect(page.locator('.flash-success')).toContainText('berhasil diupdate');
    await expect(page.locator('table.data-table').last()).toContainText('Peran Baru Diupdate');
    await expect(page.locator('table.data-table').last()).toContainText('Disetujui');
  });

  test('Harus bisa menghapus anggota', async ({ page }) => {
    // 1. Tambah anggota dulu
    await page.click('button:has-text("+ Tambah Anggota")');
    const addModal = page.locator('#addMemberModal');
    await addModal.locator('select[name="lecturer_id"]').selectOption({ index: 1 });
    await addModal.locator('input[name="role"]').fill('Peran Untuk Dihapus');
    await addModal.locator('button[type="submit"]').click();
    await expect(page.locator('.flash-success')).toBeVisible();

    // 2. Tangani konfirmasi alert browser
    page.on('dialog', dialog => dialog.accept());

    // 3. Klik hapus
    const memberRow = page.locator('table.data-table').last().locator('tr', { hasText: 'Peran Untuk Dihapus' }).first();
    await memberRow.locator('button:has-text("Hapus")').click();

    // 4. Verifikasi
    await expect(page.locator('.flash-success')).toContainText('berhasil dihapus');
    await expect(page.locator('table.data-table').last().locator('text="Peran Untuk Dihapus"')).toHaveCount(0);
  });

});
