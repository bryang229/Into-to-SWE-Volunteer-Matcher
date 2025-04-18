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

## Folder Structure (as of 4/17/25)
```
Javascript-Node/
├── public/              # Frontend files (HTML/CSS/JS)
|   ├── lib/
│   |   ├── firebase-config.js  # connects us to firebase app for sign ups and logins
│   |   ├── handle_login.js  # handles logging a user in and talks to backend for cookie session
│   |   ├── handle_signup.js # handles adding new users to DB
│   |   ├── login_dom.js # empty may be removed, kept for consistency 
│   |   ├── signup_dom.js # handles what should be shown on DOM (text inputs) and checks for username availability 
│   |   └── listings_script.js    # Creates listings to appear dynamically from JSON DB
│   ├── static/
│   |   ├── listings.css # Styles the listings components created in script.js
│   |   ├── sign_up.css  # Styles both login and sign in forms
│   |   └── style.css    # Styles nav bar and basic stuff
|   └── templates/
│       ├── index.html   # Root page, currently shows listings in JSON
│       ├── login.html   # Login page, currently not functional
│       ├── sign_up.html # Sign up page, functional, hashes data
│       └── dashboard.html # Login redirects here, currently empty, should show user details, editable etc
├── server/              # Backend code and data
│   ├── server.js        # Main Express server
│   ├── firebase.js             # Firebase Admin SDK config lives here
│   ├── routes/
│   │   ├── authRoutes.js       # Routes login cookie sessions and more
│   │   ├── listingsRoutes.js   # Protected routes for listings
│   │   ├── volunteerRoutes.js  # Protected routes for volunteers
│   │   └── companyRoutes.js    # Protected routes for companies
│   └── controllers/
│       ├── authController.js           # logic for auth routes
│       ├── listingsController.js       # logic for listings routes
│       ├── volunteersController.js     # logic for volunteers routes
│       └── companyController.js        # logic for company routes
├── package.json         # Project config & scripts
├── secrets/             #not in github L hackers
│   └── serviceAccountKey.json
├── .env                 #not in github L hackers
├── node_modules/
├── .gitignore 
├── .gitattributes
├── LICENSE -> MIT
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

### GET /volunteers/

Returns all volunteer profiles.
Use only for development/testing.

### Response:
```json
[
  {
    "id": "abc123",
    "username": "johndoe",
    "fullname": "John Doe",
    "hashedEmail": "…",
    "hashedPassword": "…"
  },
  ...
]
```

### GET /volunteers/check-username?username=VALUE

Checks if a volunteer username is available.

Query Parameters:
	•	username (string) – required

### Response:

```json
{ "available": true }
```
### GET /volunteers/:username

Returns a single volunteer profile by username.

Path Parameters:
	•	username (string) – required

### Response:
```json
{
  "id": "abc123",
  "username": "johndoe",
  "fullname": "John Doe",
  ...
}
```
### Error:

```json
{ "error": "Volunteer not found" } // 404
```
### POST /volunteers/register

Registers a new volunteer.

### Body (JSON):
```json
{
  "username": "johndoe",
  "fullname": "John Doe",
  "email": "john@example.com",
  "password": "plaintextpassword"
}
```

### Response:
```json
{ "message": "Volunteer registered", "id": "abc123" }
```
### Error (username taken)
```json
{ "error": "Username already exists" } // 409
```

### GET /companies/check-username?username=VALUE

Checks if a company username is available.

Query Parameters:
	•	username (string) – required

### Response:
```json
{ "available": true }
```


### POST /companies/register

Registers a new company.

### Body (JSON):
```json
{
  "uid": "firebaseUID",
  "username": "companyname",
  "companyName": "My Company",
  "admin_fullname": "Admin Name",
  "publicEmail": "contact@company.com",
  "privateEmail": "admin@company.com",
  "companyBio": "We do things."
}
```
### Response
```json
{ "message": "Company registered", "uid": "firebaseUID" }
```

### POST /sessionLogin

Exchanges a Firebase ID token for a session cookie.

### Body (JSON):
```json
{ "idToken": "firebaseIdToken" }
```

### Response 
```json
{ "message": "Login successful" }
```
### Error
```json
{ "error": "Invalid ID token" } // 401
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