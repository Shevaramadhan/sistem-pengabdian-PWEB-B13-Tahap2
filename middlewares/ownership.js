const db = require("../lib/db");

/**
 * Middleware untuk mengecek kepemilikan data pengabdian.
 * Memastikan bahwa user yang mengakses resource adalah:
 * 1. Admin
 * 2. ATAU Dosen yang membuat (Ketua Pengusul) data pengabdian tersebut.
 */
const verifyOwnership = async (req, res, next) => {
  const userId = req.session.userId;
  const userRole = req.session.user?.role;
  const isAdmin = userRole === "admin";

  // Ambil ID pengabdian dari URL (bisa 'id' atau 'csId' tergantung route)
  const serviceId = req.params.csId || req.params.id;

  if (!serviceId) {
    return respondError(req, res, 400, "ID pengabdian tidak ditemukan.");
  }

  try {
    const [[service]] = await db.query(
      `SELECT cs.*, u.name AS creator_name
       FROM community_services cs
       JOIN users u ON cs.created_by = u.id
       WHERE cs.id = ?`,
      [serviceId]
    );

    if (!service) {
      return respondError(req, res, 404, "Data pengabdian tidak ditemukan.");
    }

    // Jika bukan admin dan bukan pembuat data, tolak akses
    if (!isAdmin && service.created_by !== userId) {
      return respondError(req, res, 403, "Akses ditolak: Anda bukan pembuat data pengabdian ini.");
    }

    // Simpan data service ke res.locals agar tidak perlu di-query ulang di controller
    res.locals.service = service;

    next();
  } catch (error) {
    console.error("Error Ownership Middleware:", error);
    return respondError(req, res, 500, "Terjadi kesalahan saat memverifikasi akses.");
  }
};

// Helper function untuk memberikan respons yang sesuai (JSON atau HTML)
function respondError(req, res, statusCode, message) {
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(statusCode).json({ status: 'error', message });
  }
  return res.status(statusCode).render("error", { 
    message, 
    error: { status: statusCode, stack: '' } 
  });
}

module.exports = {
  verifyOwnership
};
