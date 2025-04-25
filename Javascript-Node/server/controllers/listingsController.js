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

const getListingData = async (req, res) => {
  try {
    const { listingId } = req.body;
    // console.log("Requested listing ID:", listingId);
    const snapshot = await db.collection('Listings').doc(listingId).get();

    if (!snapshot.exists) {
      return res.status(404).json({ error: "Listing not found" });
    }

    return res.status(200).json({ id: snapshot.id, ...snapshot.data() });

  } catch (err) {
    console.error("Error fetching listing:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
const createListing = async (req, res) => {
  try {
    const user = req.user; 
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Unauthorized: no user in session" });
    }

    const data = req.body;
    const listingWithUID = {
      ...data,
      creatorUid: user.uid,           // <- new field
      active: true,
      createdAt: new Date().toISOString()  // (optional) timestamp
    };

    await db.collection('Listings').add(listingWithUID);
    res.status(201).json({ message: 'Listing created' });
  } catch (err) {
    console.error('Error creating listing:', err);
    res.status(500).json({ error: 'Failed to create listing' });
  }
};
module.exports = {
  getListings,
  getListingData,
  createListing,
};
