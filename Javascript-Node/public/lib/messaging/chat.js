import { db } from '../auth/firebase-config.js';
import { setupNav } from '../common/nav_control.js';
import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
  await setupNav();

  const params = new URLSearchParams(window.location.search);
  let convoId = params.get('conversationId');
  const participantId = params.get('participantId');
  const participantType = params.get('participantType');

  const partnerNameEl = document.getElementById('chatPartnerName');
  const typingIndicator = document.getElementById('typingIndicator');
  const messagesEl = document.getElementById('chatMessages');
  const inputEl = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');

  let currentUid = null;
  let partnerUid = null;
  let unsubscribe = null;

  async function fetchMyInfo() {
    const res = await fetch('/api/me', { credentials: 'include' });
    const user = await res.json();
    return user.uid;
  }

  async function ensureConversation() {
    if (!convoId) {
      if (!participantId || !participantType) {
        alert('Missing conversation identifiers.');
        return;
      }
      const res = await fetch(`/api/conversations?participantId=${encodeURIComponent(participantId)}&participantType=${encodeURIComponent(participantType)}`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      convoId = data.id;
      window.history.replaceState({}, '', `?conversationId=${convoId}`);
    }
  }

async function loadPartnerName() {
  const res = await fetch(`/api/conversations/chatlog?conversationId=${encodeURIComponent(convoId)}`, {
    credentials: 'include'
  });
  const data = await res.json();
  partnerNameEl.textContent = data.partnerName || 'Chat';

  // NEW:
  partnerUid = data.partnerUid;
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

    // Also listen for typing status
    onSnapshot(convoRef, snapshot => {
      const data = snapshot.data();
      if (data?.typing) {
        const typingStatus = data.typing[partnerUid];
        if (typingStatus) {
          typingIndicator.innerHTML = `
            <div class="typing-indicator">
              Typing
              <div class="typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          `;
        } else {
          typingIndicator.innerHTML = '';
        }
      }
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
          checkMarks = '<span class="read-receipt read">✓✓</span>';
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
      const convoRef = doc(db, 'Conversations', convoId);

      await addDoc(collection(convoRef, 'Messages'), {
        text,
        senderUid: currentUid,
        sentAt: new Date().toISOString(),
        readBy: [currentUid]
      });

      // Update last message preview
      await updateDoc(convoRef, {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        [`typing.${currentUid}`]: false
      });

      await setLastOnline();
      inputEl.value = '';

    } catch (err) {
      console.error('Send error:', err);
      alert('Failed to send message.');
    }
  });

  inputEl.addEventListener('input', () => {
    setTypingStatus(inputEl.value.trim() !== '');
  });

  async function setTypingStatus(isTyping) {
    const convoRef = doc(db, 'Conversations', convoId);
    await updateDoc(convoRef, {
      [`typing.${currentUid}`]: isTyping
    });
  }

  async function setLastOnline() {
    // Update last seen when sending a message
    try {
      await updateDoc(doc(db, 'Volunteers', currentUid), { lastOnline: serverTimestamp() });
    } catch (e) {
      try {
        await updateDoc(doc(db, 'companies', currentUid), { lastOnline: serverTimestamp() });
      } catch (e) {
        console.warn('Failed to update lastOnline');
      }
    }
  }

  // Startup
  try {
    currentUid = await fetchMyInfo();
    partnerUid = participantId; // Available from URL when creating conversation
    await ensureConversation();
    await loadPartnerName();
    listenToMessages();
  } catch (err) {
    console.error('Error starting chat:', err);
    alert('Could not load conversation.');
  }
});