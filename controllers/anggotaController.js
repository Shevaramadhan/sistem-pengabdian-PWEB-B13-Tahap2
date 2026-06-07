const db = require("../lib/db");

// ── POST /pengabdian/:csId/anggota — Tambah anggota ke pengabdian (Fitur 12) ──
const createAnggota = async (req, res, next) => {
  const { csId } = req.params;
  const { lecturer_id, role } = req.body;

  if (!lecturer_id) {
    return res.status(400).json({ status: 'error', message: 'Dosen wajib dipilih.' });
  }

  const connection = await db.getConnection();
  try {
    // Cek duplikat anggota
    const [[existing]] = await connection.query(
      "SELECT id FROM community_service_members WHERE community_service_id = ? AND lecturer_id = ?",
      [csId, lecturer_id]
    );
    if (existing) {
      return res.status(400).json({ status: 'error', message: 'Dosen ini sudah menjadi anggota pengabdian.' });
    }

    await connection.query(
      `INSERT INTO community_service_members
         (community_service_id, lecturer_id, role, status, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', NOW(), NOW())`,
      [csId, lecturer_id, role?.trim() || "Anggota"]
    );

    res.status(200).json({ 
      status: 'success', 
      message: 'Anggota berhasil ditambahkan.',
      redirectUrl: `/pengabdian/${csId}?success=member_added` 
    });
  } catch (error) {
    console.error('Error Create Anggota:', error);
    res.status(500).json({ status: 'error', message: 'Gagal menambahkan anggota.' });
  } finally {
    connection.release();
  }
};

// ── POST /pengabdian/:csId/anggota/:id/edit — Update peran/status anggota (Fitur 13) ──
const updateAnggota = async (req, res, next) => {
  const { csId, id } = req.params;
  const { role, status } = req.body;

  const connection = await db.getConnection();
  try {
    await connection.query(
      "UPDATE community_service_members SET role=?, status=?, updated_at=NOW() WHERE id=? AND community_service_id=?",
      [role?.trim() || "Anggota", status || "pending", id, csId]
    );

    res.status(200).json({ 
      status: 'success', 
      message: 'Data anggota berhasil diperbarui.',
      redirectUrl: `/pengabdian/${csId}?success=member_updated`
    });
  } catch (error) {
    console.error('Error Update Anggota:', error);
    res.status(500).json({ status: 'error', message: 'Gagal memperbarui data anggota.' });
  } finally {
    connection.release();
  }
};

// ── POST /pengabdian/:csId/anggota/:id/delete — Hapus anggota dari pengabdian (Fitur 14) ──
const deleteAnggota = async (req, res, next) => {
  const { csId, id } = req.params;

  const connection = await db.getConnection();
  try {
    const [result] = await connection.query(
      "DELETE FROM community_service_members WHERE id=? AND community_service_id=?",
      [id, csId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Data anggota tidak ditemukan.' });
    }

    res.status(200).json({ 
      status: 'success', 
      message: 'Data anggota beserta riwayatnya berhasil dihapus.',
      redirectUrl: `/pengabdian/${csId}?success=member_deleted`
    });
  } catch (error) {
    console.error('Error Delete Anggota:', error);
    res.status(500).json({ status: 'error', message: 'Gagal menghapus data anggota.' });
  } finally {
    connection.release();
  }
};

module.exports = { createAnggota, updateAnggota, deleteAnggota };
