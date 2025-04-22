let cachedUserData = null;

export async function fetchUserData() {
  if (cachedUserData) return cachedUserData;
  // console.log('called data handler');
  const res = await fetch("/api/me");
  if (!res.ok) throw new Error("Failed to fetch user data");

  cachedUserData = await res.json();
  return cachedUserData;
}