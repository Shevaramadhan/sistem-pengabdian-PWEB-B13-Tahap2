const db = require("../lib/db");
const PDFDocument = require("pdfkit");

// ── Helper: Dapatkan lecturer_id dari user yang login ──
async function getLecturerId(connection, userId) {
  const [[lecturer]] = await connection.query(
    "SELECT id FROM lecturers WHERE user_id = ?",
    [userId]
  );
  return lecturer ? lecturer.id : null;
}

// ── GET /undangan — Daftar undangan keanggotaan ──
const getAllUndangan = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const userId = req.session.userId;
    const lecturerId = await getLecturerId(connection, userId);

    let invitations = [];
    if (lecturerId) {
      const [rows] = await connection.query(
        `SELECT csm.id, csm.role AS member_role, csm.status, csm.responded_at, csm.created_at,
                cs.title AS service_title, cs.start_date, cs.location,
                u.name AS creator_name
         FROM community_service_members csm
         JOIN community_services cs ON csm.community_service_id = cs.id
         JOIN users u ON cs.created_by = u.id
         WHERE csm.lecturer_id = ?
         ORDER BY csm.created_at DESC`,
        [lecturerId]
      );
      invitations = rows;
    }

    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(200).json({ status: "success", data: invitations });
    }

    res.render("undangan/index", {
      layout: "layouts/pengabdian",
      pageTitle: "Undangan Keanggotaan",
      user: req.session.user,
      isAdmin: req.session.user?.role === "admin",
      invitations,
      flash: req.query.msg || null,
      flashType: req.query.type || null,
    });
  } catch (error) {
    console.error("Error Get All Undangan:", error);
    next(error);
  } finally {
    connection.release();
  }
};

// ── POST /undangan/:id/approve — Terima undangan ──
const approveUndangan = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    const lecturerId = await getLecturerId(connection, userId);

    if (!lecturerId) {
      return res.redirect("/undangan?msg=Akun+Anda+bukan+dosen.&type=error");
    }

    // Pastikan undangan ini milik dosen yang login dan masih pending
    const [[invitation]] = await connection.query(
      "SELECT * FROM community_service_members WHERE id = ? AND lecturer_id = ? AND status = 'pending'",
      [id, lecturerId]
    );

    if (!invitation) {
      return res.redirect("/undangan?msg=Undangan+tidak+ditemukan+atau+sudah+diproses.&type=error");
    }

    await connection.query(
      "UPDATE community_service_members SET status = 'approved', responded_at = NOW(), updated_at = NOW() WHERE id = ?",
      [id]
    );

    res.redirect("/undangan?msg=Undangan+berhasil+diterima.&type=success");
  } catch (error) {
    console.error("Error Approve Undangan:", error);
    next(error);
  } finally {
    connection.release();
  }
};

// ── POST /undangan/:id/reject — Tolak undangan ──
const rejectUndangan = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    const lecturerId = await getLecturerId(connection, userId);

    if (!lecturerId) {
      return res.redirect("/undangan?msg=Akun+Anda+bukan+dosen.&type=error");
    }

    const [[invitation]] = await connection.query(
      "SELECT * FROM community_service_members WHERE id = ? AND lecturer_id = ? AND status = 'pending'",
      [id, lecturerId]
    );

    if (!invitation) {
      return res.redirect("/undangan?msg=Undangan+tidak+ditemukan+atau+sudah+diproses.&type=error");
    }

    await connection.query(
      "UPDATE community_service_members SET status = 'rejected', responded_at = NOW(), updated_at = NOW() WHERE id = ?",
      [id]
    );

    res.redirect("/undangan?msg=Undangan+berhasil+ditolak.&type=success");
  } catch (error) {
    console.error("Error Reject Undangan:", error);
    next(error);
  } finally {
    connection.release();
  }
};

