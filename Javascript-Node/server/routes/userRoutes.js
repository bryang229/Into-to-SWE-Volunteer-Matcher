const express = require('express');
const router = express.Router();
const { verifySession } = require('../controllers/authController');
const {
    updateAccountSettings,
    deleteAccount
} = require('../controllers/userController');

// Update settings
router.post('/update', verifySession, updateAccountSettings);

// Delete account
router.post('/delete', verifySession, deleteAccount);

module.exports = router;