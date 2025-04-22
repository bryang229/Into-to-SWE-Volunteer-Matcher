const express = require('express');
const router = express.Router();
const { sessionLogin,
        checkUsername,
        verifySession,
        getPersonalProfile,
        logout
    } = require('../controllers/authController');

//Login user, get session cookie
//GET /api/sessionLogin
router.post('/sessionLogin', sessionLogin);
//GET /api/check-username?username=query
router.get('/check-username', checkUsername);
//GET /api/sessionVerify
router.get('/sessionVerify', verifySession, (req, res) => {
    const { uid, accountType } = req.user;
    res.status(200).json({ uid, accountType });
    console.log(accountType)
  });
// GET /api/auth/me
router.get('/me', verifySession, getPersonalProfile);

//GET /api/logout
router.post('/logout', logout);

module.exports = router;