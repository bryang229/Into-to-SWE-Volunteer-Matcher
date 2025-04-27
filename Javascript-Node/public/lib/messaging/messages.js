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
      
      let timeText = '';
      if (convo.lastMessageAt && convo.lastMessageAt._seconds) {
        timeText = new Date(convo.lastMessageAt._seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
      }
    
      item.innerHTML = `
        <div class="avatar" style="background-image:url('${convo.avatarUrl}')"></div>
        <div class="info">
          <div class="name">${convo.partnerName}</div>
          <div class="snippet">${convo.lastMessageSnippet || "No messages yet"}</div>
        </div>
        <div class="time">${timeText}</div>
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