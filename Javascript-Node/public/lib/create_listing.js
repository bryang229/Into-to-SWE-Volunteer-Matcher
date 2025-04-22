document.getElementById("logout-btn").addEventListener("click" , async () =>{
    try {
        const res = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        if (res.ok) {
            document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            window.location.href = '/templates/login.html';
        }
    } catch (err) {
        console.error('Logout failed:', err);
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("listingForm");
    const companyField = document.getElementById("company");

    // Auth check with retries
    async function checkAuth(retries = 2) {
        while (retries >= 0) {
            try {
                // Debug cookie information
                const allCookies = document.cookie;
                console.log('Cookie debug:', {
                    raw: allCookies,
                    parsed: document.cookie.split(';').map(c => c.trim())
                });

                const res = await fetch("/api/me", {
                    method: 'GET',
                    credentials: "include",
                    headers: {
                        "Cache-Control": "no-cache",
                        "Content-Type": "application/json"
                    }
                });

                const responseText = await res.text();
                console.log('Raw server response:', responseText);

                let data;
                try {
                    data = JSON.parse(responseText);
                    console.log('Parsed data:', data);

                    // Check the actual structure we're getting
                    console.log('Data check:', {
                        data: data,
                        type: typeof data,
                        hasRole: 'role' in data,
                        role: data?.role,
                        keys: Object.keys(data)
                    });

                    if (!data) {
                        throw new Error('Empty data from server');
                    }

                    // Check if role exists before accessing
                    if (!('role' in data)) {
                        console.error('Missing role in data:', data);
                        throw new Error('No role found in user data');
                    }

                    return data;
                } catch (e) {
                    console.error('Data processing error:', e);
                    throw e;
                }
            } catch (err) {
                console.error('Auth check error details:', {
                    attempt: 2 - retries,
                    error: err.message,
                    stack: err.stack
                });

                if (retries <= 0) {
                    document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    throw err;
                }
                retries--;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    try {
        const userData = await checkAuth();
        console.log('Final user data for redirect decision:', {
            role: userData.role,
            normalizedRole: userData.role?.toLowerCase?.(),
            isVolunteer: userData.role === 'volunteer',
            isCompany: userData.role === 'company'
        });

        // Update role checks to be more explicit
        const userRole = (userData.role || '').toLowerCase().trim();

        if (userRole === 'volunteer') {
            console.log('Volunteer detected - redirecting to listings');
            window.location.replace("/templates/listings.html");
            return;
        }

        if (userRole === 'company') {
            console.log('Company detected - staying on page');
        } else {
            console.log('Unknown role detected - redirecting to index');
            window.location.replace("/templates/index.html");
            return;
        }

        companyField.value = userData.companyName || 'Unknown Company';
    } catch (err) {
        console.error("Auth error:", err.message);
        window.location.replace("/templates/login.html");
        return;
    }

    // Form submit logic
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const listing = {
            title: document.getElementById("title").value.trim(),
            location: document.getElementById("location").value.trim(),
            date: document.getElementById("date").value,
            company: companyField.value.trim(),
            tags: document.getElementById("tags").value.split(",").map(tag => tag.trim()),
            description: document.getElementById("description").value.trim()
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