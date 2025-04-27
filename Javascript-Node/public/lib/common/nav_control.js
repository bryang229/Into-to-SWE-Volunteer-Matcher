import { verifyCookiesSession } from '../auth/cookies.js';
import { monitorConnection } from '../common/connectionMonitor.js';


export async function setupNav(accountType = null) {
  insertBackButton();

  // Save current page as "previousPage" before moving forward
  const currentPath = window.location.pathname + window.location.search;
  const lastPage = sessionStorage.getItem("currentPage");
  sessionStorage.setItem("previousPage", lastPage);
  sessionStorage.setItem("currentPage", currentPath);

  const navTitle = document.querySelector('.nav-title');
  if (navTitle && !document.getElementById('globalConnectionDot')) {
    const connectionDot = document.createElement('span');
    connectionDot.id = 'globalConnectionDot';
    connectionDot.className = 'connection-dot';
    navTitle.appendChild(connectionDot);
  }

  const navLinks = document.getElementById("navLinks");
  if (!navLinks) return;
  console.log("starting")
  try {
    if (!accountType)
      accountType = (await verifyCookiesSession()).accountType;
    if (accountType && accountType !== "none") {
      const isCompany = accountType === 'company';
      navLinks.innerHTML = `
    <a href="/templates/index.html">Home</a>  
    <a href="/templates/${accountType}/${accountType}_dashboard.html">Dashboard</a>
    <a href="/templates/common/profile_search.html">Search Profiles</a>
    <a href="/templates/common/messages.html">Check your messages</a>
    <a href="/templates/common/account_settings.html">Account Settings</a>
    <a href="/templates/common/help.html">Help</a>
    <a href="#" id="logoutLink">Logout</a>
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
    `;

      //Adding applicants pages as drop down dynamically
      if (isCompany) {
        try {
          const res = await fetch("/api/companies/my-listings", { credentials: "include" });
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

  } catch (e) {
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