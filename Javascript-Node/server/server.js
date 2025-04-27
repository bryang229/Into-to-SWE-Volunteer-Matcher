const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
const authRoutes = require('./routes/authRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const companyRoutes = require('./routes/companyRoutes');
const listingsRoutes = require('./routes/listingsRoutes');
const applicationsRoutes = require('./routes/applicationsRoutes');
const conversationsRoutes = require('./routes/conversationRoutes');
const userRoutes = require('./routes/userRoutes'); // For account settings

app.use('/api', authRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/applications', applicationsRoutes);
// mount messaging
app.use('/api/conversations', conversationsRoutes);
app.use('/api/user', userRoutes); // Mount userRoutes for account settings

// Firebase Config Route
app.get('/api/firebase-config', (req, res) => {
    const firebaseConfig = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID
    };
    res.json(firebaseConfig);
});

// Static page redirect
app.get('/', (req, res) => {
  res.redirect('/templates/index.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
