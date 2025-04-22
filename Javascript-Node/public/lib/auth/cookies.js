export async function logout(){
    await fetch("/api/logout", { method: "POST" });
    document.cookie = "session=; Max-Age=0; path=/";
    location.reload();
}

export async function verifyCookiesSession() {
    try {
      const res = await fetch('/api/sessionVerify');
  
      if (!res.ok) {
        // Optional: log status or handle differently
        throw new Error(`Server responded with status ${res.status}`);
      }
  
      const res_body = await res.json();
      return {
        accountType: res_body.accountType
      };
    } catch (err) {
      console.error("Session verification failed:", err.message);
      return { message: "Failed to verify session, user could be logged out" };
    }
  }