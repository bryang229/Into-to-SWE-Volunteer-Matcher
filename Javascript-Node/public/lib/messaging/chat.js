import { db } from '../auth/firebase-config.js';
import { setupNav } from '../common/nav_control.js';
import { collection, doc, query, orderBy, onSnapshot } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
  await setupNav();

  const params = new URLSearchParams(window.location.search);
  let convoId = params.get('conversationId');
  const participantId = params.get('participantId');
  const participantType = params.get('participantType');

  const partnerNameEl = document.getElementById('chatPartnerName');
  const messagesEl = document.getElementById('chatMessages');
  const inputEl = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');

  let currentUid = null;
  let unsubscribe = null;

  // Fetch current user ID first
  async function fetchMyInfo() {
    const res = await fetch('/api/me', { credentials: 'include' });
    const user = await res.json();
    return user.uid;
  }

  // If no conversation ID, create one
  async function ensureConversation() {
    if (!convoId) {
      if (!participantId || !participantType) {
        alert('Missing conversation identifiers.');
        return;
      }
      const res = await fetch(
        `/api/conversations?participantId=${encodeURIComponent(participantId)}&participantType=${encodeURIComponent(participantType)}`,
        { method: 'POST', credentials: 'include' }
      );
      const data = await res.json();
      convoId = data.id;
      window.history.replaceState({}, '', `?conversationId=${convoId}`);
    }
  }

  async function loadPartnerName() {
    try {
      const res = await fetch(`/api/conversations/chatlog?conversationId=${encodeURIComponent(convoId)}`, {
        credentials: 'include'
      });
      const data = await res.json();
      partnerNameEl.textContent = data.partnerName || 'Chat';
    } catch (err) {
      console.error('Error loading partner name:', err);
    }
  }

  function listenToMessages() {
    const convoRef = doc(db, 'Conversations', convoId);
    const messagesQuery = query(collection(convoRef, 'Messages'), orderBy('sentAt'));

    unsubscribe = onSnapshot(messagesQuery, snapshot => {
      const messages = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          text: data.text,
          sentAt: data.sentAt,
          sentByMe: data.senderUid === currentUid,
          read: (data.readBy || []).includes(currentUid)
        });
      });
      renderMessages(messages);
    });
  }

  function renderMessages(messages) {
    messagesEl.innerHTML = '';

    messages.forEach(msg => {
      const div = document.createElement('div');
      div.className = `message ${msg.sentByMe ? 'sent' : 'received'}`;

      let checkMarks = '';
      if (msg.sentByMe) {
        if (msg.read) {
          checkMarks = '<span class="read-receipt">✓✓</span>';
        } else {
          checkMarks = '<span class="read-receipt">✓</span>';
        }
      }

      div.innerHTML = `
        <div>${msg.text}</div>
        <div class="time">${new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        ${checkMarks}
      `;

      messagesEl.appendChild(div);
    });

    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  sendBtn.addEventListener('click', async () => {
    const text = inputEl.value.trim();
    if (!text) return;

    try {
      const res = await fetch(`/api/conversations/chatlog?conversationId=${encodeURIComponent(convoId)}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error('Failed to send message');
      inputEl.value = '';
      // No need to manually reload, onSnapshot handles updates!
    } catch (err) {
      console.error('Send error:', err);
      alert('Failed to send message.');
    }
  });

  // Main startup
  try {
    currentUid = await fetchMyInfo();
  } catch (err) {
    console.error('Error fetching my info:', err);
    alert('Failed to fetch your account info.');
    return;
  }

  try {
    await ensureConversation();
  } catch (err) {
    console.error('Error ensuring conversation:', err);
    alert('Failed to find or create conversation.');
    return;
  }

  try {
    await loadPartnerName();
  } catch (err) {
    console.error('Error loading partner name:', err);
    alert('Failed to load chat details.');
    return;
  }

  try {
    listenToMessages();
  } catch (err) {
    console.error('Error listening to messages:', err);
    alert('Failed to start live updates.');
    return;
  }
});