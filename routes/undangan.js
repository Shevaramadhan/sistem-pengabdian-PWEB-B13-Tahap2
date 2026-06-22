const express = require("express");
const router  = express.Router();
const undanganController = require("../controllers/undanganController");
const { isAuthenticated }  = require("../middlewares/auth");
const { checkPermission }  = require("../middlewares/acl");

router.use(isAuthenticated);

// GET READ Fitur Dosen dapat melihat daftar undangan keanggotaan pengabdian (Sheva Ramadhan)
router.get("/", checkPermission("view_pengabdian"), undanganController.getAllUndangan);

// GET UPDATE Fitur Dosen dapat menyetujui atau menolak undangan keanggotaan pengabdian (Athaya Nasywa Mahira)
router.get("/:id/accept", checkPermission("view_pengabdian"), undanganController.acceptUndangan);
router.get("/:id/reject", checkPermission("view_pengabdian"), undanganController.rejectUndangan);

// GET DOWNLOAD Fitur Dosen dapat mengunduh bukti persetujuan atau penolakan keanggotaan dalam format PDF (Athaya Nasywa Mahira)
router.get("/:id/bukti", checkPermission("view_pengabdian"), undanganController.downloadBuktiPDF);

module.exports = router;
