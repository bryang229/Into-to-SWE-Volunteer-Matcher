import { setupNav } from "../common/nav_control.js";

// Simple debounce helper
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  await setupNav();

  const input = document.getElementById("userSearch");
  const suggestions = document.getElementById("suggestions");

  // Handler for selecting a user
  async function selectUser(user) {
    try {
      // Create or retrieve a conversation via your backend
      const res = await fetch(
        `/api/conversations?participantId=${encodeURIComponent(user.uid)}&participantType=${encodeURIComponent(user.type)}`,
        { method: 'POST', credentials: 'include' }
      );
      const { id: convoId } = await res.json();
      window.location.href = `/templates/common/chat.html?conversationId=${convoId}`;
    } catch (err) {
      console.error('Failed to start conversation', err);
      alert('Unable to start chat.');
    }
  }

  // Render suggestion list
  function renderSuggestions(users) {
    suggestions.innerHTML = '';
    users.forEach(u => {
      const li = document.createElement('li');
      li.className = 'chat-item';
      li.style.padding = '0.5rem';
      li.innerHTML = `
        <div class="avatar" style="background-image:url('${u.avatarUrl || ''}')"></div>
        <div class="info">
          <div class="name">${u.name}</div>
          <div class="snippet" style="font-size:0.85rem;color:#777">${u.type}</div>
        </div>
      `;
      li.addEventListener('click', () => selectUser(u));
      suggestions.appendChild(li);
    });
  }

  // Fetch matches from backend
  async function fetchUsers(query) {
    try {
      const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Search failed');
      return await res.json();
    } catch (err) {
      console.error('User search error', err);
      return [];
    }
  }

  // Debounced input handler
  const onInput = debounce(async (e) => {
    const q = e.target.value.trim();
    if (q.length < 2) {
      suggestions.innerHTML = '';
      return;
    }
    suggestions.innerHTML = '<li style="padding:0.5rem;color:#999">Searching...</li>';
    const users = await fetchUsers(q);
    if (users.length) {
      renderSuggestions(users);
    } else {
      suggestions.innerHTML = '<li style="padding:0.5rem;color:#999">No matches found</li>';
    }
  }, 300);

  input.addEventListener('input', onInput);
});