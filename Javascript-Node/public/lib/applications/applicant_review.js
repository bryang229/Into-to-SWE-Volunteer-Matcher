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

        //status
        const container = document.querySelector(".container");
        applyStatusStyle(container, application.status);
        const statusBadge = document.createElement("p");
        statusBadge.innerHTML = `
        <strong>Status:</strong> ${application.status}
        <button onclick="updateApplicationStatus('${application.id}', 'Accepted')" class="accept-btn">Accept</button>
        <button onclick="updateApplicationStatus('${application.id}', 'Denied')" class="deny-btn">Deny</button>
        <button onclick="updateApplicationStatus('${application.id}', 'In Communication')" class="comm-btn">Contact</button>
        `
        ;
        container.prepend(statusBadge); // or wherever you want it

        // 2. Volunteer Info (dynamic rendering)
        const profileSection = document.getElementById("applicantProfile");
        profileSection.innerHTML = `<h2>Applicant Info</h2>`;

        const fieldsToShow = [
            { label: "Name", field: "fullname" },
            { label: "Location", field: "location" },
            { label: "Bio", field: "bio" },
            { label: "Interests", field: "interests" }
        ];

        fieldsToShow.forEach(({ label, field }) => {
            let value = volunteer[field];

            if (Array.isArray(value)) {
                value = value.join(", ");
            }

            profileSection.appendChild(
                renderPrivateAwareField(label, value, field, applicationId)
            );
        });

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

//Request access handler
document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("request-access-btn")) {
        const field = e.target.dataset.field;
        const appId = e.target.dataset.appId;
        const confirmRequest = confirm(`Request access to the "${field}" field?`);

        if (!confirmRequest) return;

        try {
            const res = await fetch("/api/applications/request-access", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ applicationId: appId, field })
            });

            const data = await res.json();
            alert(data.message || "Request sent!");
        } catch (err) {
            console.error("Request access failed:", err);
            alert("Failed to submit request.");
        }
    }
});

// Methods ----
function renderPrivateAwareField(label, value, field, applicationId) {
    const container = document.createElement("div");
    if (value === "[Private]") {
        container.innerHTML = `
        <p><strong>${label}:</strong> <em>Private</em>
          <button class="request-access-btn" data-field="${field}" data-app-id="${applicationId}">
            Request Access
          </button>
        </p>`;
    } else {
        container.innerHTML = `<p><strong>${label}:</strong> ${value}</p>`;
    }
    return container;
}

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