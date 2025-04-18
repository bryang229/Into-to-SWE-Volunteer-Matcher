const { db } = require('../firebase');
const cryptoJS = require("crypto-js");

const registerCompany = async (req, res) => {
  const { uid, username, companyName, publicEmail, privateEmail, companyBio, admin_fullname } = req.body;
  try {
    const existingSnap = await db.collection('companies').where("username", "==", username).get();
    if (!existingSnap.empty) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const hashedEmail = cryptoJS.SHA256(privateEmail).toString();
    const data = {
      companyName,
      admin_fullname,
      username,
      publicEmail,
      companyBio,
      hashedEmail,
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

  try {
    const snapshot = await db.collection("companies").where("username", "==", username).limit(1).get();
    res.json({ available: snapshot.empty });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  registerCompany,
  checkUsername
};