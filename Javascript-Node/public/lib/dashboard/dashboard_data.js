let cachedUserData = null;

export async function fetchUserData() {
  if (cachedUserData) return cachedUserData;
  // console.log('called data handler');
  const res = await fetch("/api/me");
  if (!res.ok) throw new Error("Failed to fetch user data");

  cachedUserData = await res.json();
  return cachedUserData;
}

export async function fetchCompanyInvitesSent() {
  const res = await fetch('/api/companies/invites-sent', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch invites');
  return await res.json();
}

export async function fetchVolunteerInvitesReceived() {
  const res = await fetch('/api/volunteers/my-invites', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch invites');
  return await res.json();
}