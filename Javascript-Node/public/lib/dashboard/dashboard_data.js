import { auth } from '../auth/firebase-config.js';
import { getIdToken } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

let cachedUserData = null;

export async function fetchUserData() {
  if (cachedUserData) return cachedUserData;
  // console.log('called data handler');
  const res = await fetch("/api/me");
  if (!res.ok) throw new Error("Failed to fetch user data");

  cachedUserData = await res.json();
  // console.log(cachedUserData);

  document.getElementById("displayName").textContent = cachedUserData.fullname || "User";
//   document.getElementById("accountType").textContent = cachedUserData.accountType;

  return cachedUserData;
}

document.getElementById("logoutLink").addEventListener("click", async (e) => {
  e.preventDefault();
  await fetch("/api/logout", { method: "POST" });
  window.location.href = "/templates/login.html";
});