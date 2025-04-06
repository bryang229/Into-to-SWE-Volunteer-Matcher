// Importing dependencies 
const express = require('express');
const fs = require("fs");
const path = require('path');

//Setting up app
const app = express(); // Creating app object
app.use(express.static(path.join(__dirname, '../public'))); //Connecting frontend
app.use(express.json());

const dataFile = path.join(__dirname, "demo_data.json"); //Creating json path

//Loading fresh data on request (DEMO MODE)
const loadData = () => {
  const raw = fs.readFileSync(dataFile); // Reading file JSON DB (only for DEMO)
  return JSON.parse(raw);
};

//GET all volunteers
app.get('/api/volunteers', (req, res) => {
  const data = loadData();
  res.json(data.volunteers);
});

//GET all companies
app.get('/api/companies', (req, res) => {
  const data = loadData();
  res.json(data.companies);
});

//GET all listings
app.get("/api/listings", (req, res) => {
  const data = loadData();
  res.json(data.listings);
});

//GET specific volunteer by username
app.get("/api/volunteers/:username", (req, res) => {
  const { username } = req.params;
  const data = loadData();
  const user = data.volunteers.find(v => v.username === username);
  if (user) res.json(user);
  else res.status(404).json({ error: "Volunteer not found" });
});

// POST new user
app.post('/api/register', (req, res) => {
  console.log(req.body); 
  const data = loadData();
  const newUser = req.body;
  data.volunteers.push(newUser);

  //TODO: verify new user

  // Just write back to file (NOT recommended for prod)
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  res.json({ message: "User added", user: newUser });
});
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});