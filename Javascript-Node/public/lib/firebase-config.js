//Importing CDN libraries for authenticating our session for sign in/log in
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

//Our public API key
const firebaseConfig = {
  apiKey: "AIzaSyDsEzeWZrCGRyBCZCGe1MK9-qWbK0DKvZ4",
  authDomain: "volunteer-tinder-455820.firebaseapp.com",
  projectId: "volunteer-tinder-455820",

};

// Initialize Firebase app using the provided config
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore services
const auth = getAuth(app);        // Used to handle login, signup, logout, etc.
const db = getFirestore(app);     // Used for database read/write operations unused so far it seems
//Exporting functions so handlers can import only whats needed!
export {
  auth,
  db,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword
};