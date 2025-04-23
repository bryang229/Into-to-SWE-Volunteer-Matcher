export async function loadCreateListings() {
    const logoutBtn = document.getElementById("logoutBtn");
    const loginLink = document.getElementById("loginLink");
    const createListingBtn = document.getElementById("createListingBtn");

    // Reset button states first
    if (logoutBtn) logoutBtn.style.display = "none";
    if (loginLink) loginLink.style.display = "inline-block";
    if (createListingBtn) createListingBtn.style.display = "none";

    async function checkAuthWithRetry(retries = 2) {
        while (retries >= 0) {
            try {
                const res = await fetch("/api/me", {
                    credentials: "include",
                    headers: {
                        "Cache-Control": "no-cache",
                        "Pragma": "no-cache"
                    }
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.error || 'Auth check failed');
                }

                return await res.json();
            } catch (err) {
                console.warn(`Auth check attempt ${2 - retries} failed:`, err);
                if (retries <= 0) throw err;
                retries--;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    try {
        const data = await checkAuthWithRetry();
        console.log("[AUTH] Check successful:", data);
      
        if (logoutBtn) logoutBtn.style.display = "inline-block";
        if (loginLink) loginLink.style.display = "none";
      
        // Always hide the create button initially, only show if company
        if (createListingBtn) createListingBtn.style.display = "none";
      
        if (data.accountType === "company" && createListingBtn) {
          createListingBtn.style.display = "inline-block";
        }
      
      } catch (err) {
        console.warn("[AUTH] Not authenticated:", err.message);
      
        // This only runs if /api/me truly failed (e.g. user not logged in)
        if (logoutBtn) logoutBtn.style.display = "none";
        if (loginLink) loginLink.style.display = "inline-block";
        if (createListingBtn) createListingBtn.style.display = "none";
      }

    // Logout handler
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                // First, clear all client-side storage
                localStorage.clear();
                sessionStorage.clear();

                const response = await fetch("/api/logout", {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    }
                });

                console.log("Logout response status:", response.status);

                // Even if the response isn't OK, proceed with logout
                if (document.cookie.includes('session')) {
                    document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                }

                // Force a complete page reload from server
                window.location.href = "/templates/index.html?t=" + new Date().getTime();
            } catch (err) {
                console.error("Logout error:", err);
                // Force reload anyway
                window.location.href = "/templates/index.html?t=" + new Date().getTime();
            }
        });
    }
}
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
