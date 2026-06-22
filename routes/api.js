const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const { isAuthenticated } = require('../middlewares/auth');

router.use(isAuthenticated);

// GET READ Fitur Dosen dapat mengambil daftar pengabdian melalui RestAPI (Sheva Ramadhan)
router.get('/pengabdian', apiController.getPengabdian);

// GET READ Fitur Dosen dapat mengambil daftar undangan keanggotaan melalui RestAPI (Athaya Nasywa Mahira)
router.get('/undangan', apiController.getUndangan);

module.exports = router;
