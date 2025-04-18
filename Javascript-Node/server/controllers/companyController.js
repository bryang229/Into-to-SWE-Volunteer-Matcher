const { db } = require('../firebase');
const cryptoJS = require("crypto-js");

const registerCompany = async (req, res) => {
  const { uid, username, companyName, publicEmail, privateEmail, companyBio, admin_fullname } = req.body;
  try {
    // Check if username is used - might be redundant 
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
      username_lowercase,
      createdAt: new Date()
    };

    await db.collection('companies').doc(uid).set(data);
    res.status(201).json({ message: "Company registered", uid });
  } catch (err) {
    console.error("Error registering company:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

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
  checkUsername
};