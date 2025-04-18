// signup_dom.js
import { registerVolunteer, registerCompany } from './handle_signup.js';

function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

const usernameInput = document.getElementById("username");
const feedback = document.getElementById("username-feedback");

//checks for username availability
let isUsernameAvailable = false;

async function checkUsernameAvailability() {
    const username = usernameInput.value.trim();
    if (!username) return;

    try {
        //Check if they're a company or not
        const isCompany = document.getElementById("accountType").value === "company";
        console.log(isCompany , isCompany ? "companies" : "volunteers")
        const res = await fetch(`/api/${isCompany ? "companies" : "volunteers"}/check-username?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        isUsernameAvailable = data.available;
        feedback.className = "feedback-message";
        if (data.available) {
            feedback.textContent = "Username is available";
            feedback.style.color = "green";
        } else {
            feedback.textContent = "Username is taken";
            feedback.style.color = "red";
        }
        // Enable/disable submit

        document.getElementById("sign_up_submit").disabled = !data.available;
    } catch (err) {
        console.error("Username check failed:", err);
        feedback.textContent = "Error checking username";
        feedback.style.color = "orange";
        isUsernameAvailable = false;
        document.getElementById("sign_up_submit").disabled = true;
    }
}

// Debounce binding
// Wrap the checker with debounce (300ms delay)
const debouncedCheck = debounce(checkUsernameAvailability, 300);


//Username check - Bind to input event (fires as user types)
usernameInput.addEventListener("input", debouncedCheck);

//Submit handler
document.querySelector(".signup-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = document.getElementById("password").value.trim();
    const fullname = document.getElementById("fullname").value.trim();
    const username = document.getElementById("username").value.trim();
    const accountType = document.getElementById("accountType").value;

    let result;
    if (accountType === "volunteer") {
        const email = document.getElementById("email").value;
        result = await registerVolunteer(email, password, username, fullname);
    } else {
        const publicEmail = document.getElementById("publicEmail").value.trim();
        const privateEmail = document.getElementById("privateEmail").value.trim();
        const companyBio = document.getElementById("companyBio").value.trim();
        const companyName = document.getElementById("companyName").value.trim();
        result = await registerCompany(privateEmail, password, {
            companyName,
            admin_fullname: fullname,
            username,
            publicEmail,
            privateEmail,
            companyBio
        });
    }

    if (result.success) {
        alert("Registered successfully!");

        // Delay a little for the user to see it (optional)
        setTimeout(() => {
            window.location.href = "/templates/login.html";
        }, 1000);
    } else {
        alert("Error sign up failed " + result.message);
    }

});


//Toggle company only info
document.getElementById("accountType").addEventListener("change", (e) => {
    const isCompany = e.target.value === "company";
    //hide or show needed fields per type
    document.getElementById("company-only-fields").style.display = isCompany ? "block" : "none";
    document.getElementById("volunteerEmail").style.display = isCompany ? "none" : "block";

    //label update
    document.getElementById("fullnameLabel").innerText = isCompany ? "Admin Full Name" : " Full Name";


    // Company-only required fields
    const companyRequiredFields = ["companyName", "publicEmail", "privateEmail", "companyBio"];
    const volunteerRequiredFields = ["email"];

    // Toggle required attributes
    companyRequiredFields.forEach(id => {
        document.getElementById(id).required = isCompany;
    });

    volunteerRequiredFields.forEach(id => {
        document.getElementById(id).required = !isCompany;
    });
});