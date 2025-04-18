const express = require('express');
const router = express.Router();
const { sessionLogin } = require('../controllers/authController');

//Login user, get session cookie
//GET /api/sessionLogin
router.post('/sessionLogin', sessionLogin);

module.exports = router;