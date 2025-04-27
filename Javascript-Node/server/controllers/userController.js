const { admin, db } = require('../firebase');

// Update account settings (display name, email, password)
const updateAccountSettings = async (req, res) => {
  const { newDisplayName, newEmail, currentPassword, newPassword } = req.body;
  const { uid, accountType } = req.user;

  try {
    // Load the user record from Firebase
    const userRecord = await admin.auth().getUser(uid);

    const updates = {};

    if (newDisplayName) {
      // Update Firestore based on account type
      const userRef = accountType === "volunteer" ? db.collection('Volunteers').doc(uid) : db.collection('companies').doc(uid);
      const fieldToUpdate = accountType === "volunteer" ? "fullname" : "companyName";

      await userRef.update({ [fieldToUpdate]: newDisplayName });
      updates.displayName = newDisplayName;
    }

    if (newEmail) {
      updates.email = newEmail;
    }

    if (newPassword) {
      // Important: You cannot change passwords without reauthentication client-side.
      // In Admin SDK, if you trust server session, you can directly update.
      updates.password = newPassword;
    }

    if (Object.keys(updates).length > 0) {
      await admin.auth().updateUser(uid, updates);
    }

    res.status(200).json({ message: 'Account updated successfully.' });

  } catch (err) {
    console.error('Error updating account settings:', err);
    res.status(500).json({ error: 'Failed to update account.' });
  }
};

// Delete account
const deleteAccount = async (req, res) => {
  const { uid } = req.user;

  try {
    await admin.auth().deleteUser(uid);
    await db.collection('Volunteers').doc(uid).delete().catch(() => {});
    await db.collection('companies').doc(uid).delete().catch(() => {});

    res.status(200).json({ message: 'Account deleted.' });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ error: 'Failed to delete account.' });
  }
};

module.exports = {
  updateAccountSettings,
  deleteAccount
};