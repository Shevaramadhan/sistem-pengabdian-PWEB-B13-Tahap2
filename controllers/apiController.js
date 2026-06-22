const db = require('../lib/db');

// GET READ Fitur Dosen dapat mengambil daftar pengabdian melalui RestAPI (Sheva Ramadhan)
exports.getPengabdian = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT cs.id, cs.title, cs.location, cs.start_date, cs.end_date, cs.funding_source, cs.status, u.name as creator_name
      FROM community_services cs
      JOIN users u ON cs.created_by = u.id
      ORDER BY cs.created_at DESC
    `);
    
    res.json({
      success: true,
      message: 'Berhasil mengambil data pengabdian',
      data: rows
    });
  } catch (err) {
    next(err);
  }
};

// GET READ Fitur Dosen dapat mengambil daftar undangan keanggotaan melalui RestAPI (Athaya Nasywa Mahira)
exports.getUndangan = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const [rows] = await db.query(`
      SELECT m.id, m.role, m.status, cs.title as pengabdian_title, u.name as invited_by
      FROM members m
      JOIN community_services cs ON m.community_service_id = cs.id
      JOIN users u ON cs.created_by = u.id
      WHERE m.user_id = ?
      ORDER BY m.created_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      message: 'Berhasil mengambil data undangan keanggotaan',
      data: rows
    });
  } catch (err) {
    next(err);
  }
};
