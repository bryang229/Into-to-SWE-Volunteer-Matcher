import { auth } from './firebase-config.js';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';

function resetPassword() {
    const email = prompt("Enter your email");
    if (email) {
        firebase.auth().sendPasswordResetEmail(email)
            .then(() => alert("Check your inbox"))
            .catch(err => alert("Error: " + err.message));
    }
}

document.getElementById("forgotPassword").addEventListener("click", resetPassword);
//Submit handler
document.querySelector(".signup-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();

        const res = await fetch("/api/sessionLogin", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }), // must be this exact shape
        });


        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unknown error");

        if (res.ok) {
            window.location.href = '/templates/dashboard.html'; // or wherever your app redirects
        } else {
            document.getElementById('errorMessage').innerText = data.error || 'Login failed';
        }
    } catch (err) {
        document.getElementById('errorMessage').innerText = 'An error occurred' + err.message;
    }
});