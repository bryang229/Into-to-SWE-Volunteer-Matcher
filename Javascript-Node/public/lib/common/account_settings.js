import { setupNav } from '../common/nav_control.js';

document.addEventListener('DOMContentLoaded', async () => {
    await setupNav();

    // Fetch current user data and populate display name
    try {
        const response = await fetch('/api/me', {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch user data');
        const userData = await response.json();
        
        const displayNameInput = document.getElementById('newDisplayName');
        if (displayNameInput && userData.username) {
            displayNameInput.value = userData.username;
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }

    const displayNameForm = document.getElementById('displayNameForm');
    const emailForm = document.getElementById('emailForm');
    const passwordForm = document.getElementById('passwordForm');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');

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

                if (!res.ok) throw new Error('Failed to update');
                alert('Display name updated successfully!');
                window.location.reload();
            } catch (err) {
                console.error('Display name update error:', err);
                alert('Update failed. Please try again.');
            }
        });
    }

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

                if (!res.ok) throw new Error('Failed to update');
                alert('Email updated successfully!');
                window.location.reload();
            } catch (err) {
                console.error('Email update error:', err);
                alert('Update failed. Please try again.');
            }
        });
    }

    if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Password updates are not yet available. Coming soon!');
        });
    }

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', async () => {
            const confirmDelete = confirm('Are you sure you want to delete your account? This action cannot be undone.');
            if (!confirmDelete) return;

            try {
                const res = await fetch('/api/users/delete-account', {
                    method: 'DELETE',
                    credentials: 'include'
                });

                if (!res.ok) throw new Error('Failed to delete account');
                alert('Account deleted successfully.');
                window.location.href = '/templates/index.html';
            } catch (err) {
                console.error('Account deletion error:', err);
                alert('Failed to delete account. Please try again.');
            }
        });
    }
});