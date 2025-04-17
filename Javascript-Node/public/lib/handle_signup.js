import { auth, createUserWithEmailAndPassword } from './firebase-config.js';

export async function registerVolunteer(email, password, username, fullname) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    const emailHash = CryptoJS.SHA256(email).toString();

    const res = await fetch("/api/register/volunteer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, username, fullname, email: emailHash })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unknown error");

    return { success: true, uid };
  } catch (err) {
    console.error("Signup error:", err);
    return { success: false, message: err.message };
  }
}

export async function registerCompany(email, password, companyData) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    const emailHash = CryptoJS.SHA256(email).toString();

    const res = await fetch("/api/register/company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, email: emailHash, ...companyData })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unknown error");

    return { success: true, uid };
  } catch (err) {
    console.error("Signup error:", err);
    return { success: false, message: err.message };
  }
}