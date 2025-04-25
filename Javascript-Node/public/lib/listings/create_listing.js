import { setupNav } from "../common/nav_control.js";

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("listingForm");
    const companyField = document.getElementById("company");

    const getUserData = async (retries = 2) => {
        while (retries-- >= 0) {
            try {
                const res = await fetch("/api/me", {
                    method: 'GET',
                    credentials: "include",
                    headers: {
                        "Cache-Control": "no-cache",
                        "Content-Type": "application/json"
                    }
                });
                const text = await res.text();
                const data = JSON.parse(text);

                if (!data?.accountType) throw new Error("Invalid or missing accountType");

                return data;
            } catch (err) {
                console.warn(`Auth check failed (retries left: ${retries})`, err.message);
                if (retries < 0) throw err;
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    };

    const routeUser = (user) => {
        const role = user.accountType?.toLowerCase()?.trim();
        if (role === 'volunteer') {
            window.location.replace("/templates/index.html");
        } else if (role === 'company') {
            const name = user.companyName || user.company_name || "Unknown Company";
            companyField.value = name;
        } else {
            window.location.replace("/templates/index.html");
        }
    };

    try {
        const user = await getUserData();
        routeUser(user);
        setupNav(user.accountType)
    } catch {
        window.location.replace("/templates/auth/login.html");
    }


    // Form submit logic
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const questions = [];
        if (toggle.checked) {
            questionList.querySelectorAll("input").forEach(input => {
                const q = input.value.trim();
                if (q) questions.push(q);
            });
        }

        const listing = {
            title: document.getElementById("title").value.trim(),
            location: document.getElementById("location").value.trim(),
            date: document.getElementById("date").value,
            companyName: companyField.value.trim(),
            tags: document.getElementById("tags").value.split(",").map(tag => tag.trim()),
            description: document.getElementById("description").value.trim(),
            questions: questions.length > 0 ? questions : undefined,
        };

        try {
            const res = await fetch("/api/listings/create-listing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(listing)
            });

            if (res.ok) {
                alert("Listing submitted successfully!");
                window.location.href = "/templates/index.html";
            } else {
                const data = await res.json();
                alert("Failed to submit listing: " + data.error);
            }
        } catch (err) {
            console.error("Fetch error:", err);
            alert("Network or server error. Check console.");
        }
    });

});
// Adding additional fields/toggling fields
const toggle = document.getElementById("includeQuestionsToggle");
const questionSection = document.getElementById("questionSection");
const questionList = document.getElementById("questionList");
const addQuestionBtn = document.getElementById("addQuestionBtn");

toggle.addEventListener("change", () => {
    questionSection.style.display = toggle.checked ? "block" : "none";
});

addQuestionBtn.addEventListener("click", () => {
    const div = document.createElement("div");
    div.className = "question-card";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter your question";

    const removeBtn = document.createElement("button");
    removeBtn.innerText = "X";
    removeBtn.className = "remove-question";
    removeBtn.addEventListener("click", () => div.remove());

    div.appendChild(input);
    div.appendChild(removeBtn);

    questionList.appendChild(div);
});