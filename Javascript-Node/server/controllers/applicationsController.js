const { db } = require('../firebase');

async function apply (req, res) {
    const { listingId, answers } = req.body;
    const user = req.user;
  
    if (!listingId || !answers || !user?.uid) {
      return res.status(400).json({ error: "Missing required data" });
    }
  
    await db.collection("Applications").add({
      listingId,
      applicantUid: user.uid,
      answers,
      submittedAt: new Date().toISOString()
    });
  
    res.status(201).json({ message: "Application received" });
};

module.exports = {
    apply
}