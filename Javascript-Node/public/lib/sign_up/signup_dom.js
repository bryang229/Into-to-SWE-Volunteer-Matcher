//Importing register handlers from handle_signup.js
import { registerVolunteer, registerCompany } from './handle_signup.js';

//Debounce method allows for delayed checks (every 300ms) input is updated 
//Debounce(func, delay) works as a wrapper method, delaying concurrent method calls by delay ms
function debounce(func, delay) {
    let timeoutId; 
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}
//Getting username input tag and username-feedback small tag DOM objects
const usernameInput = document.getElementById("username");
const feedback = document.getElementById("username-feedback");

//Global boolean for controlling whether the user can submit (they can't if they are using a used username)
let isUsernameAvailable = false;

//This function calls the backend's /api/accountType/register route to see if the usernames are usedat 
async function checkUsernameAvailability() {
    const username = usernameInput.value.trim(); //gets current username input
    if (!username) return;

    try {
        //Using NEW /api/check-username?username=query route which checks if the username is in EITHER collection
        const res = await fetch(`/api/check-username?username=${encodeURIComponent(username)}`);
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
    //Getting input field data (these are used in either account type
    const password = document.getElementById("password").value.trim();
    const fullname = document.getElementById("fullname").value.trim();
    const username = document.getElementById("username").value.trim();
    const accountType = document.getElementById("accountType").value; //getting account type

    let result; 
    if (accountType === "volunteer") { 
        const email = document.getElementById("email").value.trim();  //getting volunteer specific data
        result = await registerVolunteer(email, password, username, fullname); //using handler
    } else {
        //getting company specific data
        const publicEmail = document.getElementById("publicEmail").value.trim();
        const privateEmail = document.getElementById("privateEmail").value.trim();
        const companyBio = document.getElementById("companyBio").value.trim();
        const companyName = document.getElementById("companyName").value.trim();
        //using handler
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
            window.location.href = "/templates/auth/login.html";
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