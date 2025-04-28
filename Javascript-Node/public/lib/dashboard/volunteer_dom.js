import { fetchUserData, fetchVolunteerInvitesReceived } from './dashboard_data.js';
import { setupNav } from '../common/nav_control.js'

let cachedUserData;

const applicationList = document.getElementById("applicationList");

// Set to contain private data 
const privateFields = new Set();

//Original values before edited by user
const originalValues = {};

// Check box logic variables
const toggle = document.getElementById("interestToggle");
const options = document.getElementById("interestOptions");
const label = document.getElementById("dropdownLabel");

// Start up sequence ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Populate from backend: GET /api/applications
document.addEventListener("DOMContentLoaded", async () => {
  try {
    cachedUserData = await fetchUserData();
    document.getElementById("displayName").textContent = cachedUserData.fullname || "User";
    setupNav(cachedUserData.accountType);

    if (cachedUserData.accountType === "company")
      window.location.href = "/templates/company/company_dashboard.html";
    populateFields(cachedUserData);
    await loadVolunteerApplications(cachedUserData);
    await renderReceivedInvites();
  } catch (err) {
    console.error(err);

    setTimeout(() => {
      window.location.href = "/templates/auth/login.html";
    }, 10000);
  }
});

// Setting up edit button
document.querySelectorAll('.edit-btn').forEach(btn => {
  const fieldId = btn.dataset.target;
  const field = document.getElementById(fieldId);
  const status = document.getElementById(`${fieldId}-status`);

  // Store original value when page loads
  originalValues[fieldId] = field.value;

  btn.addEventListener('click', () => {
    const isEditing = btn.classList.toggle('active');
    field.disabled = !isEditing;

    if (!isEditing) {
      // Exiting edit mode: check if value changed
      if (field.value.trim() !== originalValues[fieldId]) {
        status.textContent = 'Updated';
        status.classList.add('updated');
        originalValues[fieldId] = field.value.trim(); // Update stored value
      } else {
        status.textContent = '';
        status.classList.remove('updated');
      }
    }
  });
});

//Privacy Features


//Sets up the private eyes
document.querySelectorAll('.privacy-eye').forEach(icon => {
  const fieldId = icon.dataset.field;

  icon.addEventListener('click', () => {
    icon.classList.toggle('private');

    if (icon.classList.contains('private')) {
      privateFields.add(fieldId);
      icon.textContent = '🙈'; // eye-off style
    } else {
      privateFields.delete(fieldId);
      icon.textContent = '🙉';
    }
    document.getElementById("private-fields").textContent = Array.from(privateFields).join(", ");
  });
});

// Event listeners ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

//Update User details
document.getElementById("profileForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const privateFieldArray = Array.from(privateFields);
  const profileData = {
    bio: document.getElementById("bio").value.trim(),
    location: document.getElementById("location").value.trim(),
    interests: getSelectedInterests(),
    age: parseInt(document.getElementById("age").value),
    experience: parseInt(document.getElementById("experience").value),
    privacyFields: privateFieldArray
  };

  console.log("Profile data to submit:", profileData);

  // You can now POST this to your backend (e.g. /api/profile/update)
  fetch("/api/volunteers/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(profileData)
  });
});

// This is the logic for the interests, it dynamically shows if they selected it or not
toggle.addEventListener("click", () => {
  toggle.parentElement.classList.toggle("active");
});

options.addEventListener("change", () => {
  const selected = Array.from(options.querySelectorAll('input[type="checkbox"]:checked'))
    .map(cb => cb.value);

  label.textContent = selected.length
    ? `Interests: ${selected.join(", ")}`
    : "Select Interests";
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (!toggle.parentElement.contains(e.target)) {
    toggle.parentElement.classList.remove("active");
  }
});


// Methods ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function getSelectedInterests() {
  return Array.from(options.querySelectorAll('input[type="checkbox"]:checked'))
    .map(cb => cb.value);
}


