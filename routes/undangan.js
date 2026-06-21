const express = require("express");
const router  = express.Router();
const undanganController = require("../controllers/undanganController");
const { isAuthenticated }  = require("../middlewares/auth");
const { checkPermission }  = require("../middlewares/acl");

router.use(isAuthenticated);

// Daftar undangan (Modul 3 - Fitur 16)
router.get("/", checkPermission("view_pengabdian"), undanganController.getAllUndangan);

// Terima undangan (Modul 3 - Fitur 17)
router.post("/:id/approve", checkPermission("view_pengabdian"), undanganController.approveUndangan);

// Tolak undangan (Modul 3 - Fitur 17)
router.post("/:id/reject", checkPermission("view_pengabdian"), undanganController.rejectUndangan);

// Unduh bukti PDF persetujuan/penolakan (Modul 3 - Fitur 18)
router.get("/:id/bukti", checkPermission("view_pengabdian"), undanganController.downloadBuktiPDF);

module.exports = router;
