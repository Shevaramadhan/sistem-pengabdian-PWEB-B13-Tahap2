const express = require("express");
const router = express.Router();
const apiController = require("../controllers/apiController");
const { isAuthenticated } = require("../middlewares/auth");

// RestAPI: Dosen dapat mengambil daftar pengabdian melalui RestAPI (Format JSON)
// Penanggung Jawab: Sheva Ramadhan
router.get("/pengabdian", isAuthenticated, apiController.getPengabdian);

// RestAPI: Dosen dapat mengambil daftar undangan keanggotaan melalui RestAPI (Format JSON)
// Penanggung Jawab: Athaya Nasywa Mahira
router.get("/undangan", isAuthenticated, apiController.getUndangan);

module.exports = router;
