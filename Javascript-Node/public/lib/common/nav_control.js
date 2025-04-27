import { fetchUserData } from '../dashboard/dashboard_data.js';

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

  // Save current page as "previousPage" before moving forward
  const currentPath = window.location.pathname + window.location.search;
  const lastPage = sessionStorage.getItem("currentPage");
  sessionStorage.setItem("previousPage", lastPage);
  sessionStorage.setItem("currentPage", currentPath);

  const navLinks = document.getElementById("navLinks");
  if (!navLinks) return;
  console.log("starting")
  try {
    if (!accountType)
      accountType = (await verifyCookiesSession()).accountType;
    if (!(accountType === "none")) {
      const isCompany = accountType === 'company';
      navLinks.innerHTML = `
    <a href="/templates/index.html">Home</a>  
    <a href="/templates/${accountType}/${accountType}_dashboard.html">Dashboard</a>
      ${isCompany ?
          `<div class="nav-dropdown">
          <a href="#">Browse Applications ▾</a>
          <div class="dropdown-submenu" id="applicationLinks"></div>
        </div>
        <a href="/templates/company/create_listing.html">Create Listing</a>` :
          //Browse listings could be like a search thing
          `<a href="/templates/index.html">Browse Listings</a>        
         <a href="/templates/volunteer/application_portal.html">Check Applications</a>
         <div class="nav-dropdown">
          <a href="#">Pending Applications ▾</a>
           <div class="dropdown-submenu" id="pendingApplicationsMenu">
            <span style="padding: 10px;">Loading...</span>
            </div>
         </div>
        `
        }
      <a href="/templates/index.html">Home</a>  
      <a href="/templates/common/account_settings.html">Account Settings</a>
      <a href="/templates/common/help.html">Help</a>
      <a href="#" id="logoutLink">Logout</a>
    `;

      //Adding applicants pages as drop down dynamically
      if (isCompany) {
        try {
          const res = await fetch("/api/company/my-listings", { credentials: "include" });
          const myListings = await res.json();

          const menu = document.getElementById("applicationLinks");

          if (myListings.length === 0) {
            menu.innerHTML = `<span style="padding: 10px;">No listings yet</span>`;
          } else {
            myListings.forEach(listing => {
              menu.innerHTML += `
                <a href="/templates/company/applicants.html?listingId=${listing.id}">
                  ${listing.title || "Untitled Listing"}
                </a>
              `;
            });
          }
        } catch (err) {
          console.warn("Error loading listings for nav:", err);
        }
      } else {
        // Volunteers
        try {
          const userRes = await fetch("/api/volunteers/my-applications", { credentials: "include" });
          const applications = await userRes.json();

          const menu = document.getElementById("pendingApplicationsMenu");
          menu.innerHTML = ""; // Clear "Loading..." text

          const pendingApps = applications.filter(app => app.status.toLowerCase() === "waiting for review");

          if (pendingApps.length === 0) {
            menu.innerHTML = `<span style="padding: 10px;">No pending applications</span>`;
          } else {
            pendingApps.forEach(app => {
              menu.innerHTML += `
                <a href="/templates/volunteer/volunteer_application_review.html?applicationId=${app.id}">
                  ${app.listingTitle || "Unknown Listing"}
                </a>
              `;
            });
          }
        } catch (err) {
          console.error("Failed to load volunteer pending applications:", err);
        }
      }
      insertBackButton();

      document.getElementById("logoutLink").addEventListener("click", async (e) => {
        e.preventDefault();
        await fetch("/api/logout", { method: "POST" });
        window.location.href = "/templates/auth/login.html";
      });
      console.log(accountType, "nav")
    } else {
      navLinks.innerHTML = `
    <a href="/templates/index.html">Home</a>  
    <a href="/templates/auth/login.html">Log In</a>
    <a href="/templates/auth/sign_up.html">Sign Up</a>
    <a href="/templates/common/help.html">Help</a>
  `;
    }
    return accountType;

  } catch {
    navLinks.innerHTML = `
      <a href="/templates/index.html">Home</a>  
      <a href="/templates/auth/login.html">Log In</a>
      <a href="/templates/auth/sign_up.html">Sign Up</a>
      <a href="/templates/common/help.html">Help</a>
    `;
    return null;
  }
}


// Methods ----

// Adds back button
function insertBackButton() {
  const prevPage = sessionStorage.getItem("previousPage");
  const currentPath = window.location.pathname + window.location.search;

  // Don't show back button if it's the same page or there's no nav
  if (!prevPage || prevPage === currentPath) return;

  const nav = document.querySelector("nav");
  if (!nav) return;

  const backContainer = document.createElement("div");
  backContainer.className = "back-button-container";

  const btn = document.createElement("button");
  btn.textContent = "← Back";
  btn.className = "back-btn";
  btn.onclick = () => window.location.href = prevPage;

  backContainer.appendChild(btn);
  nav.insertAdjacentElement("afterend", backContainer);
}