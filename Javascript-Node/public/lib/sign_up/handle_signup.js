//Imports from firebase-config to authenticate session and create a new user
import { auth, createUserWithEmailAndPassword } from '../auth/firebase-config.js';
//Exporting registerVolunteer handler to dom handler signup_dom.js
export async function registerVolunteer(email, password, username, fullname) {
  try { 
    //Create new user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    //Store uid for document ID
    const uid = userCredential.user.uid;
    //Store email as a hashed string
    const emailHash = CryptoJS.SHA256(email).toString(); // This is problematic, causes double hashing of emails, look into removing
    //Send data to backend for handling
    const res = await fetch("/api/volunteers/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, username, fullname, email: emailHash })
    });
    //Response to json (stored in data)
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unknown error");
    //Return success status with uid (uid was originally meant for cookie handling, however users MUST login after signing up, logging in handles cookies)
    return { success: true, uid };
  } catch (err) { 
    console.error("Signup error:", err);
    return { success: false, message: err.message };
  }
}
//Exporting registerCompany handler to dom handler signup_dom.js
export async function registerCompany(email, password, companyData) {
  try {
    //Create new user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    //Store uid for document ID
    const uid = userCredential.user.uid;
    //Store email as a hashed string
    const emailHash = CryptoJS.SHA256(email).toString();
    //Send data to backend for handling
    const res = await fetch("/api/companies/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, email: emailHash, ...companyData })
    });
    //Response to json (stored in data)
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unknown error");
    //Return success status with uid (uid was originally meant for cookie handling, however users MUST login after signing up, logging in handles cookies)
    return { success: true, uid };
  } catch (err) {
    console.error("Signup error:", err);
    return { success: false, message: err.message };
  }
}