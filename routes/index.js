var express = require("express");
var router = express.Router();
const indexController = require("../controllers/indexController");
const pengabdianController = require("../controllers/pengabdianController");
const { isAuthenticated } = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/acl");

/* GET home page. */
router.get("/", indexController.index);

router.get("/home", isAuthenticated, indexController.home);

// ─── Undangan Keanggotaan Dosen ───
router.get("/undangan", isAuthenticated, checkPermission("view_pengabdian"), pengabdianController.listInvitations);
router.get("/undangan/:id/:action", isAuthenticated, checkPermission("view_pengabdian"), pengabdianController.respondInvitation);

router.get("/login", indexController.loginPage);

router.post("/login", indexController.login);

router.get("/logout", indexController.logout);

module.exports = router;
