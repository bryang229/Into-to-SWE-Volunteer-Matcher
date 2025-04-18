const { db } = require('../firebase');
const cryptoJS = require("crypto-js");

// POST /api/volunteers/register
const registerVolunteer = async (req, res) => {
  // Get info from body of request
  const { username, fullname, email, password } = req.body;
  try {
    // Check if username is used - might be redundant 
    const existingUserSnap_vol = await db.collection('Volunteers').where("username", "==", username).get();
    const existingUserSnap_comp = await db.collection('companies').where("username", "==", username).get();
    if (!existingUserSnap_vol.empty || !existingUserSnap_comp.empty) {
      return res.status(409).json({ error: "Username already exists" });
    }
    //adding this to remove case sensitive username checks
    const username_lowercase = username.trim().toLowerCase();

    // Hash email to send to database
    const hashedEmail = cryptoJS.SHA256(email).toString();
    // Set up json
    const volunteerData = {
      username,
      fullname,
      hashedEmail,
      username_lowercase,
      createdAt: new Date()
    };
    // Send to database
    const ref = await db.collection("Volunteers").add(volunteerData);
    res.status(201).json({ message: "Volunteer registered", id: ref.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/volunteers -> returns all volunteers, should be removed when not testing (production)
const getVolunteers = async (req, res) => {
  try {
    const snapshot = await db.collection('Volunteers').get();
    const volunteers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(volunteers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
//GET /api/volunteers/:username_to_lookup 
const getVolunteerByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const username_lowercase = username.trim().toLowerCase();

    const snapshot = await db.collection('Volunteers').where("username_lowercase", "==", username_lowercase).get();
    if (snapshot.empty) {
      return res.status(404).json({ error: "Volunteer not found" });
    }
    const doc = snapshot.docs[0];
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
//GET /api/volunteers/check-username?username=username_to_lookup -> checks if that username is used
const checkUsername = async (req, res) => {
  console.log("checking username");
  const { username } = req.query;
  if (!username || username.trim() === "") {
    return res.status(400).json({ error: "Username is required" });
  }
  const username_lowercase = username.trim().toLowerCase();

  try {
    const snapshot = await db.collection("Volunteers").where("username_lowercase", "==", username_lowercase).limit(1).get();
    res.json({ available: snapshot.empty });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


//Export functions so they can be used in routers to link the function to the route!
module.exports = {
  registerVolunteer,
  getVolunteers,
  getVolunteerByUsername,
  checkUsername
};