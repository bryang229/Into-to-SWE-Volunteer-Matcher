console.log('Script loaded, setting up logout listener');

const logoutBtn = document.getElementById("logout-btn");
if (!logoutBtn) {
    console.error('Logout button not found!');
} else {
    console.log('Logout button found, adding listener');
    logoutBtn.addEventListener("click", async () => {
        console.log('Logout clicked');
        try {
            const res = await fetch('/api/logout', {  // Changed from '/api/auth/logout'
                method: 'POST',
                credentials: 'include'
            });
            console.log('Logout response:', res);
            if (res.ok) {
                document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                window.location.href = '/templates/auth/login.html';
            } else {
                alert('Logout failed: ' + res.statusText);
            }
        } catch (err) {
            console.error('Logout failed:', err);
            alert('Logout failed: ' + err.message);
        }
    });
}

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
                        hasRole: 'accountType' in data,
                        accountType: data?.accountType,
                        keys: Object.keys(data)
                    });

                    if (!data) {
                        throw new Error('Empty data from server');
                    }

                    // Check if accountType exists before accessing
                    if (!('accountType' in data)) {
                        console.error('Missing accountType in data:', data);
                        throw new Error('No accountType found in user data');
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
                    console.warn("Session validation failed; will redirect but not delete cookie yet.");
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
            accountType: userData.accountType,
            normalizedRole: userData.accountType?.toLowerCase?.(),
            isVolunteer: userData.accountType === 'volunteer',
            isCompany: userData.accountType === 'company'
        });

        // Update accountType checks to be more explicit
        const userRole = (userData.accountType || '').toLowerCase().trim();

        if (userRole === 'volunteer') {
            console.log('Volunteer detected - redirecting to home page');
            window.location.replace("/templates/index.html");
            return;
        }

        if (userRole === 'company') {
            console.log('Company detected - staying on page');
            
            // Debug: Log the entire userData object
            console.log('Full user data:', JSON.stringify(userData, null, 2));
            
            // Debug: Check if company field exists
            console.log('Company field element:', companyField);
            console.log('Company field properties:', {
                id: companyField.id,
                value: companyField.value,
                readOnly: companyField.readOnly
            });
            
            // Set and verify company name
            const companyName = userData.autofilledCompany || 
                              userData.companyName || 
                              userData.company_name ||
                              userData.name ||  // Try 'name' field too
                              'Unknown Company';
                              
            companyField.value = companyName;
            
            // Debug: Verify the value was set
            console.log('Attempted to set company name to:', companyName);
            console.log('Company field value after setting:', companyField.value);
        } else {
            console.log('Unknown accountType detected - redirecting to index');
            window.location.replace("/templates/index.html");
            return;
        }

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