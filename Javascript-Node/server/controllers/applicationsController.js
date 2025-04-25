const { db, admin } = require('../firebase');

async function apply (req, res) {
  const { listingId, answers } = req.body;
  const user = req.user;

  if (!listingId || !answers || !user?.uid) {
    return res.status(400).json({ error: "Missing required data" });
  }

  // Double submission check
  const existingSnap = await db.collection("Applications")
    .where("listingId", "==", listingId)
    .where("applicantUid", "==", user.uid)
    .limit(1)
    .get();

  if (!existingSnap.empty) {
    return res.status(409).json({
      error: "You have already applied to this listing.",
      applicationId: existingSnap.docs[0].id
    });
  }

  // Proceed with submission
  const newAppRef = await db.collection("Applications").add({
    listingId,
    applicantUid: user.uid,
    answers,
    submittedAt: new Date().toISOString(),
    status: "Waiting for Review"
  });

  // Update volunteer profile
  await db.collection("volunteers").doc(user.uid).set({
    applications: admin.firestore.FieldValue.arrayUnion({
      listingId,
      applicationId: newAppRef.id
    })
  }, { merge: true });

  res.status(201).json({ message: "Application submitted", id: newAppRef.id });
};

module.exports = {
    apply
}