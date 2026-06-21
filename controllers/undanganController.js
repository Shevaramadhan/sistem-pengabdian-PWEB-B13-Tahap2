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
    // Dapatkan lecturer_id dari user yang login
    const [[lecturer]] = await connection.query(
      "SELECT id FROM lecturers WHERE user_id = ?",
      [userId]
    );
    const lecturerId = lecturer ? lecturer.id : null;

    let invitations = [];
    if (lecturerId) {
      const [rows] = await connection.query(
        `SELECT 
            csm.id          AS id,
            csm.id          AS member_record_id,
            csm.role        AS member_role,
            csm.status,
            csm.created_at,
            csm.responded_at,
            cs.id           AS cs_id,
            cs.title        AS cs_title,
            cs.title        AS service_title,
            cs.start_date   AS start_date,
            cs.start_date   AS cs_start_date,
            cs.location     AS location,
            cs.location     AS cs_location,
            u.name          AS creator_name
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

    // Ambil data lengkap untuk bukti PDF (termasuk NIDN & jabatan ketua dan anggota)
    const [[data]] = await connection.query(
      `SELECT csm.id, csm.role AS member_role, csm.status, csm.responded_at, csm.created_at,
              cs.title AS service_title, cs.description, cs.start_date, cs.end_date, cs.location, cs.funding_source,
              u_creator.name AS creator_name,
              l_creator.nidn AS creator_nidn,
              l_creator.academic_rank AS creator_academic_rank,
              u_member.name  AS member_name,
              u_member.email AS member_email,
              l_member.nidn  AS member_nidn,
              l_member.academic_rank AS member_academic_rank
       FROM community_service_members csm
       JOIN community_services cs ON csm.community_service_id = cs.id
       JOIN users u_creator ON cs.created_by = u_creator.id
       LEFT JOIN lecturers l_creator ON u_creator.id = l_creator.user_id
       JOIN lecturers l_member ON csm.lecturer_id = l_member.id
       JOIN users u_member ON l_member.user_id = u_member.id
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
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=bukti-keanggotaan-${id}.pdf`
    );
    doc.pipe(res);

    const isApproved = data.status === "approved";

    // 1. Logo area / Kop Surat
    const fs = require("fs");
    const path = require("path");
    const logoPath = path.join(__dirname, "../public/assets/images/logo-unand.png");

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 42, { width: 55 });
    } else {
      doc.lineWidth(1.5).rect(50, 40, 55, 55).strokeColor("#000000").stroke();
      doc.font("Helvetica-Bold").fontSize(18).fillColor("#008556").text("UA", 62, 58);
    }

    doc.fontSize(14).font("Helvetica-Bold").fillColor("#000000")
       .text("UNIVERSITAS ANDALAS", 120, 48, { align: "center", width: 410 });
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#000000")
       .text("Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM)", 120, 67, { align: "center", width: 410 });
    doc.fontSize(8).font("Helvetica").fillColor("#374151")
       .text("Kampus Unand Limau Manis, Padang 25163 | lppm@unand.ac.id | lppm.unand.ac.id", 120, 85, { align: "center", width: 410 });

    doc.moveTo(50, 105).lineTo(545, 105).lineWidth(1.5).strokeColor("#000000").stroke();

    // 2. Title & Number
    const padId = String(data.id).padStart(3, "0");
    const year = new Date(data.created_at || new Date()).getFullYear();
    const docNumber = `${padId}/PKM-AI/KNY/VI/${year}`;

    doc.fontSize(11).font("Helvetica-Bold").fillColor("#000000")
       .text(isApproved ? "SURAT PERNYATAAN KESEDIAAN KEANGGOTAAN" : "SURAT PERNYATAAN PENOLAKAN KEANGGOTAAN", 50, 120, { align: "center", width: 495 });
    doc.fontSize(9).font("Helvetica").fillColor("#000000")
       .text(`Nomor: ${docNumber}`, 50, 134, { align: "center", width: 495 });

    // 3. Opening text
    doc.fontSize(9.5).font("Helvetica").fillColor("#000000")
       .text("Yang bertanda tangan di bawah ini:", 50, 160);

    // 4. First Table (Member details) - Black & White
    const startY1 = 175;
    const rowHeight = 18;
    const labels = [
      ["Nama", data.member_name],
      ["NIP / NIDN", `— / ${data.member_nidn || "-"}`],
      ["Jabatan", `${data.member_academic_rank || "Dosen"} — Universitas Andalas`],
      ["Email", data.member_email || "-"]
    ];

    labels.forEach((row, i) => {
      const y = startY1 + (i * rowHeight);
      doc.rect(50, y, 495, rowHeight).lineWidth(0.5).strokeColor("#000000").stroke();
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#000000").text(row[0], 60, y + 5);
      doc.font("Helvetica").fontSize(8.5).fillColor("#000000").text(`: ${row[1]}`, 170, y + 5);
    });

    // 5. Body Paragraph (Justified, word-spacing)
    const textY = startY1 + (labels.length * rowHeight) + 12;
    doc.fontSize(9.5).font("Helvetica").fillColor("#000000")
       .text("Dengan ini menyatakan ", 50, textY, { continued: true, align: "justify", width: 495, lineGap: 3 });

    if (isApproved) {
      doc.font("Helvetica-Bold").text("bersedia", { continued: true });
      doc.font("Helvetica").text(" menjadi anggota tim pelaksana kegiatan Pengabdian kepada Masyarakat berjudul ", { continued: true });
    } else {
      doc.font("Helvetica-Bold").text("tidak dapat menerima", { continued: true });
      doc.font("Helvetica").text(" undangan sebagai anggota tim pelaksana kegiatan Pengabdian kepada Masyarakat berjudul ", { continued: true });
    }

    doc.font("Helvetica-Bold").text(`"${data.service_title}"`, { continued: true });
    doc.font("Helvetica").text(" yang diketuai oleh ", { continued: true });
    doc.font("Helvetica-Bold").text(data.creator_name, { continued: true });

    if (isApproved) {
      doc.font("Helvetica").text(", dan siap menjalankan tugas sesuai ketentuan yang berlaku.");
    } else {
      doc.font("Helvetica").text(". Atas perhatian dan pengertian Ketua Pelaksana, disampaikan terima kasih.");
    }

    // 6. Second Table (Activity details) - Black & White, Decisions in black
    const startY2 = doc.y + 15;
    const startDateStr = data.start_date ? new Date(data.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";
    const endDateStr = data.end_date ? new Date(data.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : startDateStr;
    const periodStr = `${startDateStr} s.d. ${endDateStr}`;

    const activityFields = [
      ["Judul Kegiatan", data.service_title],
      ["Ketua Pelaksana", data.creator_name],
      ["Lokasi", data.location],
      ["Periode", periodStr],
      ["Skema", data.funding_source || "Reguler DIPA Universitas Andalas"],
      ["Keputusan", isApproved ? "BERSEDIA MENJADI ANGGOTA" : "MENOLAK UNDANGAN KEANGGOTAAN"]
    ];

    activityFields.forEach((row, i) => {
      const y = startY2 + (i * rowHeight);
      doc.rect(50, y, 495, rowHeight).lineWidth(0.5).strokeColor("#000000").stroke();
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#000000").text(row[0], 60, y + 5);
      doc.font("Helvetica").fontSize(8.5).fillColor("#000000").text(`: ${row[1]}`, 170, y + 5);
    });

    // 7. Closing Text
    const startY3 = startY2 + (activityFields.length * rowHeight) + 12;
    doc.font("Helvetica").fontSize(9.5).fillColor("#000000")
       .text("Demikian surat pernyataan ini dibuat dengan sebenar-benarnya.", 50, startY3);

    // 8. Signatures (Single page layout)
    const signedDate = data.responded_at ? new Date(data.responded_at) : new Date();
    const signedDateStr = signedDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const placeDateStr = `Padang, ${signedDateStr}`;

    const sigY = startY3 + 30;
    const colWidth = 200;
    const leftX = 50;
    const rightX = 345;

    // Left Column
    doc.font("Helvetica").fontSize(9.5).fillColor("#000000")
       .text(placeDateStr, leftX, sigY, { width: colWidth, align: "center" })
       .text("Yang Menyatakan,", leftX, sigY + 14, { width: colWidth, align: "center" });
    doc.font("Helvetica-Bold")
       .text(data.member_name, leftX, sigY + 70, { width: colWidth, align: "center" });
    doc.font("Helvetica")
       .text(`NIP / NIDN. — / ${data.member_nidn || "-"}`, leftX, sigY + 84, { width: colWidth, align: "center" });

    // Right Column
    doc.font("Helvetica").fontSize(9.5).fillColor("#000000")
       .text(placeDateStr, rightX, sigY, { width: colWidth, align: "center" })
       .text("Ketua Pelaksana,", rightX, sigY + 14, { width: colWidth, align: "center" });
    doc.font("Helvetica-Bold")
       .text(data.creator_name, rightX, sigY + 70, { width: colWidth, align: "center" });
    doc.font("Helvetica")
       .text(`NIP / NIDN. — / ${data.creator_nidn || "-"}`, rightX, sigY + 84, { width: colWidth, align: "center" });

    // 9. Fine Print / Footer (Shifted up to be within limits)
    const footerY = doc.page.height - 45;
    doc.moveTo(50, footerY - 5).lineTo(545, footerY - 5).lineWidth(0.5).strokeColor("#cbd5e1").stroke();

    const printDateStr = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "2-digit", year: "numeric" });
    const footerText = `Diterbitkan otomatis oleh Sistem Pengabdian Masyarakat Universitas Andalas | No. Dok: ${docNumber} | Dicetak: ${printDateStr} | Dokumen sah tanpa tanda tangan basah. Verifikasi: lppm.unand.ac.id`;
    doc.font("Helvetica").fontSize(7).fillColor("#94a3b8")
       .text(footerText, 50, footerY, { align: "center", width: 495 });

    doc.end();
  } catch (error) {
    console.error("Error Download Bukti PDF:", error);
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = { getAllUndangan, acceptUndangan, rejectUndangan, downloadBuktiPDF };
