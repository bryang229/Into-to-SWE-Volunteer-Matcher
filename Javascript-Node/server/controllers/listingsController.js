const { db } = require('../firebase');

//GET all listings
const getListings = async (req, res) => {
    console.log("get listings called -> debug only");
    try {
      const snapshot = await db.collection('Listings').get();
      const listings = snapshot.empty ? [] :
    snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(listings);
    } catch (err) {
      res.status(500).json({ error: err.message });
      console.error(err);
    }
}

module.exports = {
    getListings
}