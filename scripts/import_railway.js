const fs = require('fs');
const mysql = require('mysql2/promise');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function importDatabase() {
  console.log("=== ALAT IMPORT DATABASE RAILWAY ===\n");
  console.log("Silakan lihat tab 'Connect' pada database MySQL Anda di Railway dan masukkan informasinya:");
  
  const host = await askQuestion("1. Host (misal: viaduct.proxy.rlwy.net): ");
  const port = await askQuestion("2. Port (misal: 12345): ");
  const user = await askQuestion("3. User (misal: root): ");
  const password = await askQuestion("4. Password: ");
  const database = await askQuestion("5. Database Name (misal: railway): ");

  rl.close();

  console.log("\nMemproses koneksi ke Railway...");

  try {
    const connection = await mysql.createConnection({
      host: host.trim(),
      port: parseInt(port.trim(), 10),
      user: user.trim(),
      password: password.trim(),
      database: database.trim(),
      multipleStatements: true, // INI YANG BIKIN BISA BACA BANYAK BARIS SEKALIGUS
      ssl: { rejectUnauthorized: false }
    });

    console.log("✅ Berhasil terhubung ke Railway!");
    
    const sqlPath = require('path').join(__dirname, 'db_setup.sql');
    console.log(`\nMembaca file SQL dari: ${sqlPath}`);
    
    let sqlContent = fs.readFileSync(sqlPath, 'utf8');
    sqlContent = sqlContent.replace(/CREATE DATABASE[\s\S]*?;/gi, ''); // Hapus CREATE DATABASE karena di Railway tidak diizinkan
    sqlContent = sqlContent.replace(/USE [^\n]+;/gi, '');
    
    console.log("⏳ Sedang memasukkan tabel dan data (Mungkin butuh beberapa detik)...");
    
    await connection.query(sqlContent);
    
    console.log("🎉 SELAMAT! Database berhasil dimasukkan ke Railway sepenuhnya!");
    console.log("\nSekarang Anda tinggal memasukkan variabel lingkungan (Environment Variables) di aplikasi Railway Anda dengan data yang sama persis seperti yang Anda ketikkan di atas.");
    
    await connection.end();
  } catch (error) {
    console.error("❌ Gagal!", error.message);
  }
}

importDatabase();
