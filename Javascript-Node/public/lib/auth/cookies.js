export async function logout() {
  await fetch("/api/logout", { method: "POST" });
  // Delete session cookie
  document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  // Delete accountType cookie
  document.cookie = "accountType=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  location.reload();
}

export async function verifyCookiesSession() {
  try {
    const res = await fetch('/api/sessionVerify', { credentials: 'include' });

    if (!res.ok) {
      return { accountType: null }; // Explicitly say "no accountType"
    }

    const data = await res.json();
    return { accountType: data.accountType || null }; // default if missing
  } catch (err) {
    console.warn("verifyCookiesSession failed:", err.message);
    return { accountType: null }; // fallback
  }
}