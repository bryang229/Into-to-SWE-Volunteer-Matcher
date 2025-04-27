// controllers/conversationController.js
const { db, admin } = require('../firebase'); // your initialized Firestore
// GET /api/conversations
async function getConversations(req, res) {
  const uid = req.user.uid;

  try {
    const snap = await db.collection('Conversations')
      .where('participantsUids', 'array-contains', uid)
      .orderBy('lastMessageAt', 'desc')
      .get();

    const convos = await Promise.all(snap.docs.map(async doc => {
      const data = doc.data();
      const partner = convo.participants.find(p => p.uid !== uid);
      res.json({
        partnerName,
        partnerUid: partner.uid,
        messages
      });

      const col = partner.type === 'company' ? 'companies' : 'Volunteers';
      const userSnap = await db.collection(col).doc(partner.uid).get();
      const userData = userSnap.exists ? userSnap.data() : {};

      return {
        id: doc.id,
        partnerName: userData.fullname || userData.companyName || 'Unknown',
        avatarUrl: userData.avatarUrl || '',
        lastMessageSnippet: data.lastMessage?.slice(0, 30) || '',
        lastMessageAt: data.lastMessageAt
      };
    }));

    res.json(convos);
  } catch (err) {
    console.error('getConversations error:', err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
}

// GET /api/conversations/chatlog?conversationId=...
async function getChatlog(req, res) {
  const { conversationId } = req.query;
  const uid = req.user.uid;

  try {
    const convoRef = db.collection('Conversations').doc(conversationId);
    const convoSnap = await convoRef.get();
    if (!convoSnap.exists) return res.status(404).json({ error: 'Not found' });

    const convo = convoSnap.data();
    if (!convo.participantsUids.includes(uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const partner = convo.participants.find(p => p.uid !== uid);

    // Fetch partner profile correctly
    const col = partner.type === 'company' ? 'companies' : 'Volunteers';
    const userSnap = await db.collection(col).doc(partner.uid).get();
    const partnerName = userSnap.exists
      ? (userSnap.data().fullname || userSnap.data().companyName)
      : 'Unknown';

    // Fetch messages
    const msgsSnap = await convoRef.collection('Messages').orderBy('sentAt').get();
    const batch = admin.firestore().batch();

    const messages = msgsSnap.docs.map(md => {
      const m = md.data();
      if (m.senderUid !== uid && !(m.readBy || []).includes(uid)) {
        batch.update(md.ref, { readBy: admin.firestore.FieldValue.arrayUnion(uid) });
      }
      return {
        id: md.id,
        text: m.text,
        sentAt: m.sentAt,
        sentByMe: m.senderUid === uid,
        read: (m.readBy || []).includes(uid)
      };
    });

    await batch.commit();

    // ✅ Now send full correct response
    res.json({
      partnerName,
      partnerUid: partner.uid,
      messages
    });

  } catch (err) {
    console.error('getChatlog error:', err);
    res.status(500).json({ error: 'Failed to load chat' });
  }
}

// POST /api/conversations/chatlog?conversationId=...
async function postMessage(req, res) {
  const { conversationId } = req.query;
  const { text } = req.body;
  const uid = req.user.uid;

  if (!conversationId || !text) {
    return res.status(400).json({ error: 'Missing conversationId or text' });
  }

  try {
    const convoRef = db.collection('Conversations').doc(conversationId);
    const convoSnap = await convoRef.get();
    if (!convoSnap.exists) return res.status(404).json({ error: 'Conversation not found' });

    const convo = convoSnap.data();
    if (!convo.participantsUids.includes(uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const now = new Date().toISOString();
    await convoRef.collection('Messages').add({
      text,
      senderUid: uid,
      sentAt: now,
      readBy: [uid]
    });

    await convoRef.update({
      lastMessage: text,
      lastMessageAt: now
    });

    res.status(201).json({ message: 'Sent' });
  } catch (err) {
    console.error('postMessage error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
}

// POST /api/conversations?participantId=...&participantType=...
async function createConversation(req, res) {
  const { participantId, participantType } = req.query;
  const uid = req.user.uid;
  const myType = req.user.accountType;

  if (!participantId || !participantType) {
    return res.status(400).json({ error: 'Missing participantId or participantType' });
  }
  if (participantId === uid) {
    return res.status(400).json({ error: 'Cannot chat with yourself' });
  }

  try {
    const existingSnap = await db.collection('Conversations')
      .where('participantsUids', 'array-contains', uid)
      .get();

    let convoId = null;
    for (const doc of existingSnap.docs) {
      const data = doc.data();
      if (data.participants.some(p => p.uid === participantId && p.type === participantType)) {
        convoId = doc.id;
        break;
      }
    }

    if (convoId) {
      return res.json({ id: convoId });
    }

    const now = new Date().toISOString();
    const newConvo = {
      participants: [
        { uid, type: myType },
        { uid: participantId, type: participantType }
      ],
      participantsUids: [uid, participantId],
      lastMessage: '',
      lastMessageAt: now,
      createdAt: now
    };

    const newConvoRef = await db.collection('Conversations').add(newConvo);
    res.status(201).json({ id: newConvoRef.id });
  } catch (err) {
    console.error('createConversation error:', err);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
}

module.exports = {
  getConversations,
  getChatlog,
  postMessage,
  createConversation
};