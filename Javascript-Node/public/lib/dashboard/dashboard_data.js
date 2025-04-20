import { auth } from '../auth/firebase-config.js';
import { getIdToken } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

let cachedUserData = null;

export async function fetchUserData() {
  if (cachedUserData) return cachedUserData;

  const res = await fetch("/api/me");
  if (!res.ok) throw new Error("Failed to fetch user data");

  cachedUserData = await res.json();

  document.getElementById("displayName").textContent = cachedUserData.fullname || "User";
//   document.getElementById("accountType").textContent = cachedUserData.accountType;

  return cachedUserData;
}

