import { setupNav } from '../common/nav_control.js';

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const listingId = params.get("listingId");
    const container = document.querySelector(".container");

    await setupNav();

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
        <button onclick="updateApplicationStatus('${app.id}', 'Accepted')" class="accept-btn">Accept</button>
        <button onclick="updateApplicationStatus('${app.id}', 'Denied')" class="deny-btn">Deny</button>
        <button onclick="updateApplicationStatus('${app.id}', 'In Communication')" class="comm-btn">Contact</button>
        <button onclick="window.location.href='/templates/company/applicant_review.html?applicationId=${app.id}'">
          View Full Application
        </button>
        <p class="decision">Application</p>
      `;

      applyStatusStyle(appDiv, app.status);
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

const updateApplicationStatus=  async (applicationId, newStatus) => {
    const confirmed = confirm(`Are you sure you want to mark this application as "${newStatus}"?`);
    if (!confirmed) return;

    try {
        const res = await fetch("/api/applications/status", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ applicationId, newStatus })
        });

        if (res.ok) {
            alert("Application status updated!");
            location.reload();
        } else {
            const err = await res.json();
            alert("Error: " + (err.error || "Unknown failure"));
        }
    } catch (err) {
        console.error("Failed to update status:", err);
        alert("Something went wrong.");
    }
}

function applyStatusStyle(element, status) {
    if (!element) return;
  
    switch (status.toLowerCase()) {
      case "accepted":
        element.style.backgroundColor = '#d4edda';
        element.style.borderColor = '#c3e6cb';
        break;
      case "denied":
        element.style.backgroundColor = '#f8d7da';
        element.style.borderColor = '#f5c6cb';
        break;
      case "in communication":
        element.style.backgroundColor = '#fff3cd';
        element.style.borderColor = '#ffeeba';
        break;
      default:
        // no change for "Waiting for Review"
        break;
    }
  }


window.updateApplicationStatus = updateApplicationStatus;