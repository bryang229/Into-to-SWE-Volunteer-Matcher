const express = require('express');
const router = express.Router();
const { apply } = require('../controllers/applicationsController');
const { verifySession } = require("../controllers/authController")
//Returns all listings
// GET /applications/apply
router.post("/applications/apply", verifySession, apply);



module.exports = router;