// Populates field with already set data
const populateFields = (user) => {
  document.getElementById('bio').value = user.bio || '';
  document.getElementById('location').value = user.location || '';
  document.getElementById('age').value = user.age || '';
  document.getElementById('experience').value = user.experience || '';


  // Interests (array of strings)
  if (Array.isArray(user.interests)) {
    const allCheckboxes = document.querySelectorAll('#interestOptions input[type="checkbox"]');
    allCheckboxes.forEach(cb => {
      cb.checked = user.interests.includes(cb.value);
    });

    const selected = getSelectedInterests();

    label.textContent = selected.length
      ? `Interests: ${selected.join(", ")}`
      : "Select Interests";
  }

  document.querySelectorAll('.privacy-eye').forEach(icon => {
    const fieldId = icon.dataset.field;
    if (user.privacyFields) {
      if (user.privacyFields.includes(fieldId))
        icon.textContent = '🙈'; // eye-off style
      else
        icon.textContent = '🙉';
      document.getElementById("private-fields").textContent = user.privacyFields.join(", ");
    } else {
      icon.textContent = '🙉';
      document.getElementById("private-fields").textContent = "";
    }
  });

  originalValues["bio"] = user.bio || '';
  originalValues["location"] = user.bio || '';
  originalValues["age"] = user.bio || '';
  originalValues["experience"] = user.bio || '';

};


// Loads volunteers applications to dash board
async function loadVolunteerApplications(user) {
  const list = document.getElementById("applicationList");
  list.innerHTML = ""; // Clear any existing content

  if (!Array.isArray(user.applications) || user.applications.length === 0) {
    list.innerHTML = "<li>You haven't submitted any applications yet.</li>";
    return;
  }

  for (const { listingId, applicationId } of user.applications) {
    try {
      // Fetch full application
      const appRes = await fetch(`/api/applications/application-data?applicationId=${applicationId}`);
      const app = await appRes.json();

      // Fetch listing data
      const listingRes = await fetch(`/api/listings/listing-data?listingId=${listingId}`);
      const listing = await listingRes.json();

      const li = document.createElement("li");
      li.className = "application-entry";
      li.innerHTML = `
        <h4>${listing.title}</h4>
        <p><strong>Date:</strong> ${listing.date}</p>
        <p><strong>Company:</strong> ${listing.companyName}</p>
        <p><strong>Status:</strong> ${app.status}</p>
        <p><strong>Submitted:</strong> ${new Date(app.submittedAt).toLocaleDateString()}</p>
        ${app.edited ? `<p><em>(Edited after submission)</em></p>` : ""}
        ${app.status === "Waiting for Review" ? `<button class="edit-app-btn" data-id="${applicationId}">Edit</button>` : ""}
      `;
      list.appendChild(li);

      const card = document.createElement('div');
      card.className = 'dashboard-card';
      card.innerHTML = `
        <h3>${app.listingTitle || 'Untitled Listing'}</h3>
        <p>Status: ${app.status}</p>
        <div class="card-buttons">
          <a class="btn btn-primary" href="/templates/volunteer/view_application.html?applicationId=${app.applicationId}">View Submission</a>
          <button class="btn btn-danger" onclick="withdrawApplication('${app.applicationId}')">Withdraw</button>
        </div>
      `;

      list.appendChild(card);
    } catch (err) {
      console.warn(`Failed to load application ${applicationId}`, err);
    }
  }

  // Attach edit button handlers
  document.querySelectorAll(".edit-app-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const appId = btn.dataset.id;
      // redirect to edit-application.html with ?applicationId=...
      window.location.href = `/templates/volunteer/edit_application.html?applicationId=${appId}`;
    });
  });
}

async function renderReceivedInvites() {
  const inviteList = document.getElementById('inviteList');
  if (!inviteList) return;

  try {
    const invites = await fetchVolunteerInvitesReceived();
    if (invites.length === 0) {
      inviteList.innerHTML = '<p style="text-align:center;">No invites received yet.</p>';
      return;
    }

    invites.forEach(invite => {
      const card = document.createElement('div');
      card.className = 'invite-card';
      card.innerHTML = `
        <strong>${invite.listingTitle || 'Untitled Listing'}</strong>
        <p>Status: ${invite.status}</p>
        <p>From: <a href="/templates/common/profile.html?uid=${invite.companyUid}">View Company</a></p>
      `;
      inviteList.appendChild(card);
    });

  } catch (err) {
    console.error('Error loading invites:', err);
    inviteList.innerHTML = '<p style="text-align:center;color:red;">Failed to load invites.</p>';
  }
}

async function withdrawApplication(applicationId) {
  if (!confirm('Are you sure you want to withdraw this application?')) return;

  try {
    const res = await fetch(`/api/volunteers/withdraw-application?applicationId=${encodeURIComponent(applicationId)}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!res.ok) throw new Error('Failed to withdraw');
    alert('Application withdrawn!');
    window.location.reload();
  } catch (err) {
    console.error('Withdraw error:', err);
    alert('Error withdrawing application');
  }
}