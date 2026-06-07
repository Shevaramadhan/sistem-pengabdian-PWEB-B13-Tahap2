const db = require("../lib/db");

// ── GET /undangan — Daftar undangan keanggotaan (Fitur 16) ──
const getAllUndangan = async (req, res, next) => {
  const connection = await db.getConnection();
  
  try {
    const userId = req.session.userId;
    // Dapatkan data lecturer_id dari user yang sedang login
    const [[lecturer]] = await connection.query(
      "SELECT id FROM lecturers WHERE user_id = ?",
      [userId]
    );

    let invitations = [];
    if (lecturer) {
      // Ambil daftar undangan (status pending/dll)
      const [rows] = await connection.query(
        `SELECT csm.id, csm.role AS member_role, csm.status, csm.created_at,
                cs.title AS service_title, cs.start_date, cs.location,
                u.name AS creator_name
         FROM community_service_members csm
         JOIN community_services cs ON csm.community_service_id = cs.id
         JOIN users u ON cs.created_by = u.id
         WHERE csm.lecturer_id = ?
         ORDER BY csm.created_at DESC`,
        [lecturer.id]
      );
      invitations = rows;
    }

    // Jika yang di-request adalah JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(200).json({ status: 'success', data: invitations });
    }

    res.render("undangan/index", {
      layout: "layouts/pengabdian",
      pageTitle: "Undangan Keanggotaan",
      user: req.session.user,
      isAdmin: req.session.user?.role === "admin",
      invitations,
    });
  } catch (error) {
    console.error('Error Get All Undangan:', error);
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(500).json({ status: 'error', message: 'Gagal mengambil data undangan.' });
    }
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = { getAllUndangan };
