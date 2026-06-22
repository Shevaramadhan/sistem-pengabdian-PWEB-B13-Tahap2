const express = require("express");
const router = express.Router();
const pengabdianController = require("../controllers/pengabdianController");
const anggotaController = require("../controllers/anggotaController");
const { isAuthenticated } = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/acl");
const { verifyOwnership } = require("../middlewares/ownership");
const { uploadLaporan, uploadProposal } = require("../middlewares/upload");

router.use(isAuthenticated);

// GET READ Fitur Dosen dapat melihat daftar pengabdian miliknya (Athaya Nasywa Mahira)
router.get("/", checkPermission("view_pengabdian"), pengabdianController.getAllPengabdian);

// POST CREATE Fitur Dosen dapat menambahkan data pengabdian baru beserta proposal pengabdian (Athaya Nasywa Mahira)
router.get("/create", checkPermission("create_pengabdian"), pengabdianController.getViewFormCreatePengabdian);
router.post("/", checkPermission("create_pengabdian"), uploadProposal.single("proposal_file"), pengabdianController.createPengabdian);

// GET EXPORT Fitur Dosen dapat mengekspor data pengabdian ke format PDF atau Excel (Sheva Ramadhan)
router.get("/export/excel", checkPermission("export_pengabdian"), pengabdianController.exportExcel);
router.get("/export/pdf", checkPermission("export_pengabdian"), pengabdianController.exportPdf);

// GET READ Fitur Dosen dapat melihat detail data pengabdian (Athaya Nasywa Mahira)
router.get("/:id", checkPermission("view_pengabdian"), verifyOwnership, pengabdianController.getPengabdianById);

// POST UPDATE Fitur Dosen dapat mengubah data pengabdian (Sheva Ramadhan)
router.get("/:id/edit", checkPermission("edit_pengabdian"), verifyOwnership, pengabdianController.getViewFormUpdatePengabdian);
router.post("/:id/edit", checkPermission("edit_pengabdian"), verifyOwnership, pengabdianController.updatePengabdian);

// POST DELETE Fitur Dosen dapat menghapus data pengabdian (Sheva Ramadhan)
router.post("/:id/delete", checkPermission("delete_pengabdian"), verifyOwnership, pengabdianController.deletePengabdian);

// POST UPLOAD Fitur Dosen dapat mengupload laporan hasil pengabdian (Sheva Ramadhan)
router.get("/:id/upload", checkPermission("upload_laporan"), verifyOwnership, pengabdianController.getViewFormUploadLaporan);
router.post("/:id/upload", checkPermission("upload_laporan"), verifyOwnership, uploadLaporan.single("report_file"), pengabdianController.uploadLaporan);

// POST UPDATE Fitur Admin dapat menyetujui pengabdian
router.post("/:id/approve", checkPermission("manage_pengabdian"), pengabdianController.approvePengabdian);

// POST UPDATE Fitur Dosen dapat melakukan finalisasi pengajuan pengabdian (Sheva Ramadhan)
router.post("/:id/finalisasi", checkPermission("edit_pengabdian"), verifyOwnership, pengabdianController.finalizePengabdian);


// POST CREATE Fitur Dosen dapat menambahkan anggota pengabdian (Sheva Ramadhan)
router.post("/:csId/anggota", checkPermission("manage_anggota"), verifyOwnership, anggotaController.createAnggota);

// POST UPDATE Fitur Dosen dapat mengubah data anggota pengabdian (Sheva Ramadhan)
router.post("/:csId/anggota/:id/edit", checkPermission("manage_anggota"), verifyOwnership, anggotaController.updateAnggota);

// POST DELETE Fitur Dosen dapat menghapus anggota pengabdian (Sheva Ramadhan)
router.post("/:csId/anggota/:id/delete", checkPermission("manage_anggota"), verifyOwnership, anggotaController.deleteAnggota);

module.exports = router;
