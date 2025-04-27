import { setupNav } from './nav_control.js';
import { renderVolunteerProfile, renderCompanyProfile } from '../profile/profile_handler.js';
import { fetchVolunteerProfile, fetchCompanyProfile, fetchMyInfo, fetchVolunteerApplications, fetchInvitesSent } from '../profile/profile_backend.js';

// Main startup
(async function initProfile() {
  await setupNav();

  const params = new URLSearchParams(window.location.search);
  const viewingUid = params.get('uid');

  if (!viewingUid) {
    document.getElementById('profileName').textContent = 'Missing profile ID';
    return;
  }

  try {
    const me = await fetchMyInfo();
    const viewingSelf = (me.uid === viewingUid);

    // Try fetching volunteer profile first
    try {
      const volunteerData = await fetchVolunteerProfile(viewingUid);

      if (me.accountType === 'company') {
        const apps = await fetchVolunteerApplications(viewingUid);
        const invites = await fetchInvitesSent(viewingUid);
        const listings = await fetchCompanyListings();

        renderVolunteerProfile(volunteerData, apps, invites, listings, viewingUid);
      } else {
        renderVolunteerProfile(volunteerData);
      }

    } catch (volErr) {
      // Volunteer not found, maybe a company
      try {
        const companyData = await fetchCompanyProfile(viewingUid);
        renderCompanyProfile(companyData, viewingSelf);
      } catch (compErr) {
        console.error('Company profile not found.');
        document.getElementById('publicInfo').innerHTML = '<p>Profile not found.</p>';
      }
    }

  } catch (err) {
    console.error('Profile access error:', err);
    document.getElementById('publicInfo').innerHTML = '<p>Access denied or session expired.</p>';
  }
})();

async function fetchCompanyListings() {
  const res = await fetch('/api/companies/my-listings', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch listings');
  return await res.json();
}