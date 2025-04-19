const express = require('express');
const router = express.Router();
const { sessionLogin, checkUsername, logout } = require('../controllers/authController');

//Login user, get session cookie
//GET /api/sessionLogin
router.post('/sessionLogin', sessionLogin);
//GET /api/check-username?username=query
router.get('/check-username', checkUsername);
//GET logout
router.post('/logout', logout); 

module.exports = router;