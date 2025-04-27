import { setupNav } from "../common/nav_control.js";

document.addEventListener("DOMContentLoaded", async () => {
  await setupNav();
  const chatList = document.getElementById("chatList");
  const newChatBtn = document.getElementById("newChatBtn");
  
  newChatBtn.addEventListener("click", () => {
    window.location.href = "/templates/common/new_chat.html"; 
  });

  try {
    const res = await fetch('/api/conversations', { credentials: 'include' });
    const convos = await res.json();
    chatList.innerHTML = '';

    convos.forEach(convo => {
      const item = document.createElement('div');
      item.className = 'chat-item';
      item.dataset.id = convo.id;
      item.innerHTML = `
        <div class="avatar" style="background-image:url('${convo.avatarUrl}')"></div>
        <div class="info">
          <div class="name">${convo.partnerName}</div>
          <div class="snippet">${convo.lastMessageSnippet}</div>
        </div>
        <div class="time">${new Date(convo.lastMessageAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
      `;
      item.addEventListener('click', () => {
        window.location.href = `/templates/common/chat.html?conversationId=${convo.id}`;
      });
      chatList.appendChild(item);
    });
  } catch (err) {
    console.error('Failed to load conversations', err);
    chatList.innerHTML = '<p>Unable to load conversations.</p>';
  }
});