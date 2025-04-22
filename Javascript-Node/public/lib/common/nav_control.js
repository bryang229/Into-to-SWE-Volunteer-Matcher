import { verifyCookiesSession } from '../auth/cookies.js';

export async function setupNav(accountType = null) {
  const navLinks = document.getElementById("navLinks");
  if (!navLinks) return;

  try {
    if(!accountType)
      accountType = await verifyCookiesSession().accountType;

    navLinks.innerHTML = `
      <a href="/templates/dashboard_router.html">Dashboard</a>
      <a href="/templates/listings.html">Browse Listings</a>
      <a href="/templates/account_settings.html">Account Settings</a>
      <a href="/templates/help.html">Help</a>
      <a href="#" id="logoutLink">Logout</a>
    `;

    document.getElementById("logoutLink").addEventListener("click", async (e) => {
      e.preventDefault();
      await fetch("/api/logout", { method: "POST" });
      window.location.href = "/templates/login.html";
    });
  } catch {
    navLinks.innerHTML = `
      <a href="/templates/login.html">Log In</a>
      <a href="/templates/sign_up.html">Sign Up</a>
      <a href="/templates/help.html">Help</a>
    `;
  }
}