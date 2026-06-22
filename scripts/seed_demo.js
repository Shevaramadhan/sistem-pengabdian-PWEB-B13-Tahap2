const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedDemoData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  try {
    console.log("Mulai menambahkan data dummy untuk demo...");

    // 1. Ambil ID User dan Lecturer untuk Surya (Dosen A) dan Rina (Dosen B)
    const [[dosenA]] = await connection.query("SELECT u.id as user_id, l.id as lecturer_id FROM users u JOIN lecturers l ON u.id = l.user_id WHERE u.email = 'athaya@pengabdian.ac.id'");
    const [[dosenB]] = await connection.query("SELECT u.id as user_id, l.id as lecturer_id FROM users u JOIN lecturers l ON u.id = l.user_id WHERE u.email = 'sheva@pengabdian.ac.id'");

    if (!dosenA || !dosenB) {
      console.log("❌ Error: Dosen Surya atau Rina tidak ditemukan. Pastikan database sudah di-seed awal.");
      process.exit(1);
    }

    // 2. Buat Pengabdian Dummy berstatus "Berjalan" (Ongoing) milik Dosen A
    // Ini berguna untuk mendemokan fitur "Upload Laporan" dan "Finalisasi"
    const [csResult] = await connection.query(`
      INSERT INTO community_services 
      (title, description, location, start_date, end_date, funding_source, status, created_by, proposal_file, created_at, updated_at)
      VALUES 
      ('Pelatihan Pemrograman Web untuk Guru SMK di Padang', 'Pelatihan dasar web statis.', 'SMK N 2 Padang', '2026-01-10', '2026-06-15', 'Reguler DIPA', 'ongoing', ?, '/dummy-proposal.pdf', NOW(), NOW())
    `, [dosenA.user_id]);

    const newCsId = csResult.insertId;
    console.log(`✅ Berhasil menambahkan Pengabdian berstatus ONGOING (ID: ${newCsId}).`);

    // 3. Tambahkan Dosen B sebagai anggota yang sudah "Approved" di pengabdian yang sama
    await connection.query(`
      INSERT INTO community_service_members (community_service_id, lecturer_id, role, status, created_at, updated_at)
      VALUES (?, ?, 'Anggota', 'approved', NOW(), NOW())
    `, [newCsId, dosenB.lecturer_id]);
    console.log(`✅ Berhasil menambahkan Dosen B sebagai Anggota (Approved) di pengabdian ONGOING.`);

    // 4. Buat Pengabdian Dummy berstatus "Diusulkan" (Proposed) milik Dosen A
    // Ini berguna untuk ditambahkan anggotanya di video (sebagai Undangan yang akan ditolak/diterima Dosen B)
    const [csProposedResult] = await connection.query(`
      INSERT INTO community_services 
      (title, description, location, start_date, end_date, funding_source, status, created_by, proposal_file, created_at, updated_at)
      VALUES 
      ('Penerapan Teknologi IoT untuk Irigasi Pertanian di Limau Manis', 'Membantu petani dengan alat IoT otomatis.', 'Limau Manis, Padang', '2026-08-01', '2026-11-01', 'PNBP Unand', 'proposed', ?, '/dummy-proposal-2.pdf', NOW(), NOW())
    `, [dosenA.user_id]);

    const proposedCsId = csProposedResult.insertId;
    console.log(`✅ Berhasil menambahkan Pengabdian berstatus PROPOSED (ID: ${proposedCsId}).`);

    // 5. Tambahkan undangan PENDING untuk Dosen B di pengabdian Proposed ini
    await connection.query(`
      INSERT INTO community_service_members (community_service_id, lecturer_id, role, status, created_at, updated_at)
      VALUES (?, ?, 'Anggota Ahli', 'pending', NOW(), NOW())
    `, [proposedCsId, dosenB.lecturer_id]);
    console.log(`✅ Berhasil mengirim Undangan PENDING kepada Dosen B.`);

    console.log("\n🎉 Data dummy untuk keperluan video telah siap!");
    console.log("-----------------------------------------------------");
    console.log("Gunakan Akun Dosen A (Ketua): athaya@pengabdian.ac.id / (password login masing-masing)");
    console.log("Gunakan Akun Dosen B (Anggota yang diundang): sheva@pengabdian.ac.id / (password login masing-masing)");

  } catch (err) {
    console.error("Terjadi kesalahan:", err);
  } finally {
    await connection.end();
  }
}

seedDemoData();
