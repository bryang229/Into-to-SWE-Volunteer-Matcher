// Handles messaging, typing indicators, online status, and real-time chat updates
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

  // Extract query parameters from URL
  const params = new URLSearchParams(window.location.search);
  let convoId = params.get('conversationId');
  const participantId = params.get('participantId');
  const participantType = params.get('participantType');

  // DOM elements
  const partnerNameEl = document.getElementById('chatPartnerName');
  const typingIndicator = document.getElementById('typingIndicator');
  const messagesEl = document.getElementById('chatMessages');
  const inputEl = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');

  // Global state
  let currentUid = null;
  let partnerUid = null;
  let unsubscribe = null;
  let refreshIntervalId = null;

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
    const res = await fetch(`/api/conversations/chatlog?conversationId=${encodeURIComponent(convoId)}`, { credentials: 'include' });
    const data = await res.json();
    partnerNameEl.textContent = data.partnerName || 'Chat';
    partnerUid = data.partnerUid;
  }

  function updateOnlineStatus(isOnline) {
    const onlineDot = document.getElementById('onlineDot');
    if (!onlineDot) {
      console.warn('onlineDot element not found');
      return;
    }
    onlineDot.style.display = isOnline ? 'inline-block' : 'none';
  }

  function listenToMessages() {
    const convoRef = doc(db, 'Conversations', convoId);
    const messagesQuery = query(collection(convoRef, 'Messages'), orderBy('sentAt'));

    unsubscribe = onSnapshot(messagesQuery, snapshot => {
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          text: data.text,
          sentAt: data.sentAt,
          sentByMe: data.senderUid === currentUid,
          read: (data.readBy || []).includes(currentUid)
        };
      });
      renderMessages(messages);
    });

    onSnapshot(convoRef, snapshot => {
      const data = snapshot.data();
      if (data?.typing) {
        const typingStatus = data.typing[partnerUid];
        typingIndicator.innerHTML = typingStatus ? 
          `<div class="typing-indicator">Typing<div class="typing-dots"><span></span><span></span><span></span></div></div>` : '';
      }
    });
  }

  function listenToPartnerStatus() {
    if (!partnerUid) return;

    const volunteerDocRef = doc(db, 'Volunteers', partnerUid);
    const companyDocRef = doc(db, 'companies', partnerUid);

    onSnapshot(volunteerDocRef, snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        handleOnlineStatus(data.lastOnline);
      } else {
        onSnapshot(companyDocRef, snapshot2 => {
          if (snapshot2.exists()) {
            const data = snapshot2.data();
            handleOnlineStatus(data.lastOnline);
          } else {
            console.warn('Partner not found in Volunteers or Companies');
          }
        });
      }
    });
  }

  inputEl.addEventListener('input', () => {
    const typingLoader = document.getElementById('typingLoader');
    typingLoader.style.display = inputEl.value.trim() ? 'inline-flex' : 'none';
  });

  function renderMessages(messages) {
    messagesEl.innerHTML = '';

    messages.forEach(msg => {
      const div = document.createElement('div');
      div.className = `message ${msg.sentByMe ? 'sent' : 'received'}`;

      let checkMarks = '';
      if (msg.sentByMe) {
        checkMarks = msg.read ? '<span class="read-receipt read">✓✓</span>' : '<span class="read-receipt">✓</span>';
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

      await updateDoc(convoRef, {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        [`typing.${currentUid}`]: false
      });

      await refreshLastOnline(currentUid);
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

  // Refresh user's last online timestamp manually
  async function refreshLastOnline(currentUid) {
    if (!currentUid) return;

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

  function handleOnlineStatus(lastOnline) {
    const onlineDot = document.getElementById('onlineDot');

    if (!onlineDot) {
      console.warn('onlineDot element not found');
      return;
    }

    if (!lastOnline) {
      updateOnlineStatus(false);
      return;
    }

    const last = lastOnline.seconds ? new Date(lastOnline.seconds * 1000) : new Date(lastOnline._seconds * 1000);
    const diffMinutes = (Date.now() - last.getTime()) / (1000 * 60);

    updateOnlineStatus(diffMinutes <= 2);
  }

  try {

    currentUid = await fetchMyInfo();
    partnerUid = participantId;
    await ensureConversation();
    await loadPartnerName();

    setTimeout(() => {
      listenToPartnerStatus();
    }, 300);

    listenToMessages();
    await refreshLastOnline(currentUid);

    // Start automatic lastOnline refresh every 60 seconds
    refreshIntervalId = setInterval(() => {
      refreshLastOnline(currentUid);
    }, 60000);

  } catch (err) {
    console.error('Error starting chat:', err);
    alert('Could not load conversation.');
  }
});

// Clean up interval when user leaves the page
window.addEventListener('beforeunload', () => {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId);
  }
});