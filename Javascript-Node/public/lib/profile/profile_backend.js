// Backend API calls related to profiles

// Fetch your own account info
export async function fetchMyInfo() {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (!res.ok) throw new Error('Session invalid');
    return await res.json();
}

// Fetch public volunteer profile
export async function fetchVolunteerProfile(uid) {
    const res = await fetch(`/api/volunteer-profile?uid=${encodeURIComponent(uid)}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Volunteer not found');
    return await res.json();
}

// Fetch public company profile
export async function fetchCompanyProfile(uid) {
    const res = await fetch(`/api/company-profile?uid=${encodeURIComponent(uid)}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Company not found');
    return await res.json();
}

// Fetch volunteer applications relative to company
export async function fetchVolunteerApplications(uid) {
    const res = await fetch(`/api/companies/checkIfApplicant?uid=${encodeURIComponent(uid)}`, { credentials: 'include' });
    if (!res.ok) throw new Error('No applications found');
    return await res.json();
}

// Fetch invites sent to a user
export async function fetchInvitesSent(uid) {
    const res = await fetch(`/api/companies/invites-sent?uid=${encodeURIComponent(uid)}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load invites');
    return await res.json();
}

// Send a new invite
export async function sendInvite(volunteerUid, listingId) {
    const res = await fetch(`/api/companies/invite-volunteer?volunteerUid=${volunteerUid}&listingId=${listingId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify()
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Invite failed');
    }
}