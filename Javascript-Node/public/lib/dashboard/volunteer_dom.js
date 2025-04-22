import { fetchUserData } from './dashboard_data.js';

let cachedUserData;
const applicationList = document.getElementById("applicationList");

// Populate from backend: GET /api/applications
document.addEventListener("DOMContentLoaded", async () => {
  try {
    cachedUserData = await fetchUserData();

    if (cachedUserData.accountType === "company")
      window.location.href = "/templates/company_dashboard.html";
    populateFields(cachedUserData);
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
    interests: getSelectedInterests(),
    age: parseInt(document.getElementById("age").value),
    experience: parseInt(document.getElementById("experience").value),
    privacy: document.getElementById("privacyToggle").checked
  };

  console.log("Profile data to submit:", profileData);

  // You can now POST this to your backend (e.g. /api/profile/update)
  fetch("/api/volunteers/update", { method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(profileData)
  });
});
const toggle = document.getElementById("interestToggle");
const options = document.getElementById("interestOptions");
const label = document.getElementById("dropdownLabel");

toggle.addEventListener("click", () => {
  toggle.parentElement.classList.toggle("active");
});

options.addEventListener("change", () => {
  const selected = Array.from(options.querySelectorAll('input[type="checkbox"]:checked'))
    .map(cb => cb.value);

  label.textContent = selected.length
    ? `Interests: ${selected.join(", ")}`
    : "Select Interests";
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (!toggle.parentElement.contains(e.target)) {
    toggle.parentElement.classList.remove("active");
  }
});

function getSelectedInterests() {
  return Array.from(options.querySelectorAll('input[type="checkbox"]:checked'))
    .map(cb => cb.value);
}
const populateFields = (user) => {
  // console.log('called dom handler');
  // console.log(user);
  // const user = cachedUserData;
  document.getElementById('bio').value = user.bio || '';
  document.getElementById('location').value = user.location || '';
  document.getElementById('age').value = user.age || '';
  document.getElementById('experience').value = user.experience || '';

  // Privacy toggle
  document.getElementById('privacyToggle').checked = !!user.privacy;

  // Interests (array of strings)
  if (Array.isArray(user.interests)) {
    const allCheckboxes = document.querySelectorAll('#interestOptions input[type="checkbox"]');
    allCheckboxes.forEach(cb => {
      cb.checked = user.interests.includes(cb.value);
    });
  }
};