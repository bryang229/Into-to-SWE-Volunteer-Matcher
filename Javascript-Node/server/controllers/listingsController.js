const { db } = require('../firebase');

// GET all listings
const getListings = async (req, res) => {
  console.log("get listings called -> debug only");
  try {
    const snapshot = await db.collection('Listings').get();
    const listings = snapshot.empty
      ? []
      : snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.error(err);
  }
};

const createListing = async (req, res) => {
  try {
    const data = req.body;
    await db.collection('Listings').add(data);
    res.status(201).json({ message: 'Listing created' });
  } catch (err) {
    console.error('Error creating listing:', err);
    res.status(500).json({ error: 'Failed to create listing' });
  }
};

module.exports = {
  getListings,
  createListing,
};
