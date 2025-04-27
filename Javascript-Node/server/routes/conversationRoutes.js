// routes/conversationsRouter.js
const express = require('express');
const router = express.Router();
const { verifySession } = require('../controllers/authController'); // your auth middleware
const {
    getConversations,
    createConversation,
    getChatlog,
    postMessage
} = require('../controllers/conversationController');


// List your conversations
// GET /api/conversations
router.get('/', verifySession, getConversations);

// Create a new convo
// POST /api/conversations?participantId=...&participantType=volunteer|company
router.post('/', verifySession, createConversation);

// Get chat log
// GET /api/conversations/chatlog?conversationId=...
router.get('/chatlog', verifySession, getChatlog);

// Send message
// POST /api/conversations/chatlog?conversationId=...
router.post('/chatlog', verifySession, postMessage);

module.exports = router;