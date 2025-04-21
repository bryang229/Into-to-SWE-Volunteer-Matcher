const { admin, db } = require('../firebase');
const cryptoJS = require('crypto-js');
const sha256 = input => cryptoJS.SHA256(input).toString();

const sessionLogin = async (req, res) => {
  const { idToken } = req.body;
  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  try {
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
    res.cookie('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: false,   //false for testing, true for production
      secure: false,
      //secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    console.log("Cookie set with:", sessionCookie);
    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
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
        uid,
        companyName: companyData.companyName
      });
    }

    // Then check volunteer
    const volunteerSnap = await db.collection('Volunteers')
      .where('hashedEmail', '==', sha256(userRecord.email))
      .limit(1)
      .get();

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

module.exports = {
    sessionLogin,
    checkUsername,
    logout,
    getUserInfo
};