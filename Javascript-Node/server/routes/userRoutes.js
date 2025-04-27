const express = require('express');
const router = express.Router();
const { verifySession } = require('../controllers/authController');
const { getProfile, updateProfile, deleteAccount } = require('../controllers/userController');

router.get('/settings', verifySession, getProfile);
router.post('/update', verifySession, updateProfile);
router.delete('/delete', verifySession, deleteAccount);

module.exports = router;
