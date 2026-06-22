const express = require("express");
const router = express.Router();
const indexController = require("../controllers/indexController");
const pengabdianController = require("../controllers/pengabdianController");
const { isAuthenticated } = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/acl");

/* GET home page. */
router.get("/", indexController.index);

// GET READ Fitur Dosen dapat melihat dashboard pengabdian (Athaya Nasywa Mahira)
router.get("/home", isAuthenticated, indexController.home);

router.get("/login", indexController.loginPage);
router.post("/login", indexController.login);
router.get("/logout", indexController.logout);

module.exports = router;
