const express = require("express");
const router = express.Router();
const pengabdianController = require("../controllers/pengabdianController");
const anggotaController = require("../controllers/anggotaController");
const { isAuthenticated } = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/acl");
const { verifyOwnership } = require("../middlewares/ownership");
const { uploadLaporan } = require("../middlewares/upload");

router.use(isAuthenticated);

// ── Pengabdian ──
router.get("/", checkPermission("view_pengabdian"), pengabdianController.getAllPengabdian);
router.get("/create", checkPermission("create_pengabdian"), pengabdianController.getViewFormCreatePengabdian);
router.post("/", checkPermission("create_pengabdian"), pengabdianController.createPengabdian);

router.get("/export/excel", checkPermission("export_pengabdian"), pengabdianController.exportExcel);
router.get("/export/pdf", checkPermission("export_pengabdian"), pengabdianController.exportPdf);

router.get("/:id", checkPermission("view_pengabdian"), verifyOwnership, pengabdianController.getPengabdianById);
router.get("/:id/edit", checkPermission("edit_pengabdian"), verifyOwnership, pengabdianController.getViewFormUpdatePengabdian);
router.post("/:id/edit", checkPermission("edit_pengabdian"), verifyOwnership, pengabdianController.updatePengabdian);
router.post("/:id/delete", checkPermission("delete_pengabdian"), verifyOwnership, pengabdianController.deletePengabdian);
router.get("/:id/upload", checkPermission("upload_laporan"), verifyOwnership, pengabdianController.getViewFormUploadLaporan);
router.post("/:id/upload", checkPermission("upload_laporan"), verifyOwnership, uploadLaporan.single("report_file"), pengabdianController.uploadLaporan);
router.post("/:id/finalisasi", checkPermission("edit_pengabdian"), verifyOwnership, pengabdianController.finalizePengabdian);

// ── Anggota ──
router.post("/:csId/anggota", checkPermission("manage_anggota"), verifyOwnership, anggotaController.createAnggota);
router.post("/:csId/anggota/:id/edit", checkPermission("manage_anggota"), verifyOwnership, anggotaController.updateAnggota);
router.post("/:csId/anggota/:id/delete", checkPermission("manage_anggota"), verifyOwnership, anggotaController.deleteAnggota);

module.exports = router;