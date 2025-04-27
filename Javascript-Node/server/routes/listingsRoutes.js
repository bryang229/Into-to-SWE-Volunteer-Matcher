const express = require('express');
const router = express.Router();
const { getListings, getListingData, createListing } = require('../controllers/listingsController');
const { verifySession } = require("../controllers/authController")
//Returns all listings
// GET /api/listings
router.get('/', getListings);

// POST /api/listings/create-listing
router.post('/create-listing',verifySession, createListing);

// POST /api/listings/listing-data (gets listing data from DB)
router.get('/listing-data',getListingData);


module.exports = router;