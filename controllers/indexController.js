const bcrypt = require("bcryptjs");
const db = require("../lib/db");

const index = (req, res) => {
  if (req.session.userId) return res.redirect("/home");
  res.redirect("/login");
};

// GET READ Fitur Dosen dapat melihat dashboard pengabdian (Athaya Nasywa Mahira)
const home = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const lecturerId = req.session.user?.lecturerId;
    const role = req.session.user?.role;
    const isAdmin = role === "admin";

    let stats, recentServices, pendingInvitations = 0, totalDosen = 0;

    if (isAdmin) {
      const [[globalStats]] = await db.query(
        `SELECT COUNT(*) AS total,
          SUM(status = 'proposed')  AS proposed,
          SUM(status = 'ongoing')   AS ongoing,
          SUM(status = 'completed') AS completed
         FROM community_services`
      );
      stats = {
        total:     globalStats.total     || 0,
        proposed:  globalStats.proposed  || 0,
        ongoing:   globalStats.ongoing   || 0,
        completed: globalStats.completed || 0,
      };

      const [[dosenCount]] = await db.query(
        `SELECT COUNT(*) AS cnt FROM lecturers`
      );
      totalDosen = dosenCount.cnt || 0;

      const [allRecent] = await db.query(
        `SELECT cs.id, cs.title, cs.location, cs.start_date, cs.status,
                u.name AS creator_name
         FROM community_services cs
         JOIN users u ON cs.created_by = u.id
         ORDER BY cs.created_at DESC LIMIT 5`
      );
      recentServices = allRecent;

    } else {
      const [[myStats]] = await db.query(
        `SELECT COUNT(*) AS total,
          SUM(status = 'proposed')  AS proposed,
          SUM(status = 'ongoing')   AS ongoing,
          SUM(status = 'completed') AS completed
         FROM community_services WHERE created_by = ?`,
        [userId]
      );
      stats = {
        total:     myStats.total     || 0,
        proposed:  myStats.proposed  || 0,
        ongoing:   myStats.ongoing   || 0,
        completed: myStats.completed || 0,
      };

      if (lecturerId) {
        const [[inv]] = await db.query(
          `SELECT COUNT(*) AS cnt FROM community_service_members
           WHERE lecturer_id = ? AND status = 'pending'`,
          [lecturerId]
        );
        pendingInvitations = inv.cnt || 0;
      }

      const [myRecent] = await db.query(
        `SELECT id, title, location, start_date, status
         FROM community_services
         WHERE created_by = ?
         ORDER BY created_at DESC LIMIT 5`,
        [userId]
      );
      recentServices = myRecent;
    }

    res.render("dashboard", {
      layout: "layouts/app",
      pageTitle: "Dashboard",
      user: req.session.user,
      isAdmin,
      stats,
      pendingInvitations,
      recentServices,
      totalDosen,
    });
  } catch (err) {
    next(err);
  }
};

const loginPage = (req, res) => {
  if (req.session.userId) return res.redirect("/home");
  res.render("login", { title: "Login", error: null });
};

const login = async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render("login", {
      title: "Login",
      error: "Username dan password wajib diisi.",
    });
  }

  try {
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.username, u.email, u.password,
              r.name AS role_name,
              l.id   AS lecturer_id
       FROM users u
       LEFT JOIN user_has_roles uhr ON u.id = uhr.user_id
       LEFT JOIN roles r            ON uhr.role_id = r.id
       LEFT JOIN lecturers l        ON u.id = l.user_id
       WHERE u.username = ?
       LIMIT 1`,
      [username]
    );

    if (rows.length === 0) {
      return res.render("login", {
        title: "Login",
        error: "Username atau password salah.",
      });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render("login", {
        title: "Login",
        error: "Username atau password salah.",
      });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.user = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role_name || "dosen",
      lecturerId: user.lecturer_id || null,
    };

    res.redirect("/home");
  } catch (err) {
    next(err);
  }
};

const logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.redirect("/login");
  });
};

module.exports = {
  index,
  home,
  loginPage,
  login,
  logout,
};
