// server/firebase.js
require("dotenv").config();
const admin = require("firebase-admin");
const path = require("path");

admin.initializeApp({
  credential: admin.credential.cert(
    require(path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS))
  ),
});

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };