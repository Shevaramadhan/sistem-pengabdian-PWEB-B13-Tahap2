const express = require("express");
const router  = express.Router();
const undanganController = require("../controllers/undanganController");
const { isAuthenticated }  = require("../middlewares/auth");
const { checkPermission }  = require("../middlewares/acl");

router.use(isAuthenticated);

// Fitur 16: Lihat daftar undangan
router.get("/", checkPermission("view_pengabdian"), undanganController.getAllUndangan);

// Fitur 17: Terima undangan
router.get("/:id/accept", checkPermission("view_pengabdian"), undanganController.acceptUndangan);

// Fitur 17: Tolak undangan
router.get("/:id/reject", checkPermission("view_pengabdian"), undanganController.rejectUndangan);

module.exports = router;
