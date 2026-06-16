const db = require("../lib/db");

// ── GET /undangan — Daftar undangan keanggotaan (Fitur 16) ──
const getAllUndangan = async (req, res, next) => {
  const connection = await db.getConnection();
  
  try {
    const userId = req.session.userId;

    // Dapatkan lecturer_id dari user yang login
    const [[lecturer]] = await connection.query(
      "SELECT id FROM lecturers WHERE user_id = ?",
      [userId]
    );

    let invitations = [];
    if (lecturer) {
      const [rows] = await connection.query(
        `SELECT 
            csm.id          AS member_record_id,
            csm.role        AS member_role,
            csm.status,
            csm.created_at,
            csm.responded_at,
            cs.id           AS cs_id,
            cs.title        AS cs_title,
            cs.start_date   AS cs_start_date,
            cs.location     AS cs_location,
            u.name          AS creator_name
         FROM community_service_members csm
         JOIN community_services cs ON csm.community_service_id = cs.id
         JOIN users u ON cs.created_by = u.id
         WHERE csm.lecturer_id = ?
         ORDER BY csm.created_at DESC`,
        [lecturer.id]
      );
      invitations = rows;
    }

    res.render("undangan/index", {
      layout: "layouts/pengabdian",
      pageTitle: "Undangan Keanggotaan",
      user: req.session.user,
      isAdmin: req.session.user?.role === "admin",
      invitations,
    });
  } catch (error) {
    console.error("Error Get All Undangan:", error);
    next(error);
  } finally {
    connection.release();
  }
};

// ── GET /undangan/:id/accept — Terima undangan (Fitur 17) ──
const acceptUndangan = async (req, res, next) => {
  const { id } = req.params;
  const userId  = req.session.userId;

  const connection = await db.getConnection();
  try {
    // Pastikan undangan ini memang milik dosen yang login
    const [[lecturer]] = await connection.query(
      "SELECT id FROM lecturers WHERE user_id = ?",
      [userId]
    );

    if (!lecturer) {
      return res.redirect("/undangan?error=not_lecturer");
    }

    const [[member]] = await connection.query(
      "SELECT * FROM community_service_members WHERE id = ? AND lecturer_id = ?",
      [id, lecturer.id]
    );

    if (!member) {
      return res.redirect("/undangan?error=not_found");
    }

    if (member.status !== "pending") {
      return res.redirect("/undangan?error=already_responded");
    }

    await connection.query(
      "UPDATE community_service_members SET status = 'approved', responded_at = NOW(), updated_at = NOW() WHERE id = ?",
      [id]
    );

    res.redirect("/undangan?success=accepted");
  } catch (error) {
    console.error("Error Accept Undangan:", error);
    next(error);
  } finally {
    connection.release();
  }
};

// ── GET /undangan/:id/reject — Tolak undangan (Fitur 17) ──
const rejectUndangan = async (req, res, next) => {
  const { id } = req.params;
  const userId  = req.session.userId;

  const connection = await db.getConnection();
  try {
    const [[lecturer]] = await connection.query(
      "SELECT id FROM lecturers WHERE user_id = ?",
      [userId]
    );

    if (!lecturer) {
      return res.redirect("/undangan?error=not_lecturer");
    }

    const [[member]] = await connection.query(
      "SELECT * FROM community_service_members WHERE id = ? AND lecturer_id = ?",
      [id, lecturer.id]
    );

    if (!member) {
      return res.redirect("/undangan?error=not_found");
    }

    if (member.status !== "pending") {
      return res.redirect("/undangan?error=already_responded");
    }

    await connection.query(
      "UPDATE community_service_members SET status = 'rejected', responded_at = NOW(), updated_at = NOW() WHERE id = ?",
      [id]
    );

    res.redirect("/undangan?success=rejected");
  } catch (error) {
    console.error("Error Reject Undangan:", error);
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = { getAllUndangan, acceptUndangan, rejectUndangan };
