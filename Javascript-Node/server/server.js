// Importing dependencies 
const express = require('express');
const path = require('path');
const { db, admin, auth } = require("./firebase"); //Loads firebase.js to authenticate our session using our key
const cryptoJS = require("crypto-js");
const cookieParser = require("cookie-parser");

//Setting up app
const app = express(); // Creating app object
app.use(express.static(path.join(__dirname, '../public'))); //Connecting frontend
app.use(express.json());
app.use(cookieParser())

//Redirects root route to home page
app.get('/', (req, res) => {
  res.redirect('/templates/index.html'); // Redirect to the desired static page
});

//GET all volunteers
app.get('/api/volunteers', async (req, res) => {
  try {
    const snapshot = await db.collection('Volunteers').get();
    const volunteers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(volunteers);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.error(err);
  }
});

//GET all companies
app.get('/api/companies', async (req, res) => {
  try {
    const snapshot = await db.collection('companies').get();
    const companies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.error(err);
  }
});

//GET all listings
app.get("/api/listings", async (req, res) => {
  console.log("get listings called -> debug only");
  try {
    const snapshot = await db.collection('Listings').get();
    const listings = snapshot.empty ? [] :
  snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.error(err);
  }
});

//GET specific volunteer by username
app.get("/api/volunteers/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const snapshot = await db.collection('Volunteers')
                             .where("username", "==", username)
                             .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "Volunteer not found" });
    }

    const doc = snapshot.docs[0];
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check if a username is already taken
app.get('/api/check-username', async (req, res) => {
  const { username } = req.query;

  if (!username || username.trim() === "") {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const snapshot = await db.collection("Volunteers")
                             .where("username", "==", username)
                             .limit(1)
                             .get();

    if (!snapshot.empty) {
      return res.json({ available: false });
    }

    res.json({ available: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new user
app.post('/api/register/volunteer', async (req, res) => {
  const { username, fullname, email, password } = req.body;

  try {
    // Check for duplicate usernames
    const existingUserSnap = await db.collection('Volunteers')
                                     .where("username", "==", username)
                                     .get();

    if (!existingUserSnap.empty) {
      return res.status(409).json({ error: "Username already exists" });
    }

    // Hash sensitive info
    const hashedEmail = cryptoJS.SHA256(email).toString();
    const hashedPassword = cryptoJS.SHA256(password).toString();

    const volunteerData = {
      username,
      fullname,
      hashedEmail,
      hashedPassword,
      // The rest can be filled out later
    };

    const ref = await db.collection("Volunteers").add(volunteerData);
    res.status(201).json({ message: "Volunteer registered", id: ref.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Company register
app.post("/api/register/company", async (req, res) => {
  const { uid, email, companyName, admin_fullname, username, publicEmail, privateEmail, companyBio } = req.body;

  try {
    // Check for duplicate username
    const existingUserSnap = await db.collection("companies")
                                     .where("username", "==", username)
                                     .get();

    if (!existingUserSnap.empty) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const companyData = {
      companyName,
      admin_fullname,
      username,
      publicEmail: publicEmail || null,
      companyBio: companyBio || "",
      hashedEmail: cryptoJS.SHA256(privateEmail).toString(),
      createdAt: new Date()
    };

    await db.collection("companies").doc(uid).set(companyData);

    res.status(201).json({ message: "Company registered", uid });
  } catch (err) {
    console.error("Error registering company:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Helper: Set a cookie with the Firebase session token
async function setSessionCookie(idToken, res) {
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
  const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });

  const options = {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
  };

  res.cookie('session', sessionCookie, options);
}

// POST /api/sessionLogin
app.post('/api/sessionLogin', async (req, res) => {
  console.log("Raw request body:", req.body);
  const { idToken } = req.body;
  console.log("Received ID token:", idToken);
  if (!idToken) {
    return res.status(400).send({ error: "ID token missing from request" });
  }
  try {
      await setSessionCookie(idToken, res);
      res.status(200).send({ message: 'Login successful' });
  } catch (error) {
      res.status(401).send({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

