const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");

// Pastikan folder uploads ada
const uploadDir = path.join(__dirname, "../public/uploads/laporan");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Format: laporan_<csId>_<timestamp>.<ext>
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `laporan_${req.params.id}_${Date.now()}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [".pdf", ".doc", ".docx", ".xlsx", ".xls"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Format file tidak didukung. Gunakan PDF, DOC, DOCX, XLS, atau XLSX."), false);
  }
};

const uploadLaporan = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // Maks 10 MB
});


// --- Proposal Upload ---
const proposalDir = path.join(__dirname, "../public/uploads/proposals");
if (!fs.existsSync(proposalDir)) {
  fs.mkdirSync(proposalDir, { recursive: true });
}

const storageProposal = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, proposalDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `proposal_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const uploadProposal = multer({
  storage: storageProposal,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Format proposal harus PDF."), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = { uploadLaporan, uploadProposal };

