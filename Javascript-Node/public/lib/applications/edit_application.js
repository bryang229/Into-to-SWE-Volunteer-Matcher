import { verifyCookiesSession } from '../auth/cookies.js';
import { setupNav } from '../common/nav_control.js'

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const applicationId = params.get("applicationId");
    let accountType;
    try {
        accountType = await verifyCookiesSession();
        await setupNav(accountType);
    } catch (err){
        alert(err.message);
        window.location.href = "/templates/auth/login.html";

    }

    if (!applicationId) {
      alert("No application ID provided.");
      return;
    }
  
    // Fetch application data
    const appRes = await fetch(`/api/applications/application-data?applicationId=${applicationId}`);
    const application = await appRes.json();
  
    if (application.status !== "Waiting for Review") {
      alert("This application is not editable.");
      document.getElementById("editApplicationForm").style.display = "none";
      return;
    }
  
    // Fetch listing data
    const listingRes = await fetch(`/api/listings/listing-data?listingId=${application.listingId}`);
    const listing = await listingRes.json();
  
    // Render listing info
    document.getElementById("listing-details").innerHTML = `
      <h2>${listing.title}</h2>
      <p><strong>Company:</strong> ${listing.companyName}</p>
      <p><strong>Date:</strong> ${listing.date}</p>
      <p>${listing.description}</p>
    `;
  
    // Render editable questions
    const container = document.getElementById("questions-container");
    const answers = application.answers || [];
  
    answers.forEach(({ question, answer }, index) => {
      const wrapper = document.createElement("div");
      wrapper.className = "question-block";
  
      const label = document.createElement("label");
      label.htmlFor = `q${index}`;
      label.textContent = question;
  
      const textarea = document.createElement("textarea");
      textarea.name = `q${index}`;
      textarea.id = `q${index}`;
      textarea.value = answer;
      textarea.required = true;
  
      wrapper.appendChild(label);
      wrapper.appendChild(textarea);
      container.appendChild(wrapper);
    });
  
    // Handle resubmit
    document.getElementById("editApplicationForm").addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const updatedAnswers = answers.map((ans, i) => ({
        question: ans.question,
        answer: document.getElementById(`q${i}`).value.trim()
      }));
  
      const response = await fetch(`/api/applications/application-data?applicationId=${applicationId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          answers: updatedAnswers,
          edited: true
        })
      });
  
      if (response.ok) {
        alert("Application updated successfully.");
        window.location.href = "/templates/volunteer/volunteer_dashboard.html";
      } else {
        const error = await response.json();
        alert("Failed to update: " + (error.error || "Unknown error"));
      }
    });
  });