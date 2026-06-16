const db = require("../lib/db");
const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const PdfTable = require("pdfkit-table");

// ── GET /pengabdian — Daftar semua pengabdian ──
const getAllPengabdian = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const userId  = req.session.userId;
    const role    = req.session.user?.role;
    const isAdmin = role === "admin";

    const search = req.query.search || "";
    const status = req.query.status || "";
    const year   = req.query.year   || "";
    const sort   = req.query.sort   || "newest";
    const page   = parseInt(req.query.page) || 1;
    const limit  = 10;
    const offset = (page - 1) * limit;

    // ── Build WHERE clause ──
    let conditions = [];
    let params     = [];

    if (!isAdmin) {
      conditions.push("cs.created_by = ?");
      params.push(userId);
    }
    if (search) {
      conditions.push("(cs.title LIKE ? OR cs.location LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      conditions.push("cs.status = ?");
      params.push(status);
    }
    if (year) {
      conditions.push("YEAR(cs.start_date) = ?");
      params.push(year);
    }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    const orderClause = sort === "oldest" ? "ORDER BY cs.created_at ASC" : "ORDER BY cs.created_at DESC";

    // ── Statistik ──
    const statsSql = `
      SELECT 
        COUNT(*) AS total,
        SUM(IF(cs.status = 'proposed', 1, 0))   AS proposed,
        SUM(IF(cs.status = 'ongoing', 1, 0))    AS ongoing,
        SUM(IF(cs.status = 'completed', 1, 0))  AS completed
      FROM community_services cs
      ${isAdmin ? "" : "WHERE cs.created_by = ?"}`;
    const [[statsRow]] = await connection.query(statsSql, isAdmin ? [] : [userId]);

    const stats = {
      total:     statsRow.total     || 0,
      proposed:  statsRow.proposed  || 0,
      ongoing:   statsRow.ongoing   || 0,
      completed: statsRow.completed || 0,
    };

    // ── Count dengan filter ──
    const countSql = `SELECT COUNT(*) AS total FROM community_services cs ${whereClause}`;
    const [[{ total }]] = await connection.query(countSql, params);

    // ── Data ──
    const dataSql = `
      SELECT cs.id, cs.title, cs.location, cs.start_date, cs.end_date,
             cs.status, cs.funding_source, cs.created_at, cs.created_by,
             u.name AS creator_name
      FROM community_services cs
      JOIN users u ON cs.created_by = u.id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?`;
    const [rows] = await connection.query(dataSql, [...params, limit, offset]);

    // ── Available Years ──
    const yearBaseCond = isAdmin ? "" : "WHERE cs.created_by = ?";
    const [yearRows] = await connection.query(
      `SELECT DISTINCT YEAR(cs.start_date) AS yr FROM community_services cs ${yearBaseCond} ORDER BY yr DESC`,
      isAdmin ? [] : [userId]
    );
    const availableYears = yearRows.map(r => r.yr).filter(Boolean);

    const totalPages = Math.ceil(total / limit);

    res.render("pengabdian/index", {
      layout: "layouts/pengabdian",
      pageTitle: "Daftar Pengabdian",
      user: req.session.user,
      isAdmin,
      services: rows,
      search,
      stats,
      availableYears,
      filters: {
        search,
        status,
        year,
        sort,
        page,
        totalPages,
        totalItems: total,
      },
      pagination: {
        page,
        totalPages,
        total,
        limit,
      },
    });
  } catch (error) {
    console.error("Error Get All Pengabdian:", error);
    next(error);
  } finally {
    connection.release();
  }
};

