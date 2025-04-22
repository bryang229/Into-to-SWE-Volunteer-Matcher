import { verifyCookiesSession } from '../auth/cookies.js';

export async function setupNav(accountType = null) {
  const navLinks = document.getElementById("navLinks");
  if (!navLinks) return;

  try {
    if(!accountType)
      accountType = (await verifyCookiesSession()).accountType;
    const isCompany = accountType === 'company';
    navLinks.innerHTML = `
      <a href="/templates/${accountType}_dashboard.html">Dashboard</a>
      ${isCompany ? 
        '<a href="/templates/applicants.html">Browse Applications</a>':
        //Browse listings could be like a search thing
        `<a href="/templates/index.html">Browse Listings</a>        
         <a href="/templates/application_portal.html">Check Applications</a>
        `
      }
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