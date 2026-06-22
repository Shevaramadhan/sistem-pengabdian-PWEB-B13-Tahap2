const fs = require('fs');
const mysql = require('mysql2/promise');
const path = require('path');

async function run() {
  try {
    const connection = await mysql.createConnection({
      host: 'yamabiko.proxy.rlwy.net',
      port: 22469,
      user: 'root',
      password: 'hKvsBQwKvZzMFEeGBJvNNtUvKQpBtNiT',
      database: 'railway',
      multipleStatements: true,
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('⏳ Berhasil terhubung ke Railway...');
    
    console.log('⏳ Menghapus sisa-sisa tabel lama yang membuat error (Drop Tables)...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    
    const [tables] = await connection.query('SHOW TABLES');
    for (let i = 0; i < tables.length; i++) {
        const tableName = Object.values(tables[i])[0];
        await connection.query('DROP TABLE IF EXISTS `' + tableName + '`');
        console.log(' - Tabel dihapus:', tableName);
    }
    
    const sqlPath = path.join(__dirname, 'db_setup.sql');
    let sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    sqlContent = sqlContent.replace(/CREATE DATABASE[\s\S]*?;/gi, '');
    sqlContent = sqlContent.replace(/USE [^\n]+;/gi, '');
    
    console.log('⏳ Membangun ulang tabel khusus Aplikasi Pengabdian secara bersih...');
    
    await connection.query(sqlContent);
    console.log('✅ SELAMAT! Semua tabel BERHASIL dimuat secara bersih ke Railway!');
    
    await connection.end();
  } catch(e) {
    console.error('❌ Error:', e.message);
  }
}
run();
