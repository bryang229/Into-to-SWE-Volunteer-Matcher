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

app.use('/api', authRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/applications', applicationsRoutes);



// Static page redirect
app.get('/', (req, res) => {
  res.redirect('/templates/index.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
