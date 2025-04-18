const { db } = require('../firebase');
const cryptoJS = require("crypto-js");

const registerVolunteer = async (req, res) => {
  const { username, fullname, email, password } = req.body;
  try {
    const existingUserSnap = await db.collection('Volunteers').where("username", "==", username).get();
    if (!existingUserSnap.empty) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const hashedEmail = cryptoJS.SHA256(email).toString();
    const hashedPassword = cryptoJS.SHA256(password).toString();

    const volunteerData = { username, fullname, hashedEmail, hashedPassword };
    const ref = await db.collection("Volunteers").add(volunteerData);
    res.status(201).json({ message: "Volunteer registered", id: ref.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const getVolunteers = async (req, res) => {
  try {
    const snapshot = await db.collection('Volunteers').get();
    const volunteers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(volunteers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getVolunteerByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const snapshot = await db.collection('Volunteers').where("username", "==", username).get();
    if (snapshot.empty) {
      return res.status(404).json({ error: "Volunteer not found" });
    }
    const doc = snapshot.docs[0];
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const checkUsername = async (req, res) => {
  console.log("checking username");
  const { username } = req.query;
  if (!username || username.trim() === "") {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const snapshot = await db.collection("Volunteers").where("username", "==", username).limit(1).get();
    res.json({ available: snapshot.empty });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



module.exports = {
  registerVolunteer,
  getVolunteers,
  getVolunteerByUsername,
  checkUsername
};