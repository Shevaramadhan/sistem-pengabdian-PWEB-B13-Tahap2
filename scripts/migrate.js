const db = require('../lib/db');

async function migrate() {
  console.log('Memulai migrasi database...');
  try {
    // 1. Tambah kolom tujuan
    console.log('Menambahkan kolom "tujuan"...');
    await db.query(`
      ALTER TABLE community_services 
      ADD COLUMN IF NOT EXISTS tujuan TEXT NULL AFTER description
    `).catch(err => console.log('Kolom "tujuan" mungkin sudah ada:', err.message));

    // 2. Tambah kolom proposal_file_size
    console.log('Menambahkan kolom "proposal_file_size"...');
    await db.query(`
      ALTER TABLE community_services 
      ADD COLUMN IF NOT EXISTS proposal_file_size INT UNSIGNED NULL AFTER proposal_file
    `).catch(err => console.log('Kolom "proposal_file_size" mungkin sudah ada:', err.message));

    // 3. Tambah kolom proposal_uploaded_at
    console.log('Menambahkan kolom "proposal_uploaded_at"...');
    await db.query(`
      ALTER TABLE community_services 
      ADD COLUMN IF NOT EXISTS proposal_uploaded_at TIMESTAMP NULL AFTER proposal_file_size
    `).catch(err => console.log('Kolom "proposal_uploaded_at" mungkin sudah ada:', err.message));

    // 4. Modifikasi status ENUM
    console.log('Memodifikasi kolom status ENUM...');
    await db.query(`
      ALTER TABLE community_services 
      MODIFY COLUMN status ENUM('proposed', 'verified', 'ongoing', 'completed') NOT NULL DEFAULT 'proposed'
    `);

    console.log('Migrasi database berhasil selesai!');
    process.exit(0);
  } catch (err) {
    console.error('Migrasi database gagal:', err);
    process.exit(1);
  }
}

migrate();
