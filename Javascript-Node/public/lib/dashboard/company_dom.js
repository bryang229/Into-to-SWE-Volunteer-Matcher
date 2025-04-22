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
      window.location.href = "/templates/volunteer_dashboard.html";
      return;
    }

    populateFields(cachedUserData);
  } catch (err) {
    console.error(err);
    setTimeout(() => {
      window.location.href = "/templates/login.html";
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