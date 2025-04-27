import { setupNav } from '../common/nav_control.js';

document.addEventListener('DOMContentLoaded', async () => {
    await setupNav();

    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');

    input.addEventListener('input', async () => {
        const query = input.value.trim();
        if (!query) {
            results.innerHTML = '';
            return;
        }

        try {
            const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`, {
                credentials: 'include'
              });
            if (!res.ok) {
                console.error('Failed to fetch users');
                results.innerHTML = '<p>Failed to fetch users.</p>';
                return;
            }

            const users = await res.json();
            results.innerHTML = '';

            if (users.length === 0) {
                results.innerHTML = '<p>No users found.</p>';
                return;
            }

            users.forEach(user => {
                const div = document.createElement('div');
                div.className = 'search-item';
                div.innerHTML = `
          <span>${user.name} (${user.type})</span>
        `;
                div.addEventListener('click', () => {
                    window.location.href = `/templates/common/profile.html?uid=${user.uid}`;
                });
                results.appendChild(div);
            });

        } catch (err) {
            console.error('Search error:', err);
            results.innerHTML = '<p>Error searching users.</p>';
        }
    });
});