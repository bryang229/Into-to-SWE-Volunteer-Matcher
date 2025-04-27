const { db, admin } = require('../firebase');
const cryptoJS = require("crypto-js");
const { get } = require('../routes/companyRoutes');

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
      listings: [],
      username_lowercase,
      createdAt: new Date()
    };

    await db.collection("companies").doc(uid).set(volunteerData);
    await admin.auth().setCustomUserClaims(uid, { accountType: "company" });

    res.status(201).json({ message: "Company registered", uid });
  } catch (err) {
    console.error("Error registering company:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


// POST /api/companies/update -> Update user details
const updateCompanyData = async(req, res) => {
  /*TODO: Use below logic to create protected data checking for limiting what can be updated  
    const allowedFields = [...];
    const updateData = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }
  */
  try{
    let updateData = req.body;
    let { uid } = req.user;
    // console.log("Got uid", uid);
    // console.log("Payload", updateData);
    await db.collection("companies").doc(uid).set(updateData, {merge: true});
    res.status(201).json({message: "Company data updated", uid});
  } catch(err){
    console.log(err.message);
    res.status(500).json({error: err.message});
  }
}

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
  checkUsername
};