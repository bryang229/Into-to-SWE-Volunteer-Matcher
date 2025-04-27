const express = require('express');
const router = express.Router();
const {
    registerCompany,
    updateCompanyData,
    getListings,
    checkIfApplicant,
    inviteVolunteer,
    getCompanyInvitesSent,
    getInvitesForVolunteer,
    checkUsername
} = require('../controllers/companyController');
const { verifySession } = require('../controllers/authController');

// Company registration
router.post('/register', registerCompany);
router.post('/update', verifySession, updateCompanyData);

// Listings
router.get('/my-listings', verifySession, getListings);

// Applications and Invites
router.get('/checkIfApplicant', verifySession, checkIfApplicant);
// Invite volunteer to a listing
router.post('/invite-volunteer', verifySession, inviteVolunteer);

// Add this NEW route
router.get('/invites-sent', verifySession, getCompanyInvitesSent);

// (Optional already exists) Get invites for a specific volunteer
router.get('/invites-for-volunteer', verifySession, getInvitesForVolunteer);

// Username Check
router.get('/check-username', checkUsername);

module.exports = router;