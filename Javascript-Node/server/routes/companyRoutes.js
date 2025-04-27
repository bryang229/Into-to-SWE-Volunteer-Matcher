const express = require('express');
const router = express.Router();
const {
    registerCompany,
    updateCompanyData,
    getListings,
    checkUsername
} = require('../controllers/companyController');
const { verifySession } = require('../controllers/authController');

//sign up new company: POST /api/company/register
router.post('/register', registerCompany);
//POST /api/company/update
router.post('/update', verifySession, updateCompanyData);

//GET /api/company/my-listings
router.get("/my-listings", verifySession, getListings);

//check if company username used (TODO: make so check-username works by check if company/volunteer username is taken)
//GET /api/company/check-username?username=username_to_lookup
router.get('/check-username', checkUsername);



module.exports = router;