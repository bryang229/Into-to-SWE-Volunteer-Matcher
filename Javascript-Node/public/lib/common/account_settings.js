import { setupNav } from '../common/nav_control.js'; 

document.addEventListener('DOMContentLoaded', async () => {
    setupNav(); // If you have dynamic nav bar loading

    await loadUserData();

    // Handle Display Name Update
    const displayNameForm = document.getElementById('displayNameForm');
    if (displayNameForm) {
        displayNameForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newName = document.getElementById('newDisplayName').value.trim();
            if (!newName) {
                alert('Please enter a valid name.');
                return;
            }
            try {
                const res = await fetch('/api/volunteers/update', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: newName })
                });

                if (!res.ok) throw new Error('Failed to update display name.');
                alert('Display name updated successfully!');
                window.location.reload();
            } catch (error) {
                console.error('Error updating display name:', error);
                alert('Failed to update display name.');
            }
        });
    }

    // Handle Email Update
    const emailForm = document.getElementById('emailForm');
    if (emailForm) {
        emailForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newEmail = document.getElementById('newEmail').value.trim();
            if (!newEmail) {
                alert('Please enter a valid email.');
                return;
            }
            try {
                const res = await fetch('/api/volunteers/update', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: newEmail })
                });

                if (!res.ok) throw new Error('Failed to update email.');
                
                alert('Email updated successfully! Please log in again.');
                await logoutAndRedirect();
            } catch (error) {
                console.error('Error updating email:', error);
                alert('Failed to update email: ' + error.message);
            }
        });
    }

    // Delete Account
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
            try {
                const res = await fetch('/api/user/delete', {
                    method: 'DELETE',
                    credentials: 'include'
                });

                if (!res.ok) throw new Error('Failed to delete account.');
                
                alert('Account deleted successfully.');
                window.location.href = '/';
            } catch (error) {
                console.error('Error deleting account:', error);
                alert('Failed to delete account: ' + error.message);
            }
        });
    }
});

// Function to load user data
async function loadUserData() {
    try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch user data.');
        const userData = await res.json();
        if (userData.username) document.getElementById('newDisplayName').value = userData.username;
        if (userData.email) document.getElementById('newEmail').value = userData.email;
    } catch (error) {
        console.error('Error loading user data:', error);
        alert('Error loading your account information.');
    }
}

// Helper to log out user and redirect to login
async function logoutAndRedirect() {
    try {
        const res = await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Logout failed.');
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        window.location.href = '/templates/auth/login.html'; // Adjust path if needed
    }
}
