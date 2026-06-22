const { test, expect } = require('@playwright/test');

test.describe('Autentikasi Login', () => {

  test('Harus memunculkan error jika NIP/Password salah', async ({ page }) => {
    // Akses halaman login
    await page.goto('/login');
    
    // Isi form login dengan data salah
    await page.fill('input[name="username"]', '9999999999');
    await page.fill('input[name="password"]', 'password_salah');
    
    // Klik tombol sign in
    await page.click('button[type="submit"]');
    
    // Pastikan muncul alert error
    const errorAlert = page.locator('.error-alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Username atau password salah');
  });

  test('Dosen harus berhasil login dengan data benar', async ({ page }) => {
    // Akses halaman login
    await page.goto('/login');
    
    // Dosen dengan id 2 memiliki username 'sheva'
    await page.fill('input[name="username"]', 'sheva');
    await page.fill('input[name="password"]', 'dosen123'); // Default seeder password
    
    // Klik tombol sign in
    await page.click('button[type="submit"]');
    
    // Pastikan diarahkan ke dashboard
    await expect(page).toHaveURL('/home');
    
    // Pastikan ada teks sambutan
    await expect(page.locator('h1')).toContainText('Selamat Datang');
  });

});