// ── GET /pengabdian/:id — Detail pengabdian
const getPengabdianById = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const userId  = req.session.userId;
    const isAdmin = req.session.user?.role === "admin";
    const service = res.locals.service;

    // Ambil daftar anggota
    const [members] = await connection.query(
      `SELECT csm.id, csm.role AS member_role, csm.status,
              l.id AS lecturer_id, u.name AS lecturer_name,
              l.academic_rank, l.expertise
       FROM community_service_members csm
       JOIN lecturers l ON csm.lecturer_id = l.id
       JOIN users u     ON l.user_id = u.id
       WHERE csm.community_service_id = ?
       ORDER BY csm.created_at ASC`,
      [id]
    );

    // Ambil semua dosen untuk dropdown tambah anggota
    const [allLecturers] = await connection.query(
      `SELECT l.id, u.name, l.academic_rank 
       FROM lecturers l 
       JOIN users u ON l.user_id = u.id 
       ORDER BY u.name ASC`
    );

    res.render("pengabdian/show", {
      layout: "layouts/pengabdian",
      pageTitle: service.title,
      user: req.session.user,
      isAdmin,
      service,
      members,
      allLecturers,
      userId,
    });
  } catch (error) {
    console.error("Error Get Pengabdian By ID:", error);
    next(error);
  } finally {
    connection.release();
  }
};

// ── GET /pengabdian/create — Tampilkan form tambah pengabdian ──
const getViewFormCreatePengabdian = (req, res) => {
  res.render("pengabdian/create", {
    layout: "layouts/pengabdian",
    pageTitle: "Tambah Pengabdian",
    user: req.session.user,
    isAdmin: req.session.user?.role === "admin",
    errors: [],
    old: {},
  });
};

