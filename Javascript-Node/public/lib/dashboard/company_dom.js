import { fetchUserData, fetchCompanyInvitesSent } from './dashboard_data.js';
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
    await renderSentInvites();

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
    const listingsRes = await fetch("/api/listings/");
    const listings = await listingsRes.json();

    const countsRes = await fetch("/api/applications/counts-for-company", { credentials: 'include' });
    const counts = await countsRes.json();
    const countsMap = {};
    counts.forEach(c => { countsMap[c.listingId] = c.count; });

    const companyListings = listings.filter(l => l.creatorUid === companyUid);

    if (companyListings.length === 0) {
      list.innerHTML = "<li>You haven't posted any listings yet.</li>";
      return;
    }

    companyListings.forEach(listing => {
      const card = document.createElement('div');
      card.className = 'dashboard-card';
      card.innerHTML = `
        <h3>${listing.title || 'Untitled Listing'}</h3>
        <p><strong>Date:</strong> ${listing.date || 'N/A'}</p>
        <p><strong>Location:</strong> ${listing.location || 'N/A'}</p>
        <p><strong>Applications:</strong> ${countsMap[listing.id] || 0}</p>
        <div class="card-buttons">
        <button class="view-applicants-btn" data-id="${listing.id}">View Applicants</button>
        <a class="btn btn-primary" href="/templates/company/applicants.html?listingId=${listing.id}">Manage Applicants</a>
          <a class="btn btn-primary" href="/templates/company/applicants.html?listingId=${listing.id}">Manage Applicants</a>
          <button class="btn btn-danger" data-id="${listing.id}">Delete Listing</button>
        </div>
      `;
      list.appendChild(card);
    });

    // Attach "View Applicants" button behavior
    document.querySelectorAll(".view-applicants-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const listingId = e.target.dataset.id;
        if (!listingId) return;
        window.location.href = `/templates/company/applicants.html?listingId=${listingId}`;
      });
    });

    // Reattach delete event listeners
    document.querySelectorAll(".btn-danger[data-id]").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.getAttribute('data-id');
        if (!id) return;

        if (!confirm('Are you sure you want to delete this listing?')) return;

        try {
          const res = await fetch(`/api/companies/delete-listing?listingId=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            credentials: 'include'
          });

          if (!res.ok) throw new Error('Failed to delete');
          alert('Listing deleted successfully');
          window.location.reload();
        } catch (err) {
          console.error('Delete listing error:', err);
          alert('Error deleting listing');
        }
      });
    });

  } catch (err) {
    console.error("Failed to load listings or applications:", err);
    list.innerHTML = "<li>Error loading listings.</li>";
  }
}


async function renderSentInvites() {
  const inviteList = document.getElementById('inviteList');
  if (!inviteList) return;

  try {
    const invites = await fetchCompanyInvitesSent();
    if (invites.length === 0) {
      inviteList.innerHTML = '<p style="text-align:center;">No invites sent yet.</p>';
      return;
    }

    invites.forEach(invite => {
      const card = document.createElement('div');
      card.className = 'invite-card';
      card.innerHTML = `
        <strong>${invite.listingTitle || 'Untitled Listing'}</strong>
        <p>Status: ${invite.status}</p>
        <p>Sent to: <a href="/templates/common/profile.html?uid=${invite.volunteerUid}">View Profile</a></p>
      `;
      inviteList.appendChild(card);
    });

  } catch (err) {
    console.error('Error loading invites:', err);
    inviteList.innerHTML = '<p style="text-align:center;color:red;">Failed to load invites.</p>';
  }
}

async function deleteListing(listingId) {
  if (!confirm('Are you sure you want to delete this listing? This will also remove related applications and invites.')) return;

  try {
    const res = await fetch(`/api/companies/delete-listing?listingId=${encodeURIComponent(listingId)}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!res.ok) throw new Error('Failed to delete');
    alert('Listing deleted successfully');
    window.location.reload();
  } catch (err) {
    console.error('Delete listing error:', err);
    alert('Error deleting listing');
  }
}