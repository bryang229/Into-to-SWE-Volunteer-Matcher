import { fetchUserData } from './dashboard_data.js';

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const cachedUserData = await fetchUserData();
        if (cachedUserData.accountType === "volunteer") {
            setTimeout(() => {
                window.location.href = "/templates/volunteer/volunteer_dashboard.html";
            }, 200);
        } else if (cachedUserData.accountType === "company") {
            setTimeout(() => {
                window.location.href = "/templates/company/company_dashboard.html";
            }, 200);
        }

    } catch (err) {
        console.error(err);

        setTimeout(() => {
            window.location.href = "/templates/auth/login.html";
        }, 10000);
    }

});