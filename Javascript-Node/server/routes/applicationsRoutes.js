const express = require('express');
const router = express.Router();
const {
    apply,
    getApplicationData,
    editApplicationData,
    getApplicants,
    requestAccess,
    updateStatus,
    revealInfo
} = require('../controllers/applicationsController');
const { verifySession } = require("../controllers/authController")
//Returns all listings
// GET /applications/apply
router.post("/apply", verifySession, apply);
//GET /api/applications/application-data?applicationId=...
router.get('/application-data', getApplicationData);
//PATCH /api/applications/application-data?applicationId=...
router.patch('/application-data', verifySession, editApplicationData);
//GET /api/applications/by-listing?listingId=...
router.get("/by-listing", getApplicants);
//POST /api/applications/request-access
router.post("/request-access", verifySession, requestAccess);
//PATCH /api/applications/status
router.patch("/status", verifySession, updateStatus);
//POST /api/applications/reveal-info
router.post("/reveal-info", verifySession, revealInfo);


module.exports = router;
