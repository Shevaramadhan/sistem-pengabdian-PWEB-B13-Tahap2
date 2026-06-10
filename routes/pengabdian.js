const express = require("express");
const router = express.Router();
const pengabdianController = require("../controllers/pengabdianController");
const { isAuthenticated } = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/acl");

// Seluruh route di sini memerlukan autentikasi
router.use(isAuthenticated);

// ─── Modul Pengabdian ───
router.get("/", checkPermission("view_pengabdian"), pengabdianController.list);
router.get("/create", checkPermission("create_pengabdian"), pengabdianController.createForm);
router.post("/create", checkPermission("create_pengabdian"), pengabdianController.create);
router.get("/:id", checkPermission("view_pengabdian"), pengabdianController.detail);
router.get("/:id/status", checkPermission("view_pengabdian"), pengabdianController.statusTracking);
router.post("/:id/status", checkPermission("manage_pengabdian"), pengabdianController.updateStatus);

module.exports = router;
