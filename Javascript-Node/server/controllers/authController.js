const { admin, db } = require('../firebase');

const sessionLogin = async (req, res) => {
  const { idToken } = req.body;
  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  try {
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });

    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedIdToken.uid;

    // Step 1: Check if accountType exists in custom claims
    let accountType = decodedIdToken.accountType;

    // Step 2: If missing, fallback to Firestore lookup
    if (!accountType) {
      const volunteerDoc = await db.collection("Volunteers").doc(uid).get();
      if (volunteerDoc.exists) {
        accountType = "volunteer";
      } else {
        const companyDoc = await db.collection("companies").doc(uid).get();
        if (companyDoc.exists) accountType = "company";
      }

      // Optionally: set custom claim now to avoid next time needing lookup
      if (accountType) {
        await admin.auth().setCustomUserClaims(uid, { accountType });
      }
    }

    if (!accountType) {
      return res.status(403).json({ error: "No matching user record found." });
    }

    // Set session + accountType cookies
    res.cookie('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: false, // set to true in prod
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    res.cookie('accountType', accountType, {
      maxAge: expiresIn,
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    res.status(200).json({ message: "Session established", accountType });

  } catch (error) {
    console.error("Session login failed:", error.message);
    res.status(401).json({ error: error.message });
  }
};
// Route controller to check if a username is already taken across both account types
const checkUsername = async (req, res) => {
  const { username } = req.query;

  // Validate input
  if (!username || username.trim() === "") {
    return res.status(400).json({ error: "Username is required" });
  }
  const username_lowercase = username.trim().toLowerCase();
  try {
    // Check if the username exists in the companies collection
    const snapshot_companies = await db
      .collection("companies")
      .where("username_lowercase", "==", username_lowercase)
      .limit(1)
      .get();

    // Check if the username exists in the volunteers collection
    const snapshot_volunteers = await db
      .collection("Volunteers") // Change to "Volunteers" if your DB uses uppercase
      .where("username_lowercase", "==", username_lowercase)
      .limit(1)
      .get();

    const isAvailable = snapshot_companies.empty && snapshot_volunteers.empty;

    return res.status(200).json({ available: isAvailable });
  } catch (err) {
    console.error("Error checking username:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

//Verifies cookie session
const verifySession = async (req, res, next) => {
  const sessionCookie = req.cookies.session || '';

  try {
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    
    // If accountType is missing, try to lookup and patch
    if (!decodedClaims.accountType) {
      const uid = decodedClaims.uid;

      let accountType = null;

      const volunteerDoc = await db.collection("Volunteers").doc(uid).get();
      if (volunteerDoc.exists) {
        accountType = "volunteer";
      } else {
        const companyDoc = await db.collection("companies").doc(uid).get();
        if (companyDoc.exists) accountType = "company";
      }

      // Set custom claim so it's correct in future sessions
      if (accountType) {
        await admin.auth().setCustomUserClaims(uid, { accountType });
        decodedClaims.accountType = accountType;
      }
    }
    
    req.user = decodedClaims; // Now you have uid and accountType
    console.log(req.user.accountType)
    next();
  } catch (err) {
    console.log('failed')
    res.status(401).json({ error: "Unauthorized" });
  }
};

// Returns user info for dashboard  
const getPersonalProfile = async (req, res) => {
  const { uid, accountType } = req.user;

  let profileDoc;
  let resolvedType = accountType;

  if (!accountType) {
    // For older accounts with no custom claim
    resolvedType = "volunteer";
    profileDoc = await db.collection("Volunteers").doc(uid).get();

    if (!profileDoc.exists) {
      profileDoc = await db.collection("companies").doc(uid).get();
      resolvedType = "company";

      if (!profileDoc.exists) {
        console.log("Error: user not found");
        return res.status(404).json({ error: "User not found" });
      }
    }
  } else {
    // Newer users with accountType claim
    const collection = accountType === "volunteer" ? "Volunteers" : "companies";
    profileDoc = await db.collection(collection).doc(uid).get();

    if (!profileDoc.exists) {
      console.log("Error: user not found");
      return res.status(404).json({ error: "User not found" });
    }
  }

  res.json({
    uid,
    accountType: resolvedType,
    ...profileDoc.data()
  });
};

const logout = (req, res) => {
  try {
    res.clearCookie("session", {
      httpOnly: false, // match how you set it earlier
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
    return res.status(200).json({ message: "Logged out" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to logout" });
  }
};


module.exports = {
  sessionLogin,
  checkUsername,
  verifySession,
  getPersonalProfile,
  logout
};