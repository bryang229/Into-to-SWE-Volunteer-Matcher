const { db, admin } = require('../firebase');

async function getProfile(req, res) {
    try {
        console.log('Getting profile for user:', req.user?.uid);
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        let userDoc;
        // Check both collections
        userDoc = await db.collection('Volunteers').doc(user.uid).get();
        if (!userDoc.exists) {
            userDoc = await db.collection('companies').doc(user.uid).get();
        }

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User profile not found' });
        }

        const userData = userDoc.data();
        console.log('Found user data:', userData);
        res.status(200).json({
            displayName: userData.displayName || userData.companyName,
            email: userData.email,
            accountType: userData.accountType || (userDoc.ref.parent.id === 'Volunteers' ? 'volunteer' : 'company')
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: error.message });
    }
}

async function updateProfile(req, res) {
    try {
        const user = req.user;
        const { displayName, email, newPassword } = req.body;

        if (!user) return res.status(401).json({ error: 'Not authenticated' });

        console.log('Updating profile for user:', user.uid);

        // Check if email is already taken
        if (email && email !== user.email) {
            console.log('Checking if email is taken:', email);
            try {
                const existingUser = await admin.auth().getUserByEmail(email);
                if (existingUser && existingUser.uid !== user.uid) {
                    console.log('Email is already taken:', email);
                    return res.status(400).json({ error: 'Email is already taken' });
                }
            } catch (error) {
                if (error.code !== 'auth/user-not-found') {
                    console.error('Unexpected error during email check:', error);
                    throw error;
                }
            }
        }

        // Combine all Firebase Auth updates
        const authUpdates = {};
        if (email) authUpdates.email = email;
        if (newPassword) authUpdates.password = newPassword;

        if (Object.keys(authUpdates).length > 0) {
            console.log('Updating Firebase Auth for user:', user.uid);
            await admin.auth().updateUser(user.uid, authUpdates);
        }

        // Update Firestore profile
        if (displayName) {
            console.log('Updating Firestore profile for user:', user.uid);
            const collection = user.accountType === 'volunteer' ? 'Volunteers' : 'companies';
            const updateData = user.accountType === 'volunteer' 
                ? { displayName } 
                : { companyName: displayName };
            await db.collection(collection).doc(user.uid).update(updateData);
        }

        console.log('Profile updated successfully for user:', user.uid);
        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: error.message });
    }
}

async function deleteAccount(req, res) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        // Delete user data from Firestore
        await db.collection('Users').doc(user.uid).delete();
        
        // Delete user from Firebase Auth
        await admin.auth().deleteUser(user.uid);

        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getProfile,
    updateProfile,
    deleteAccount
};
