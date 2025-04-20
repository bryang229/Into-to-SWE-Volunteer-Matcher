const logoutBtn = document.getElementById("logoutBtn");
const loginLink = document.getElementById("loginLink");
const hasSession = document.cookie.includes("session");

console.log("Cookie:", document.cookie);

if (hasSession && logoutBtn && loginLink) {
logoutBtn.style.display = "inline-block";
loginLink.style.display = "none";
}

if (logoutBtn) {
logoutBtn.addEventListener("click", async () => {
// console.log("Logout button clicked");
await fetch("/api/logout", { method: "POST" });
document.cookie = "session=; Max-Age=0; path=/";
location.reload();
});
}

const checkCookieSession = () => {

}

const verifyCookiesSession = () => {
    
}