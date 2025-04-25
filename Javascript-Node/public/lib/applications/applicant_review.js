import { setupNav } from "../common/nav_control.js";

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const applicationId = params.get("applicationId");
  
    await setupNav();

    if (!applicationId) {
      alert("Missing applicationId in URL");
      return;
    }
  
    try {
      const appRes = await fetch(`/api/applications/application-data?applicationId=${applicationId}`);
      const application = await appRes.json();
  
      const listingRes = await fetch(`/api/listings/listing-data?listingId=${application.listingId}`);
      const listing = await listingRes.json();
  
      const volunteerRes = await fetch(`/api/volunteers/profile?uid=${application.applicantUid}`);
      const volunteer = await volunteerRes.json();
  
      // 1. Listing info
      document.getElementById("listingInfo").innerHTML = `
        <h2>Listing</h2>
        <p><strong>Title:</strong> ${listing.title}</p>
        <p><strong>Company:</strong> ${listing.companyName}</p>
      `;
  
      // 2. Volunteer info
      document.getElementById("applicantProfile").innerHTML = `
        <h2>Applicant Info</h2>
        <p><strong>Name:</strong> ${volunteer.fullname}</p>
        <p><strong>Location:</strong> ${volunteer.location || "N/A"}</p>
        <p><strong>Interests:</strong> ${volunteer.interests?.join(", ") || "N/A"}</p>
      `;
  
      // 3. Application answers
      const qaList = application.answers?.map(ans => `
        <div class="qa-pair">
          <strong>${ans.question}</strong>
          <p>${ans.answer}</p>
        </div>
      `).join("") || "<p>No answers submitted.</p>";
  
      document.getElementById("applicationAnswers").innerHTML = `
        <h2>Answers</h2>
        ${qaList}
      `;
  
      // 4. Edit history
      if (Array.isArray(application.editHistory) && application.editHistory.length) {
        const edits = application.editHistory.map(dateStr => {
          const d = new Date(dateStr);
          return `<li>${d.toLocaleString()}</li>`;
        }).join("");
        document.getElementById("editHistory").innerHTML = `
          <h2>Edit History</h2>
          <ul>${edits}</ul>
        `;
      }
  
    } catch (err) {
      console.error("Failed to load applicant data:", err);
      document.body.innerHTML = "<p>Error loading application.</p>";
    }
  });