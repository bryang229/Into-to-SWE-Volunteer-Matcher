const express = require('express');
const router = express.Router();
const { getListings } = require('../controllers/listingsController');

//Returns all listings
// GET /api/listings
router.get('/', getListings);


module.exports = router;