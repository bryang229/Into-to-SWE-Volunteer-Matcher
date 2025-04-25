import { fetchUserData } from './dashboard_data.js';
import { setupNav } from '../common/nav_control.js';

let cachedUserData;

const listingsSection = document.getElementById("company-listings");

// Set to contain private data 
const privateFields = new Set();

//Original values before edited by user
const originalValues = {};

// Start up sequence ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {
  try {
    cachedUserData = await fetchUserData();
    document.getElementById("displayName").textContent = cachedUserData.admin_fullname || cachedUserData.username;
    setupNav(cachedUserData.accountType);

    if (cachedUserData.accountType === "volunteer") {
      window.location.href = "/templates/volunteer/volunteer_dashboard.html";
      return;
    }

    populateFields(cachedUserData);
    await loadCompanyListings(cachedUserData.uid);

  } catch (err) {
    console.error(err);
    setTimeout(() => {
      window.location.href = "/templates/auth/login.html";
    }, 10000);
  }
});

// Edit button logic
document.querySelectorAll('.edit-btn').forEach(btn => {
  const fieldId = btn.dataset.target;
  const field = document.getElementById(fieldId);
  const status = document.getElementById(`${fieldId}-status`);

  originalValues[fieldId] = field.value;

  btn.addEventListener('click', () => {
    const isEditing = btn.classList.toggle('active');
    field.disabled = !isEditing;

    if (!isEditing) {
      if (field.value.trim() !== originalValues[fieldId]) {
        status.textContent = 'Updated';
        status.classList.add('updated');
        originalValues[fieldId] = field.value.trim();
      } else {
        status.textContent = '';
        status.classList.remove('updated');
      }
    }
  });
});

// Privacy toggle (eye icon)
document.querySelectorAll('.privacy-eye').forEach(icon => {
  const fieldId = icon.dataset.field;

  icon.addEventListener('click', () => {
    icon.classList.toggle('private');

    if (icon.classList.contains('private')) {
      privateFields.add(fieldId);
      icon.textContent = '🙈';
    } else {
      privateFields.delete(fieldId);
      icon.textContent = '🙉';
    }

    const summary = document.getElementById("private-fields");
    if (summary) summary.textContent = Array.from(privateFields).join(", ");
  });
});

// Event listeners ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Submit form
document.getElementById("companyProfileForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const profileData = {
    companyBio: document.getElementById("companyBio").value.trim(),
    publicEmail: document.getElementById("publicEmail").value.trim(),
    listingVisibility: document.getElementById("listingVisibilityToggle").checked,
    privacyFields: Array.from(privateFields)
  };

  console.log("Company profile data to submit:", profileData);

  fetch("/api/companies/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(profileData)
  });
});

// Populate existing data
function populateFields(user) {
  document.getElementById("companyName").value = user.companyName || '';
  document.getElementById("publicEmail").value = user.publicEmail || '';
  document.getElementById("privateEmail").value = user.privateEmail || '';
  document.getElementById("companyBio").value = user.companyBio || '';
  // Set eye icon state
  document.querySelectorAll('.privacy-eye').forEach(icon => {
    const fieldId = icon.dataset.field;
    if (user.privacyFields && user.privacyFields.includes(fieldId)) {
      privateFields.add(fieldId);
      icon.textContent = '🙈';
    } else {
      icon.textContent = '🙉';
    }
  });

  // Display private field summary
  const summary = document.getElementById("private-fields");
  if (summary) summary.textContent = (user.privacyFields || []).join(", ");

  // Store originals
  originalValues["companyBio"] = user.companyBio || '';
  originalValues["publicEmail"] = user.publicEmail || '';
}

// Loads company's listing
async function loadCompanyListings(companyUid) {
  const list = document.getElementById("listingList");
  list.innerHTML = "";

  try {
    const res = await fetch("/api/listings/");
    const listings = await res.json();

    const companyListings = listings.filter(l => l.creatorUid === companyUid);

    if (companyListings.length === 0) {
      list.innerHTML = "<li>You haven't posted any listings yet.</li>";
      return;
    }

    companyListings.forEach(listing => {
      const li = document.createElement("li");
      li.className = "listing-entry";
      li.innerHTML = `
        <h4>${listing.title}</h4>
        <p><strong>Date:</strong> ${listing.date}</p>
        <p><strong>Location:</strong> ${listing.location}</p>
        <p>${listing.description}</p>
        <button class="view-applicants-btn" data-id="${listing.id}">View Applicants</button>
      `;
      list.appendChild(li);
    });

    document.querySelectorAll(".view-applicants-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const listingId = btn.dataset.id;
        window.location.href = `/templates/company/applicants.html?listingId=${listingId}`;
      });
    });
  } catch (err) {
    console.error("Failed to load listings:", err);
    list.innerHTML = "<li>Error loading listings.</li>";
  }
}