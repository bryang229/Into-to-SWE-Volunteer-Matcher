const express = require('express');
const router = express.Router();
const { sessionLogin,
        checkUsername,
        verifySession,
        getUserInfo,
        getPersonalProfile,
        searchUsers,
        getPublicProfile,
        getVolunteerProfile,
        getCompanyProfile,
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
// GET /api/me
router.get('/me', verifySession, getPersonalProfile);
// GET /api/search?query=...
router.get('/search', verifySession, searchUsers);
// GET /api/public-profile
router.get('/public-profile', getPublicProfile);
//GET /api/volunteer-profile?=...
router.get('/volunteer-profile', getVolunteerProfile);
//GET /api/company-profile?=...
router.get('/company-profile', getCompanyProfile);
//GET /api/logout
router.post('/logout', logout);

module.exports = router;