// ── POST /pengabdian — Simpan data pengabdian baru ──
const createPengabdian = async (req, res, next) => {
  const { title, description, location, start_date, end_date, funding_source } = req.body;
  const proposalFile = req.file ? `/uploads/proposals/${req.file.filename}` : null;
  let status = req.body.status;
  const isAdmin = req.session.user?.role === "admin";
  if (!isAdmin) {
    status = 'proposed';
  }
  const errors = [];

  if (!title?.trim())    errors.push("Judul wajib diisi.");
  if (!location?.trim()) errors.push("Lokasi wajib diisi.");
  if (!start_date)       errors.push("Tanggal mulai wajib diisi.");
  if (!status)           errors.push("Status wajib dipilih.");

  if (errors.length > 0) {
    return res.status(400).json({ status: 'error', message: errors.join(" ") });
  }

  const connection = await db.getConnection();
  try {
    await connection.query(
      `INSERT INTO community_services
         (title, description, location, start_date, end_date, funding_source, status, proposal_file, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        title.trim(),
        description?.trim() || null,
        location.trim(),
        start_date,
        end_date || null,
        funding_source?.trim() || null,
        status,
        proposalFile,
        req.session.userId,
      ]
    );
    res.status(200).json({ status: 'success', message: 'Data berhasil disimpan.', redirectUrl: '/pengabdian?success=1' });
  } catch (error) {
    console.error("Error Create Pengabdian:", error);
    res.status(500).json({ status: 'error', message: 'Gagal menyimpan data pengabdian.' });
  } finally {
    connection.release();
  }
};

// ── GET /pengabdian/:id/edit — Tampilkan form edit pengabdian ──
const getViewFormUpdatePengabdian = async (req, res, next) => {
  try {
    const role    = req.session.user?.role;
    const service = res.locals.service;

    res.render("pengabdian/edit", {
      layout: "layouts/pengabdian",
      pageTitle: "Edit Pengabdian",
      user: req.session.user,
      isAdmin: role === "admin",
      service,
      errors: [],
    });
  } catch (error) {
    console.error("Error Get View Form Update Pengabdian:", error);
    next(error);
  }
};

// ── POST /pengabdian/:id/edit — Simpan perubahan data pengabdian ──
const updatePengabdian = async (req, res, next) => {
  const { id } = req.params;
  const { title, description, location, start_date, end_date, funding_source } = req.body;
  const proposalFile = req.file ? `/uploads/proposals/${req.file.filename}` : null;
  let status = req.body.status;
  const isAdmin = req.session.user?.role === "admin";

  const errors = [];
  if (!title?.trim())    errors.push("Judul wajib diisi.");
  if (!location?.trim()) errors.push("Lokasi wajib diisi.");
  if (!start_date)       errors.push("Tanggal mulai wajib diisi.");
  if (!status)           errors.push("Status wajib dipilih.");

  if (errors.length > 0) {
    return res.status(400).json({ status: 'error', message: errors.join(" ") });
  }

  const connection = await db.getConnection();
  try {
    if (!isAdmin) {
      const [rows] = await connection.query("SELECT status FROM community_services WHERE id=?", [id]);
      if (rows.length > 0) {
        status = rows[0].status;
      }
    }

    await connection.query(
      `UPDATE community_services
       SET title=?, description=?, location=?, start_date=?, end_date=?,
           funding_source=?, status=?, updated_at=NOW()
       WHERE id=?`,
      [
        title.trim(),
        description?.trim() || null,
        location.trim(),
        start_date,
        end_date || null,
        funding_source?.trim() || null,
        status,
        id,
      ]
    );
    res.status(200).json({ status: 'success', message: 'Data berhasil diubah.', redirectUrl: `/pengabdian/${id}?success=updated` });
  } catch (error) {
    console.error("Error Update Pengabdian:", error);
    res.status(500).json({ status: 'error', message: 'Gagal memperbarui data pengabdian.' });
  } finally {
    connection.release();
  }
};

// ── POST /pengabdian/:id/delete — Hapus data pengabdian ──
const deletePengabdian = async (req, res, next) => {
  const { id } = req.params;

  const connection = await db.getConnection();
  try {
    // Hapus anggota dulu (FK constraint)
    await connection.query("DELETE FROM community_service_members WHERE community_service_id = ?", [id]);
    await connection.query("DELETE FROM community_services WHERE id = ?", [id]);

    res.status(200).json({ status: 'success', message: 'Data berhasil dihapus.', redirectUrl: "/pengabdian?success=deleted" });
  } catch (error) {
    console.error("Error Delete Pengabdian:", error);
    res.status(500).json({ status: 'error', message: 'Gagal menghapus pengabdian.' });
  } finally {
    connection.release();
  }
};

// ── GET /pengabdian/:id/upload — Tampilkan form upload laporan ──
const getViewFormUploadLaporan = async (req, res, next) => {
  try {
    const role    = req.session.user?.role;
    const service = res.locals.service;

    if (service.status === 'completed') {
      return res.status(403).render("error", { message: "Pengabdian sudah difinalisasi, tidak bisa upload laporan baru." });
    }

    res.render("pengabdian/upload", {
      layout: "layouts/pengabdian",
      pageTitle: "Upload Laporan",
      user: req.session.user,
      isAdmin: role === "admin",
      service,
      error: null,
    });
  } catch (error) {
    console.error("Error Get View Form Upload Laporan:", error);
    next(error);
  }
};

// ── POST /pengabdian/:id/upload — Simpan file laporan ──
const uploadLaporan = async (req, res, next) => {
  const { id } = req.params;
  const service = res.locals.service;

  const connection = await db.getConnection();
  try {
    if (service.status === 'completed') {
      return res.status(403).json({ status: 'error', message: 'Pengabdian sudah difinalisasi.' });
    }

    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'File laporan wajib dipilih.' });
    }

    // Hapus file lama jika ada
    if (service.report_file) {
      const oldPath = path.join(__dirname, "../public/uploads/laporan", service.report_file);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) { console.error(e); }
      }
    }

    await connection.query(
      "UPDATE community_services SET report_file=?, updated_at=NOW() WHERE id=?",
      [req.file.filename, id]
    );

    res.status(200).json({ status: 'success', message: 'Laporan berhasil diupload.', redirectUrl: `/pengabdian/${id}?success=laporan_uploaded` });
  } catch (error) {
    console.error("Error Upload Laporan:", error);
    res.status(500).json({ status: 'error', message: 'Gagal mengupload laporan.' });
  } finally {
    connection.release();
  }
};

// ── POST /pengabdian/:id/finalisasi — Finalisasi pengabdian ──
const finalizePengabdian = async (req, res, next) => {
  const { id } = req.params;
  const service = res.locals.service;

  const connection = await db.getConnection();
  try {
    if (service.status === 'completed') {
      return res.status(400).json({ status: 'error', message: 'Pengabdian sudah difinalisasi.' });
    }

    // Cek laporan sudah diupload sebelum finalisasi
    if (!service.report_file) {
      return res.status(400).json({ status: 'error', message: 'Laporan belum diupload.' });
    }

    await connection.query(
      "UPDATE community_services SET is_finalized=1, status='completed', finalized_at=NOW(), updated_at=NOW() WHERE id=?",
      [id]
    );

    res.status(200).json({ status: 'success', message: 'Pengabdian difinalisasi.', redirectUrl: `/pengabdian/${id}?success=finalized` });
  } catch (error) {
    console.error("Error Finalize Pengabdian:", error);
    res.status(500).json({ status: 'error', message: 'Gagal finalisasi pengabdian.' });
  } finally {
    connection.release();
  }
};

// ── GET /pengabdian/export/excel — Export ke Excel ──
const exportExcel = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const userId  = req.session.userId;
    const role    = req.session.user?.role;
    const isAdmin = role === "admin";
    const search  = req.query.search || "";

    let whereClause = isAdmin ? "WHERE 1=1" : "WHERE cs.created_by = ?";
    let params      = isAdmin ? [] : [userId];

    if (search) {
      whereClause += " AND (cs.title LIKE ? OR cs.location LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    const dataSql = `
      SELECT cs.id, cs.title, cs.location, cs.start_date, cs.end_date,
             cs.status, cs.funding_source,
             u.name AS creator_name
      FROM community_services cs
      JOIN users u ON cs.created_by = u.id
      ${whereClause}
      ORDER BY cs.created_at DESC`;
    const [rows] = await connection.query(dataSql, params);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Daftar Pengabdian");

    worksheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Judul Pengabdian", key: "title", width: 40 },
      { header: "Lokasi", key: "location", width: 25 },
      { header: "Dosen Pengusul", key: "creator", width: 25 },
      { header: "Tanggal Mulai", key: "start_date", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };

    rows.forEach((row, index) => {
      worksheet.addRow({
        no: index + 1,
        title: row.title,
        location: row.location,
        creator: row.creator_name,
        start_date: new Date(row.start_date).toLocaleDateString("id-ID"),
        status: row.status === 'proposed' ? 'Diusulkan' : (row.status === 'ongoing' ? 'Berjalan' : 'Selesai')
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "Data_Pengabdian.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error Export Excel:", error);
    next(error);
  } finally {
    connection.release();
  }
};

// ── GET /pengabdian/export/pdf — Export ke PDF (Print View) ──
const exportPdf = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const userId  = req.session.userId;
    const role    = req.session.user?.role;
    const isAdmin = role === "admin";
    const search  = req.query.search || "";

    let whereClause = isAdmin ? "WHERE 1=1" : "WHERE cs.created_by = ?";
    let params      = isAdmin ? [] : [userId];

    if (search) {
      whereClause += " AND (cs.title LIKE ? OR cs.location LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    const dataSql = `
      SELECT cs.id, cs.title, cs.location, cs.start_date, cs.status,
             u.name AS creator_name
      FROM community_services cs
      JOIN users u ON cs.created_by = u.id
      ${whereClause}
      ORDER BY cs.created_at DESC`;
    const [rows] = await connection.query(dataSql, params);

    res.render("pengabdian/print", {
      layout: false, // Tidak pakai layout utama karena ini khusus print
      pageTitle: "Cetak Data Pengabdian",
      services: rows,
      search,
    });
  } catch (error) {
    console.error("Error Cetak PDF:", error);
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllPengabdian,
  getPengabdianById,
  getViewFormCreatePengabdian,
  createPengabdian,
  getViewFormUpdatePengabdian,
  updatePengabdian,
  deletePengabdian,
  getViewFormUploadLaporan,
  uploadLaporan,
  finalizePengabdian,
  exportExcel,
  exportPdf,
};
