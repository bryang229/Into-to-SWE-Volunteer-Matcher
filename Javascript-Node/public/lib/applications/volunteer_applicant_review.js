import { setupNav } from "../common/nav_control.js";

document.addEventListener("DOMContentLoaded", async () => {
  await setupNav();

  const params = new URLSearchParams(window.location.search);
  const applicationId = params.get("applicationId");

  if (!applicationId) {
    alert("Missing application ID.");
    return;
  }

  const listingSection = document.getElementById("listingInfo");
  const answersSection = document.getElementById("applicationAnswers");
  const actionsSection = document.getElementById("actions");

  try {
    const appRes = await fetch(`/api/applications/application-data?applicationId=${applicationId}`, { credentials: "include" });
    const application = await appRes.json();

    const listingRes = await fetch(`/api/listings/listing-data?listingId=${application.listingId}`, { credentials: "include" });
    const listing = await listingRes.json();

    // Listing info
    listingSection.innerHTML = `
      <h2>Listing Info</h2>
      <p><strong>Title:</strong> ${listing.title}</p>
      <p><strong>Company:</strong> ${listing.companyName}</p>
    `;

    // Answers
    const qaList = application.answers?.map(ans => `
      <div class="qa-pair">
        <strong>${ans.question}</strong>
        <p>${ans.answer}</p>
      </div>
    `).join("") || "<p>No answers submitted.</p>";

    answersSection.innerHTML = `
      <h2>Your Answers</h2>
      ${qaList}
      <p><strong>Application Status:</strong> ${application.status}</p>
    `;

    // Actions
    if (application.status.toLowerCase() === "waiting for review") {
      actionsSection.innerHTML = `
        <button id="editApplicationBtn">Edit Your Application</button>
      `;

      document.getElementById("editApplicationBtn").addEventListener("click", () => {
        window.location.href = `/templates/volunteer/edit_application.html?applicationId=${applicationId}`;
      });
    } else {
      actionsSection.innerHTML = `
        <h2>Reveal More Info?</h2>
        <p>You can choose to reveal additional private information (like your location or bio) to the company if you wish.</p>
        <button id="revealInfoBtn">Reveal Info to Company</button>
      `;

      document.getElementById("revealInfoBtn").addEventListener("click", async () => {
        const confirmReveal = confirm("Are you sure you want to reveal your private fields?");
        if (!confirmReveal) return;

        try {
          const res = await fetch(`/api/applications/reveal-info`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ applicationId })
          });

          if (res.ok) {
            alert("Your information has been revealed to the company.");
            location.reload();
          } else {
            const err = await res.json();
            alert("Error: " + (err.error || "Unknown failure."));
          }
        } catch (err) {
          console.error("Failed to reveal info:", err);
          alert("Something went wrong.");
        }
      });
    }

  } catch (err) {
    console.error("Failed to load application:", err);
    document.body.innerHTML = "<p>Failed to load application details.</p>";
  }
});