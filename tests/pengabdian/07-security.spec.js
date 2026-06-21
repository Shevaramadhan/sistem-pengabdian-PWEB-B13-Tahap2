const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Keamanan URL (IDOR) - Modul Pengabdian', () => {

  test('Dosen B tidak bisa mengakses dan memodifikasi data Dosen A', async ({ browser }) => {
    // ----------------------------------------------------
    // SISI 1: DOSEN A (Membuat Data)
    // ----------------------------------------------------
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    
    // Login Dosen A (Sheva)
    await pageA.goto('/login');
    await pageA.fill('input[name="username"]', 'sheva');
    await pageA.fill('input[name="password"]', 'dosen123');
    await pageA.click('button[type="submit"]');
    await expect(pageA).toHaveURL('/home');

    // Dosen A Buat Pengabdian
    const dummyTitle = `Pengabdian Rahasia Dosen A ${Date.now()}`;
    await pageA.goto('/pengabdian/create');
    await pageA.fill('input[name="title"]', dummyTitle);
    await pageA.fill('input[name="location"]', 'Desa Aman');
    await pageA.fill('input[name="start_date"]', '2026-06-01');
    const filePath = path.join(__dirname, '..', 'fixtures', 'dummy.pdf');
    await pageA.setInputFiles('input[name="proposal_file"]', filePath);
    await pageA.click('button[type="submit"]');
    await expect(pageA).toHaveURL(/\/pengabdian/);
    
    // Dosen A mencari ID pengabdian yang baru dibuat dengan cara masuk ke halamannya
    const row = pageA.locator('tr', { hasText: dummyTitle }).first();
    await row.locator('a[title="Detail"]').click();
    await pageA.waitForURL(/\/pengabdian\/\d+/);
    
    // Ekstrak ID dari URL (misal: http://localhost:3000/pengabdian/27 -> 27)
    const urlA = pageA.url();
    const idMatch = urlA.match(/\/pengabdian\/(\d+)/);
    expect(idMatch).not.toBeNull();
    const serviceId = idMatch[1];
    
    // Tutup sesi Dosen A
    await pageA.close();
    await contextA.close();


    // ----------------------------------------------------
    // SISI 2: DOSEN B (Mencoba Mengeksploitasi)
    // ----------------------------------------------------
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    
    // Login Dosen B (Athaya)
    await pageB.goto('/login');
    await pageB.fill('input[name="username"]', 'athaya');
    await pageB.fill('input[name="password"]', 'dosen123'); // Asumsi password default seeder
    await pageB.click('button[type="submit"]');
    await expect(pageB).toHaveURL('/home');

    // 1. Eksploitasi Akses Halaman Edit
    const editUrl = `/pengabdian/${serviceId}/edit`;
    const responseGet = await pageB.goto(editUrl);
    
    // Middleware harus mengembalikan status 403 Forbidden
    expect(responseGet.status()).toBe(403);
    
    // Halaman error harus menampilkan pesan akses ditolak
    await expect(pageB.locator('body')).toContainText('Akses ditolak');

    // 2. Eksploitasi Endpoint API Delete
    // Mengirim HTTP POST langsung ke endpoint hapus menggunakan fetch api di browser Dosen B
    const deleteResponse = await pageB.request.post(`/pengabdian/${serviceId}/delete`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    // Karena Dosen B bukan pemilik, API harus menolak dengan 403
    expect(deleteResponse.status()).toBe(403);
    const deleteJson = await deleteResponse.json();
    expect(deleteJson.status).toBe('error');
    expect(deleteJson.message).toContain('Akses ditolak');

    // Tutup sesi Dosen B
    await pageB.close();
    await contextB.close();
  });

});
