const express = require("express");
const router  = express.Router();
const undanganController = require("../controllers/undanganController");
const { isAuthenticated }  = require("../middlewares/auth");
const { checkPermission }  = require("../middlewares/acl");

router.use(isAuthenticated);

router.get("/", checkPermission("view_pengabdian"), undanganController.getAllUndangan); // Daftar undangan (Fitur 16)

// Note: Fitur 17 (Approve/Reject) adalah tugas Athaya, nanti rutenya ditambah di sini
// router.post("/:id/approve", undanganController.approve);
// router.post("/:id/reject", undanganController.reject);

module.exports = router;
