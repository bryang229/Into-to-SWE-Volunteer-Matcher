document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const listingId = params.get("listingId");
  const container = document.querySelector(".container");

  if (!listingId) {
    container.innerHTML = "<p>Error: Missing listing ID.</p>";
    return;
  }

  container.innerHTML += `<p>Loading applications...</p>`;

  try {
    // Get all applications for the listing
    const res = await fetch(`/api/applications/by-listing?listingId=${listingId}`);
    const applications = await res.json();
    container.innerHTML = `<h1>Applications</h1>`;

    if (!applications.length) {
      container.innerHTML += "<p>No applications found for this listing.</p>";
      return;
    }

    for (const app of applications) {
      // Get applicant data
      const userRes = await fetch(`/api/volunteers/profile?uid=${app.applicantUid}`);
      const user = await userRes.json();

      const appDiv = document.createElement("div");
      appDiv.className = "application";
      appDiv.id = app.id;

      appDiv.innerHTML = `
        <h2>Applicant: ${user.fullname || "Unknown"}</h2>
        <p>Location: ${user.location || "N/A"}</p>
        <p>Status: ${app.status}</p>
        <button onclick="handleDecision('${app.id}', 'accepted')" class="accept-btn">Accept</button>
        <button onclick="handleDecision('${app.id}', 'denied')" class="deny-btn">Deny</button>
        <button onclick="window.location.href='/templates/company/applicant_review.html?applicationId=${app.id}'">
          View Full Application
        </button>
        <p class="decision">Application</p>
      `;
      //edit history
      if (Array.isArray(app.editHistory) && app.editHistory.length > 0) {
        const historyList = document.createElement("ul");
        historyList.innerHTML = "<strong>Edit History:</strong>";
      
        app.editHistory.forEach(dateStr => {
          const date = new Date(dateStr);
          const friendly = date.toLocaleString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          });
          const li = document.createElement("li");
          li.textContent = `Edited on ${friendly}`;
          historyList.appendChild(li);
        });
      
        appDiv.appendChild(historyList);
      }

      container.appendChild(appDiv);
    }

  } catch (err) {
    console.error("Error loading applications:", err);
    container.innerHTML += "<p>Failed to load applications.</p>";
  }
});

function handleDecision(applicationId, decision) {
  const applicationElement = document.getElementById(applicationId);
  if (decision === 'accepted') {
    applicationElement.style.backgroundColor = '#d4edda';
    applicationElement.style.borderColor = '#c3e6cb';
  } else if (decision === 'denied') {
    applicationElement.style.backgroundColor = '#f8d7da';
    applicationElement.style.borderColor = '#f5c6cb';
  }

  document.querySelector(`#${applicationId} .decision`).innerText = `${decision}`;
}