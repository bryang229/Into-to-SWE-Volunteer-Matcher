import { fetchUserData } from "../dashboard/dashboard_data.js";
import { setupNav } from "../common/nav_control.js"

document.addEventListener("DOMContentLoaded", async () => {

    const params = new URLSearchParams(window.location.search);

    const user = await fetchUserData();
    const accountType = user?.accountType;
    console.log("Verified session, account type:", accountType);

    await setupNav(accountType); // pass to setupNav for rendering navLinks

    if (!accountType) {
        setTimeout(() => {
            window.location.href = "/templates/volunteer/volunteer_dashboard.html";
        }, 10000);
        return;
    }
    const listingId = params.get("listingId");
    
    //Front check if already applied
    const alreadyApplied = user.applications?.some(app => app.listingId === listingId);

    if (alreadyApplied) {
        alert("You’ve already applied to this listing.");
        setTimeout(() => {
            window.location.href = "/templates/volunteer/volunteer_dashboard.html";
        }, 100);
        return;
    }

    if (!listingId) {
        alert("No listing ID provided");
        return;
    }
    const listingRes = await fetch(`/api/listings/listing-data?listingId=${listingId}`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            listingId
        })
    });
    if (!listingRes.ok) {
        alert("Listing not found");
        return;
    }
    const listing = await listingRes.json();

    // Display basic listing info
    const details = document.getElementById("listing-details");
    details.innerHTML = `
      <h2>${listing.title}</h2>
      <p><strong>Date:</strong> ${listing.date}</p>
      <p><strong>Location:</strong> ${listing.location}</p>
      <p><strong>Company:</strong> ${listing.companyName}</p>
      <p>${listing.description}</p>
    `;

    //Render title fully
    document.querySelector(".nav-title").innerText += ` ${listing.title}: ${listing.companyName}`;

    // Render question inputs
    const questionsContainer = document.getElementById("questions-container");
    const questions = listing.questions || [];

    questions.forEach((question, index) => {
        const wrapper = document.createElement("div");
        wrapper.className = "question-block";

        const label = document.createElement("label");
        label.htmlFor = `q${index}`;
        label.textContent = question;

        const textarea = document.createElement("textarea");
        textarea.name = `q${index}`;
        textarea.id = `q${index}`;
        textarea.required = true;

        wrapper.appendChild(label);
        wrapper.appendChild(textarea);
        questionsContainer.appendChild(wrapper);
    });

    // Handle form submit
    document.getElementById("applicationForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        const answers = questions.map((q, i) => {
            return {
                question: q,
                answer: document.getElementById(`q${i}`).value.trim()
            };
        });

        const response = await fetch("/api/applications/apply", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                listingId,
                answers: answers
            })
        });

        if (response.ok) {
            alert("Application submitted!");
            window.location.href = "/templates/index.html";
        } else {
            const err = await response.json();
            alert("Failed to apply: " + (err.error || "Unknown error"));
        }
    });
});