// ── GET /undangan/:id/bukti — Unduh Bukti PDF ──
const downloadBuktiPDF = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    const lecturerId = await getLecturerId(connection, userId);

    if (!lecturerId) {
      return res.status(403).send("Akses ditolak.");
    }

    // Ambil data lengkap untuk bukti PDF
    const [[data]] = await connection.query(
      `SELECT csm.id, csm.role AS member_role, csm.status, csm.responded_at, csm.created_at,
              cs.title AS service_title, cs.description, cs.start_date, cs.end_date, cs.location,
              u_creator.name AS creator_name,
              u_member.name  AS member_name,
              u_member.email AS member_email
       FROM community_service_members csm
       JOIN community_services cs ON csm.community_service_id = cs.id
       JOIN users u_creator ON cs.created_by = u_creator.id
       JOIN lecturers l ON csm.lecturer_id = l.id
       JOIN users u_member ON l.user_id = u_member.id
       WHERE csm.id = ? AND csm.lecturer_id = ?`,
      [id, lecturerId]
    );

    if (!data) {
      return res.status(404).send("Data tidak ditemukan.");
    }

    // Hanya bisa unduh jika sudah diproses (bukan pending)
    if (data.status === "pending") {
      return res.redirect("/undangan?msg=Bukti+hanya+bisa+diunduh+setelah+undangan+diproses.&type=error");
    }

    // ── Generate PDF ──
    const doc = new PDFDocument({ margin: 60, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=bukti-keanggotaan-${id}.pdf`
    );
    doc.pipe(res);

    const isApproved = data.status === "approved";
    const accentColor = isApproved ? "#008556" : "#dc2626";
    const statusLabel = isApproved ? "DISETUJUI" : "DITOLAK";

    // Header bar
    doc.rect(0, 0, doc.page.width, 8).fill(accentColor);

    // Logo area / Title
    doc.moveDown(1);
    doc.fontSize(20).font("Helvetica-Bold").fillColor("#1e293b")
      .text("BUKTI KEANGGOTAAN PENGABDIAN MASYARAKAT", { align: "center" });
    doc.fontSize(11).font("Helvetica").fillColor("#64748b")
      .text("Universitas Andalas — Sistem Pengabdian", { align: "center" });

    // Status badge
    doc.moveDown(1);
    doc.roundedRect(doc.page.width / 2 - 70, doc.y, 140, 32, 6).fill(isApproved ? "#ecfdf5" : "#fef2f2");
    doc.fontSize(13).font("Helvetica-Bold").fillColor(accentColor)
      .text(statusLabel, doc.page.width / 2 - 70, doc.y - 28, { width: 140, align: "center" });

    doc.moveDown(2);

    // Divider
    doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).strokeColor("#e2e8f0").lineWidth(1).stroke();
    doc.moveDown(1);

    // Section: Informasi Pengabdian
    const drawSection = (title, fields) => {
      doc.fontSize(11).font("Helvetica-Bold").fillColor(accentColor).text(title);
      doc.moveDown(0.4);
      fields.forEach(([label, value]) => {
        doc.fontSize(10).font("Helvetica-Bold").fillColor("#374151").text(label + ":", { continued: true, width: 180 });
        doc.font("Helvetica").fillColor("#1e293b").text("  " + (value || "-"));
      });
      doc.moveDown(0.8);
    };

    drawSection("Informasi Pengabdian", [
      ["Judul Kegiatan", data.service_title],
      ["Lokasi", data.location],
      ["Tanggal Mulai", data.start_date ? new Date(data.start_date).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "-"],
      ["Tanggal Selesai", data.end_date ? new Date(data.end_date).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "-"],
      ["Ketua Pengabdian", data.creator_name],
    ]);

    doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).strokeColor("#e2e8f0").lineWidth(1).stroke();
    doc.moveDown(1);

    drawSection("Informasi Anggota", [
      ["Nama Dosen", data.member_name],
      ["Email", data.member_email],
      ["Peran / Jabatan", data.member_role],
      ["Status Keanggotaan", statusLabel],
      ["Tanggal Undangan", new Date(data.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })],
      ["Tanggal Diproses", data.responded_at ? new Date(data.responded_at).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"],
    ]);

    doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).strokeColor("#e2e8f0").lineWidth(1).stroke();
    doc.moveDown(1.5);

    // Keterangan
    doc.fontSize(9).font("Helvetica").fillColor("#94a3b8")
      .text(
        "Dokumen ini diterbitkan secara otomatis oleh Sistem Pengabdian Universitas Andalas sebagai bukti resmi " +
        (isApproved ? "persetujuan" : "penolakan") +
        " keanggotaan dalam kegiatan pengabdian masyarakat. Dokumen ini sah tanpa tanda tangan basah.",
        { align: "center" }
      );

    doc.moveDown(0.5);
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#64748b")
      .text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, { align: "center" });

    // Footer bar
    doc.rect(0, doc.page.height - 8, doc.page.width, 8).fill(accentColor);

    doc.end();
  } catch (error) {
    console.error("Error Download Bukti PDF:", error);
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = { getAllUndangan, approveUndangan, rejectUndangan, downloadBuktiPDF };
