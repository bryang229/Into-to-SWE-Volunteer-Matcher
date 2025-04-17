# Volunteer Platform – Backend Server

This is the backend server for the Volunteer Platform demo. It's built using Node.js and Express, and for now it uses a local JSON file (`demo_data.json`) as a mock database to simulate user, company, and listing data.

---

##  What This Server Does

- Serves static frontend files from `/public`
- Provides REST API endpoints to access:
  - Volunteer user profiles
  - Company profiles
  - Volunteer opportunity listings
- Loads all data from a file: `server/demo_data.json`
- Does **not** persist new data between restarts (intended for demo only)

---

## Folder Structure (as of 4/6/25)
```
Javascript-Node/
├── public/              # Frontend files (HTML/CSS/JS)
    ├── lib/
        ├── handle_login.js  # not functional
        ├── handle_signup.js # handles adding new users to DB
        ├── script.js    # Creates listings to appear dynamically from JSON DB
    ├── static/
        ├── listings.css # Styles the listings components created in script.js
        ├── sign_up.css  # Styles both login and sign in forms
        ├── style.css    # Styles nav bar and basic stuff
    ├── templates/
        ├── index.html   # Root page, currently shows listings in JSON
        ├── login.html   # Login page, currently not functional
        ├── sign_up.html # Sign up page, functional, hashes data
├── server/              # Backend code and data
│   ├── server.js        # Main Express server
    ├── firebase.js             # Firebase Admin SDK config lives here
    ├── routes/
    │   ├── authRoutes.js       # Routes like signup/login
    │   ├── volunteerRoutes.js  # Protected routes for volunteers
    │   └── companyRoutes.js  
    ├── controllers/
│       └── userController.js   # Business logic, like createProfile, etc. 
├── package.json         # Project config & scripts
├── secrets/
│   └── serviceAccountKey.json
├── .env
├── node_modules/
├── .gitignore 
└── README.md            # This file
```

---
## How to Set It Up

### 1. Clone or download the project

```bash
git clone https://github.com/bryang229/Into-to-SWE-Volunteer-Matcher
cd Into-to-SWE-Volunteer-Matcher/Javascript-Node
```
### 2. Install Dependencies 
 ```bash
npm install
```
(If you never used node/npm and don't have it on your computer, check out the bottom of this page to see how to install it)
### 3. Run the server in development mode (with live reload)
```bash
npm run dev
```
This starts the Express server on http://localhost:3000

## Available API Endpoints

GET all volunteers
```
/api/volunteers
```

GET all companies
```
/api/companies
```
GET all listings
```
/api/listings
```

GET specific volunteer by username
```
/api/volunteers/:username
```

POST new user
```
/api/register
```

---

## Never Used Node.js or npm ?



This project uses **Node.js** (a tool to run JavaScript outside the browser) and **npm** (a tool for installing packages/libraries that help us build stuff).

### Step 1: Install Node.js and npm

Go to [https://nodejs.org/](https://nodejs.org/) and download the **LTS (Long Term Support)** version for your system.

Once installed, open a terminal or command prompt and run:

```bash
node -v
npm -v
```

### Step 2: Install the Project Dependencies

In the root folder of the project (where package.json lives), run:
```bash
npm run dev
```
Then open your browser and visit:
```bash 
http://localhost:3000
```
You should see the frontend running, and you can test backend APIs too!