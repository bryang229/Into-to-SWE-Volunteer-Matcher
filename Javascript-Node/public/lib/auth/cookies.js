export async function logout(){
    await fetch("/api/logout", { method: "POST" });
    document.cookie = "session=; Max-Age=0; path=/";
    location.reload();
}

export async function verifyCookiesSession() {
    try {
        let res = await fetch('/api/sessionVerify');
        res_body = await res.json();
        return {
            accountType : res_body.accountType
        }
    } catch(err) {
        return {"message" : Error("Failed to verify session, user could be logged out")}
    }
}