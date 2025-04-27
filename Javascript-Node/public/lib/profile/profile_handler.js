// Handles pure DOM manipulation and profile display
import { sendInvite } from './profile_backend.js';

export function renderVolunteerProfile(data, applications = [], invites = [], listingsForDropdown = [], viewingUid = null) {
    document.getElementById('profileName').textContent = data.fullname || 'Unknown';
    addRoleTag('Volunteer', 'volunteer-role');

    let html = '';
    if (data.bio) html += `<p><strong>Bio:</strong> ${data.bio}</p>`;
    if (data.location) html += `<p><strong>Location:</strong> ${data.location}</p>`;
    if (data.age) html += `<p><strong>Age:</strong> ${data.age}</p>`;
    if (data.experience) html += `<p><strong>Experience:</strong> ${data.experience} years</p>`;
    if (Array.isArray(data.interests) && data.interests.length > 0) {
        html += `<p><strong>Interests:</strong> ${data.interests.join(', ')}</p>`;
    }
    document.getElementById('publicInfo').innerHTML = html || '<p>No public information available.</p>';

    const extraCards = document.getElementById('extraCards');
    extraCards.innerHTML = ''; // Only clear once cleanly

    // Applications
    if (applications.length > 0) {
        const appsSection = document.createElement('div');
        appsSection.innerHTML = '<h3>Applications to Your Listings</h3>';
        applications.forEach(app => {
            const card = document.createElement('div');
            card.className = 'side-card';
            card.innerHTML = `
              <div><strong>${app.listingTitle || 'Untitled Listing'}</strong></div>
              <div>Status: ${app.status}</div>
              <a href="/templates/company/application_review.html?applicationId=${app.applicationId}">Review Application</a>
            `;
            appsSection.appendChild(card);
        });
        extraCards.appendChild(appsSection);
    }

    // Previous Invites
    if (invites.length > 0) {
        const invitesSection = document.createElement('div');
        invitesSection.innerHTML = '<h3>Previous Invitations</h3>';
        invites.forEach(invite => {
            const card = document.createElement('div');
            card.className = 'side-card';
            card.innerHTML = `
              <div><strong>${invite.listingTitle || 'Untitled Listing'}</strong></div>
              <div>Status: ${invite.status}</div>
            `;
            invitesSection.appendChild(card);
        });
        extraCards.appendChild(invitesSection);
    }

    // Listing dropdown — defer to function
    if (listingsForDropdown.length > 0 && viewingUid) {
        renderInviteSection(listingsForDropdown);
        attachInviteButton(viewingUid);
    }
}

// Renders company public profile
export function renderCompanyProfile(data, viewingSelf = false) {
    const profileNameEl = document.getElementById('profileName');
    const roleTagsEl = document.getElementById('roleTags');
    const publicInfoEl = document.getElementById('publicInfo');
    const extraCardsEl = document.getElementById('extraCards');

    profileNameEl.textContent = data.companyName || 'Unknown';
    addRoleTag('Company', 'company-role');

    let html = '';

    if (data.companyBio) {
        html += `<p><strong>Company Bio:</strong> ${data.companyBio}</p>`;
    }

    // Only show public email if you are viewing yourself
    if (viewingSelf && data.publicEmail) {
        html += `<p><strong>Contact Email:</strong> ${data.publicEmail}</p>`;
    }

    publicInfoEl.innerHTML = html || '<p>No public information available.</p>';

    // Show listings only if it's the company viewing itself
    extraCardsEl.innerHTML = '';
    if (viewingSelf && data.listings && data.listings.length > 0) {
        extraCardsEl.innerHTML = '<h3>Your Listings</h3>';
        data.listings.forEach(listing => {
            const card = document.createElement('div');
            card.className = 'side-card';
            card.innerHTML = `
          <div><strong>${listing.title || 'Untitled Listing'}</strong></div>
          <a href="/templates/company/applicants.html?listingId=${listing.id}">Manage Applicants</a>
        `;
            extraCardsEl.appendChild(card);
        });
    }
}

function addRoleTag(text, className) {
    const roleTags = document.getElementById('roleTags');
    const tag = document.createElement('span');
    tag.className = `role-tag ${className}`;
    tag.textContent = text;
    roleTags.appendChild(tag);
}

export function renderInviteSection(listings) {
    const extraCards = document.getElementById('extraCards');

    const inviteContainer = document.createElement('div');
    inviteContainer.innerHTML = `
      <h3>Invite this Volunteer to a Listing</h3>
      <select id="listingDropdown">
        <option value="">Select a listing...</option>
        ${listings.map(l => `<option value="${l.id}">${l.title || 'Untitled Listing'}</option>`).join('')}
      </select>
      <button id="sendInviteBtn">Send Invite</button>
      <div id="inviteStatus" style="margin-top: 5px; font-size: 0.9rem;"></div>
    `;
    extraCards.appendChild(inviteContainer);
}

export function attachInviteButton(viewingUid) {
    const sendInviteBtn = document.getElementById('sendInviteBtn');
    if (!sendInviteBtn) return;

    sendInviteBtn.addEventListener('click', async () => {
        const selectedListingId = document.getElementById('listingDropdown').value;
        const inviteStatus = document.getElementById('inviteStatus');

        if (!selectedListingId) {
            inviteStatus.textContent = 'Please select a listing first.';
            inviteStatus.style.color = 'orange';
            return;
        }

        try {
            await sendInvite(viewingUid, selectedListingId);
            inviteStatus.textContent = 'Invite sent successfully!';
            inviteStatus.style.color = 'green';
        } catch (err) {
            console.error('Failed to send invite:', err);
            if (err.message.includes('already invited')) {
                inviteStatus.textContent = 'Volunteer was already invited to this listing!';
                inviteStatus.style.color = 'orange';
            } else {
                inviteStatus.textContent = err.message || 'Failed to send invite.';
                inviteStatus.style.color = 'red';
            }
        }
    });
}