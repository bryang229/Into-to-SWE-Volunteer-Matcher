//Imports from firebase-config to authenticate session, reset user passwords, and sign them in
import { auth, signInWithEmailAndPassword } from '../auth/firebase-config.js';

//Reset password handler (Untested)
function resetPassword() {
    const email = prompt("Enter your email"); //Ask's user to enter their email
    if (email) { //verifies input
        firebase.auth().sendPasswordResetEmail(email) //sends API call to reset the emails password
            .then(() => alert("Check your inbox")) //alert user
            .catch(err => alert("Error: " + err.message)); //let user know of an error
    }
}
//attach reset password handler to click handler of forgotPassword text
document.getElementById("forgotPassword").addEventListener("click", resetPassword);
//Submit handler
document.querySelector(".login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    //Getting email/password, trimming any extra space
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
        //Signing in
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        //Getting firebase provided idToken to create sessionCookie (backend)
        const idToken = await userCredential.user.getIdToken();
        console.log("Got ID Token:", idToken); // DEBUG LINE
        //Sending idToken so backend can make cookie
        console.log("Sending POST to /api/sessionLogin...");

        const res = await fetch("/api/sessionLogin", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // <--- CRITICAL FOR COOKIES
            body: JSON.stringify({ idToken }), // must be this exact shape

        });
        console.log("Server responded with:", res.status);

        //Response to json to verify the response
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unknown error");

        if (res.ok) {
            setTimeout(() => {
                window.location.href = '/templates/auth/dashboard_router.html';
            }, 100);
        } else {
            document.getElementById('errorMessage').innerText = data.error || 'Login failed';
        }
    } catch (error) {
        document.getElementById('errorMessage').innerText = "Firebase login error: " + error.code + " " + error.message;
        console.error("Login error:", error);
    }
});