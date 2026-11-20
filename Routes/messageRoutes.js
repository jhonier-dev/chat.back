const express = require('express');
const router = express.Router();
const messageController = require('../Controllers/messageController');

router.post('/create', messageController.create);
router.get('/consult', messageController.consultMessages);

module.exports = router;