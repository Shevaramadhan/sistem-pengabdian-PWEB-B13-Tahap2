const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// 1. Konfigurasi Cloudinary (Jika di production/ada API Key)
let useCloudinary = false;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  useCloudinary = true;
}

// ---------------------------------------------------------
// STORAGE UNTUK LAPORAN AKHIR
// ---------------------------------------------------------
let storageLaporan;

if (useCloudinary) {
  storageLaporan = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "pengabdian_laporan",
      resource_type: "raw", // Gunakan 'raw' untuk PDF, DOC, Excel agar aman
      public_id: (req, file) => `laporan_${req.params.id}_${Date.now()}_${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
    },
  });
} else {
  // Fallback Local
  const uploadDir = path.join(__dirname, "../public/uploads/laporan");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  storageLaporan = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase();
      cb(null, `laporan_${req.params.id}_${Date.now()}${ext}`);
    },
  });
}

const fileFilterLaporan = (req, file, cb) => {
  const allowed = [".pdf", ".doc", ".docx", ".xlsx", ".xls"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Format file tidak didukung. Gunakan PDF, DOC, DOCX, XLS, atau XLSX."), false);
  }
};

const uploadLaporan = multer({
  storage: storageLaporan,
  fileFilter: fileFilterLaporan,
  limits: { fileSize: 10 * 1024 * 1024 }, // Maks 10 MB
});

// ---------------------------------------------------------
// STORAGE UNTUK PROPOSAL
// ---------------------------------------------------------
let storageProposal;

if (useCloudinary) {
  storageProposal = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "pengabdian_proposal",
      resource_type: "raw", 
      public_id: (req, file) => `proposal_${Date.now()}_${Math.round(Math.random() * 1e9)}.pdf`
    },
  });
} else {
  // Fallback Local
  const proposalDir = path.join(__dirname, "../public/uploads/proposals");
  if (!fs.existsSync(proposalDir)) {
    fs.mkdirSync(proposalDir, { recursive: true });
  }
  storageProposal = multer.diskStorage({
    destination: (req, file, cb) => cb(null, proposalDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `proposal_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`);
    },
  });
}

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
