const { db, admin } = require('../firebase');

async function apply(req, res) {
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
  await db.collection("Volunteers").doc(user.uid).set({
    applications: admin.firestore.FieldValue.arrayUnion({
      listingId,
      applicationId: newAppRef.id
    })
  }, { merge: true });

  res.status(201).json({ message: "Application submitted", id: newAppRef.id });
};

const getApplicationData = async (req, res) => {
  try {
    const { applicationId } = req.query;
    // console.log("Requested listing ID:", listingId);
    const snapshot = await db.collection('Applications').doc(applicationId).get();

    if (!snapshot.exists) {
      return res.status(404).json({ error: "Application not found" });
    }

    return res.status(200).json({ id: snapshot.id, ...snapshot.data() });

  } catch (err) {
    console.error("Error fetching listing:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

const editApplicationData = async (req, res) => {
  const { applicationId } = req.query;
  const { answers, edited } = req.body;
  const user = req.user;

  if (!applicationId || !answers) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const docRef = db.collection("Applications").doc(applicationId);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    return res.status(404).json({ error: "Application not found" });
  }

  const app = snapshot.data();
  if (app.applicantUid !== user.uid) {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  if (app.status !== "Waiting for Review") {
    return res.status(400).json({ error: "Cannot edit this application anymore." });
  }

  const editDate = new Date().toISOString();

  await docRef.update({
    answers,
    edited: edited === true,
    updatedAt: editDate,
    editHistory: admin.firestore.FieldValue.arrayUnion(editDate)
  });

  res.status(200).json({ message: "Application updated successfully" });

};
//GET /api/applications/by-listing?listingId=...
async function getApplicants(req, res) {
  const { listingId } = req.query;
  const snapshot = await db.collection("Applications")
    .where("listingId", "==", listingId)
    .get();

  const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.status(200).json(results);
};

const requestAccess = async (req, res) => {
  const { applicationId, field } = req.body;
  const user = req.user;

  if (!applicationId || !field) {
    return res.status(400).json({ error: "Missing data." });
  }

  const appRef = db.collection("Applications").doc(applicationId);
  await appRef.update({
    accessRequests: admin.firestore.FieldValue.arrayUnion({
      requestedBy: user.uid,
      field,
      requestedAt: new Date().toISOString()
    })
  });

  res.status(200).json({ message: "Access request submitted." });
};

const updateStatus = async (req, res) => {
  const { applicationId, newStatus } = req.body;
  const user = req.user;

  if (!applicationId || !newStatus) {
    return res.status(400).json({ error: "Missing data" });
  }

  const docRef = db.collection("Applications").doc(applicationId);
  const doc = await docRef.get();

  if (!doc.exists) return res.status(404).json({ error: "Application not found" });

  const data = doc.data();
  const listingDoc = await db.collection("Listings").doc(data.listingId).get();
  if (!listingDoc.exists) return res.status(404).json({ error: "Related listing not found" });

  const listingData = listingDoc.data();
  if (listingData.creatorUid !== user.uid) {
    return res.status(403).json({ error: "Not authorized to modify this application" });
  }

  await docRef.update({
    status: newStatus,
    statusHistory: admin.firestore.FieldValue.arrayUnion({
      updatedBy: user.uid,
      newStatus,
      updatedAt: new Date().toISOString()
    })
  });

  res.status(200).json({ message: "Status updated" });
};

module.exports = {
  apply,
  getApplicationData,
  editApplicationData,
  getApplicants,
  requestAccess,
  updateStatus
}