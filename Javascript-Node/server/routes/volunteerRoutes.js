const express = require('express');
const router = express.Router();
const { getVolunteers, getVolunteerByUsername, registerVolunteer, updateVolunteerData, checkUsername } = require('../controllers/volunteerController');
const { verifySession } = require('../controllers/authController');

//returns all volunteers (unsafe only for testing should be removed if ever published)
//GET /api/volunteers/
router.get('/', getVolunteers);
//signs up new volunteer account
//POST /api/volunteers/register
router.post('/register', registerVolunteer);
//POST /api/volunteers/update
router.post('/update', verifySession, updateVolunteerData);
//check if volunteer username used (TODO: make so check-username works by check if company/volunteer username is taken)
//GET /api/volunteers/check-username?username=username_to_lookup
router.get('/check-username', checkUsername);
//searches for that specific username
//GET /api/volunteers/:username_to_lookup 
//moved to avoid bugs: it is greedy and takes over routes it's above!
router.get('/:username', getVolunteerByUsername);

module.exports = router;