import { fetchUserData } from './dashboard_data.js';

let cachedUserData;
const listingList = document.getElementById("listingList");
// Populate from backend: GET /api/listings/by-company

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const cachedUserData = await fetchUserData();

    if (cachedUserData.accountType === "volunteer") 
        window.location.href = "/templates/volunteer_dashboard.html";
        
  } catch (err) {
    console.error(err);

    setTimeout(() => {
        window.location.href = "/templates/login.html";
    }, 10000);
  }
});


document.getElementById("profileForm").addEventListener("submit", (e) => {
    e.preventDefault();
  
    const profileData = {
      bio: document.getElementById("bio").value.trim(),
      location: document.getElementById("location").value.trim(),
      interests: Array.from(document.getElementById("interests").selectedOptions).map(opt => opt.value),
      age: parseInt(document.getElementById("age").value),
      experience: parseInt(document.getElementById("experience").value),
      privacy: document.getElementById("privacyToggle").checked
    };
  
    console.log("Profile data to submit:", profileData);
  
    // You can now POST this to your backend (e.g. /api/profile/update)
    // fetch("/api/profile/update", { method: "POST", body: JSON.stringify(profileData) })
  });