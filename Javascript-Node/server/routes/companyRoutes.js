const express = require('express');
const router = express.Router();
const { registerCompany, checkUsername } = require('../controllers/companyController');

//sign up new company: POST /api/company/register
router.post('/register', registerCompany);
//check if company username used (TODO: make so check-username works by check if company/volunteer username is taken)
//GET /api/company/check-username?username=username_to_lookup
router.get('/check-username', checkUsername);


module.exports = router;