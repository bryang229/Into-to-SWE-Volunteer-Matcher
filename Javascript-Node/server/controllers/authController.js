const { admin, db } = require('../firebase');

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
    logout
};