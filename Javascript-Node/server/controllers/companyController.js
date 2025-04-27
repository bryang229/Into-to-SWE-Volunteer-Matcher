const { db, admin } = require('../firebase');
const cryptoJS = require("crypto-js");

// Company registration
const registerCompany = async (req, res) => {
  const { uid, username, companyName, publicEmail, privateEmail, companyBio, admin_fullname } = req.body;
  try {
    const existingUserSnap_vol = await db.collection('Volunteers').where("username", "==", username).get();
    const existingUserSnap_comp = await db.collection('companies').where("username", "==", username).get();
    if (!existingUserSnap_vol.empty || !existingUserSnap_comp.empty) {
      return res.status(409).json({ error: "Username already exists" });
    }
    const username_lowercase = username.trim().toLowerCase();
    const hashedEmail = cryptoJS.SHA256(privateEmail).toString();
    const data = {
      companyName,
      admin_fullname,
      username,
      publicEmail,
      companyBio,
      hashedEmail,
      listings: [],
      username_lowercase,
      createdAt: new Date()
    };

    await db.collection("companies").doc(uid).set(data);
    await admin.auth().setCustomUserClaims(uid, { accountType: "company" });

    res.status(201).json({ message: "Company registered", uid });
  } catch (err) {
    console.error("Error registering company:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update company profile
const updateCompanyData = async (req, res) => {
  try {
    let updateData = req.body;
    let { uid } = req.user;
    await db.collection("companies").doc(uid).set(updateData, { merge: true });
    res.status(201).json({ message: "Company data updated", uid });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: err.message });
  }
};

// Get listings created by this company
const getListings = async (req, res) => {
  const user = req.user;
  if (!user || !user.uid) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const snapshot = await db.collection("Listings")
    .where("creatorUid", "==", user.uid)
    .get();

  const myListings = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  res.status(200).json(myListings);
};

// Invite a volunteer to a listing
async function inviteVolunteer(req, res) {
  const { volunteerUid, listingId } = req.query;
  const companyUid = req.user.uid;

  if (!volunteerUid || !listingId) {
    return res.status(400).json({ error: 'Missing volunteerUid or listingId' });
  }

  try {
    const existingInviteSnap = await db.collection('VolunteerInvitations')
      .where('volunteerUid', '==', volunteerUid)
      .where('companyUid', '==', companyUid)
      .where('listingId', '==', listingId)
      .limit(1)
      .get();

    if (!existingInviteSnap.empty) {
      return res.status(409).json({ error: 'This volunteer was already invited to this listing.' });
    }

    const listingSnap = await db.collection('Listings').doc(listingId).get();
    if (!listingSnap.exists) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const listingData = listingSnap.data();

    await db.collection('VolunteerInvitations').add({
      volunteerUid,
      companyUid,
      listingId,
      listingTitle: listingData.title || 'Untitled Listing',
      status: 'Pending',
      sentAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(201).json({ message: 'Invite sent successfully' });

  } catch (err) {
    console.error('Invite error:', err);
    res.status(500).json({ error: 'Failed to send invite' });
  }
}

// Fetch all invites this company has sent
async function getCompanyInvitesSent(req, res) {
  const companyUid = req.user?.uid;
  if (!companyUid) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const snapshot = await db.collection('VolunteerInvitations')
      .where('companyUid', '==', companyUid)
      .orderBy('sentAt', 'desc')  // This still requires an index
      .get();

    if (snapshot.empty) {
      return res.json([]); // Return empty array cleanly
    }

    const invites = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(invites);
  } catch (err) {
    console.error('Fetch invites error:', err);
    res.status(500).json({ error: 'Failed to fetch invites' });
  }
}

// Fetch invites for a specific volunteer from this company
const getInvitesForVolunteer = async (req, res) => {
  const { uid } = req.query;
  if (!uid) return res.status(400).json({ error: 'Missing UID' });

  const companyUid = req.user?.uid;
  if (!companyUid) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const snapshot = await db.collection('VolunteerInvitations')
      .where('volunteerUid', '==', uid)
      .where('companyUid', '==', companyUid)
      .orderBy('sentAt', 'desc')
      .get();

    if (snapshot.empty) {
      return res.json([]); // <-- fallback: just return empty array cleanly
    }

    const invites = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(invites);
  } catch (err) {
    console.error('Error fetching invites:', err);
    res.status(500).json({ error: 'Failed to fetch invites' });
  }
};

// Check if the volunteer applied to this company's listings
async function checkIfApplicant(req, res) {
  const { uid } = req.query;
  if (!uid) return res.status(400).json({ error: 'Missing uid' });

  const companyUid = req.user.uid;

  try {
    const volunteerSnap = await db.collection('Volunteers').doc(uid).get();
    if (!volunteerSnap.exists) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }

    const volunteerData = volunteerSnap.data();
    if (!Array.isArray(volunteerData.applications)) {
      return res.json([]);
    }

    const matchingApplications = [];

    for (const app of volunteerData.applications) {
      const appSnap = await db.collection('Applications').doc(app.applicationId).get();
      if (!appSnap.exists) continue;

      const appData = appSnap.data();
      const listingSnap = await db.collection('Listings').doc(app.listingId).get();
      if (!listingSnap.exists) continue;

      const listingData = listingSnap.data();

      if (listingData.creatorUid === companyUid) {
        matchingApplications.push({
          applicationId: app.applicationId,
          listingTitle: listingData.title || 'Untitled',
          status: appData.status || 'Unknown'
        });
      }
    }

    res.json(matchingApplications);

  } catch (err) {
    console.error('Error checking applications:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Check if username is taken
const checkUsername = async (req, res) => {
  const { username } = req.query;
  if (!username || username.trim() === "") {
    return res.status(400).json({ error: "Username is required" });
  }
  const username_lowercase = username.trim().toLowerCase();

  try {
    const snapshot = await db.collection("companies").where("username_lowercase", "==", username_lowercase).limit(1).get();
    res.json({ available: snapshot.empty });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  registerCompany,
  updateCompanyData,
  getListings,
  checkIfApplicant,
  inviteVolunteer,
  getCompanyInvitesSent,
  getInvitesForVolunteer,
  checkUsername
};