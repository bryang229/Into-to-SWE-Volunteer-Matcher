import { setupNav } from "../common/nav_control.js";

document.addEventListener("DOMContentLoaded", async () => {
  await setupNav();

  const container = document.getElementById("applicationsContainer");

  try {
    const res = await fetch("/api/volunteers/my-applications", { credentials: "include" });
    const applications = await res.json();

    if (applications.length === 0) {
      container.innerHTML = "<p>You haven't applied to any listings yet.</p>";
      return;
    }

    container.innerHTML = "";

    for (const app of applications) {
      const listingRes = await fetch(`/api/listings/listing-data?listingId=${app.listingId}`);
      const listing = await listingRes.json();

      const appCard = document.createElement("div");
      appCard.className = "application-card";
      appCard.innerHTML = `
        <h2>${listing.title}</h2>
        <p><strong>Company:</strong> ${listing.companyName}</p>
        <p><strong>Status:</strong> ${app.status}</p>
        <button onclick="window.location.href='/templates/volunteer/application_review.html?applicationId=${app.id}'">
          View Your Submission
        </button>
      `;

      container.appendChild(appCard);
    }

  } catch (err) {
    console.error("Error loading volunteer applications:", err);
    container.innerHTML = "<p>Failed to load applications.</p>";
  }
});