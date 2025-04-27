import { setupNav } from '../common/nav_control.js';

document.addEventListener('DOMContentLoaded', async () => {
  await setupNav();

  const params = new URLSearchParams(window.location.search);
  const uid = params.get('uid');

  if (!uid) {
    document.body.innerHTML = '<p>Invalid profile.</p>';
    return;
  }

  try {
    const res = await fetch(`/api/public-profile?uid=${uid}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch profile');

    const data = await res.json();
    document.getElementById('profileName').textContent = data.fullname || data.companyName || 'Unknown';

    const roleTags = document.getElementById('roleTags');
    roleTags.innerHTML = '';

    if (data.accountType === 'volunteer') {
      roleTags.innerHTML += '<span class="role-tag role-volunteer">Volunteer</span>';

      if (Array.isArray(data.listings)) {
        data.listings.forEach(listing => {
          if (listing.status === 'active') {
            roleTags.innerHTML += `<span class="role-tag role-volunteer">Volunteer @ ${listing.companyName || 'Unknown'}</span>`;
          } else {
            roleTags.innerHTML += `<span class="role-tag role-past">Past Volunteer @ ${listing.companyName || 'Unknown'}</span>`;
          }
        });
      }
    } else if (data.accountType === 'company') {
      roleTags.innerHTML += '<span class="role-tag role-company">Company</span>';
    }

    const details = document.getElementById('profileDetails');
    details.innerHTML = '';

    if (data.bio) details.innerHTML += `<p><strong>Bio:</strong> ${data.bio}</p>`;
    if (data.location) details.innerHTML += `<p><strong>Location:</strong> ${data.location}</p>`;
    if (data.interests?.length) details.innerHTML += `<p><strong>Interests:</strong> ${data.interests.join(', ')}</p>`;
    if (data.experience) details.innerHTML += `<p><strong>Experience:</strong> ${data.experience} years</p>`;

  } catch (err) {
    console.error('Profile load error:', err);
    document.body.innerHTML = '<p>Failed to load profile.</p>';
  }
});
