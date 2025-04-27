const { admin, db } = require('../firebase');
const cryptoJS = require('crypto-js');
const sha256 = input => cryptoJS.SHA256(input).toString();

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
        console.log('Verifying session cookie:', sessionCookie);
        const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
        req.user = decodedClaims; // Attach user info to the request
        console.log('Session verified for user:', decodedClaims.uid);
        next();
    } catch (err) {
        console.error('Session verification failed:', err.message);
        res.status(401).json({ error: 'Unauthorized' });
    }
};




//Checks if there's a cookie session active and let's the next know, with NO fail state if their not logged in
const verifySessionIfAvailable = async (req, res, next) => {
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
    console.log(req.user.accountType, "verify session end")
    next();
  } catch (err) {
    console.log('No cookie session found');
    req.user = null;
    next();
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

async function searchUsers(req, res) {
  const q = (req.query.query || '').trim().toLowerCase();
  if (!q) {
    return res.json([]); // no query, return empty
  }
  console.log(q)
  try {
    // 1️ Search volunteers by username_lowercase
    const volSnap = await db.collection('Volunteers')
      .where('username_lowercase', '>=', q)
      .where('username_lowercase', '<=', q + '\uf8ff')
      .limit(10)
      .get();

    const volunteers = volSnap.docs.map(doc => {
      const d = doc.data();
      return {
        uid: doc.id,
        name: d.fullname || d.username,
        avatarUrl: d.avatarUrl || '',
        type: 'volunteer'
      };
    });

    // 2️ Search companies by companyName_lowercase
    const compSnap = await db.collection('companies')
      .where('username_lowercase', '>=', q)
      .where('username_lowercase', '<=', q + '\uf8ff')
      .limit(10)
      .get();

    const companies = compSnap.docs.map(doc => {
      const d = doc.data();
      return {
        uid: doc.id,
        name: d.companyName || d.name,
        avatarUrl: d.avatarUrl || '',
        type: 'company'
      };
    });

    // 3️ Merge & return
    res.json([...volunteers, ...companies]);
  } catch (err) {
    console.error("User search failed:", err);
    res.status(500).json({ error: 'Search failed' });
  }
}

const logout = async (req, res) => {
  try {
    const sessionCookie = req.cookies.session || '';
    console.log("[LOGOUT] Attempt with session:", sessionCookie);

    if (sessionCookie) {
      try {
        // Try to verify the session cookie
        const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
        console.log("[LOGOUT] Session verified, revoking tokens for:", decodedClaims.sub);
        await admin.auth().revokeRefreshTokens(decodedClaims.sub);
      } catch (e) {
        // Continue with logout even if session verification fails
        console.log("[LOGOUT] Session verification failed:", e.message);
      }
    }

    // Always clear the cookie
    res.clearCookie("session", {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    });

    res.clearCookie("accountType", {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    });


    console.log("[LOGOUT] Cookie cleared");
    return res.status(200).json({ message: "Successfully logged out" });
  } catch (err) {
    console.error("[LOGOUT] Error:", err);
    // Still clear the cookie even if there's an error
    res.clearCookie("session");
    return res.status(200).json({ message: "Logged out with warnings" });
  }
};

const getUserInfo = async (req, res) => {
  const sessionCookie = req.cookies.session || '';
  console.log("[AUTH] Session check initiated", { hasCookie: !!sessionCookie });

  if (!sessionCookie) {
    console.log("[AUTH] No session cookie found");
    return res.status(401).json({ error: 'No session cookie' });
  }

  try {
    let retries = 2;
    let decodedClaims;

    while (retries > 0) {
      try {
        decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
        break;
      } catch (e) {
        retries--;
        if (retries === 0) throw e;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!decodedClaims || !decodedClaims.uid) {
      throw new Error('Invalid session data');
    }

    const userRecord = await admin.auth().getUser(decodedClaims.uid);
    console.log("[AUTH] User found:", userRecord.uid);

    const uid = userRecord.uid;

    // Check company first
    const companySnap = await db.collection('companies').doc(uid).get();
    if (companySnap.exists) {
      const companyData = companySnap.data();
      return res.json({
        role: 'company',
        accountType: 'company',
        uid,
        companyName: companyData.companyName
      });
    }

    // Then check volunteer
    const volunteerSnap = await db.collection('Volunteers').doc(uid).get();


    if (!volunteerSnap.empty) {
      return res.json({ role: 'volunteer', uid });
    }

    return res.status(403).json({ error: 'User not found in any role' });

  } catch (err) {
    console.error("[AUTH] Session verification failed:", err);
    res.clearCookie("session", {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    });
    return res.status(401).json({
      error: 'Session invalid',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Authentication failed'
    });
  }
};

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = {
  sessionLogin,
  checkUsername,
  getUserInfo,
  searchUsers,
  verifySession,
  verifySessionIfAvailable,
  getPersonalProfile,
  logout,
  authMiddleware
};