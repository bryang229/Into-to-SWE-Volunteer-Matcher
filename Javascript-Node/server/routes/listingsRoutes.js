const express = require('express');
const router = express.Router();
const { getListings, createListing } = require('../controllers/listingsController');

//Returns all listings
// GET /api/listings
router.get('/', getListings);

router.post('/create-listing', createListing);


module.exports = router;