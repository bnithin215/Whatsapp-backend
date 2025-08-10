const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  wa_id: String,       // WhatsApp ID of the contact
  name: String,        // Contact name
  message: String,     // Message text
  timestamp: Date,     // Time the message was sent
  status: String,      // 'sent', 'delivered', 'read'
  meta_msg_id: String  // WhatsApp message unique ID
});

// Force the collection name to be exactly 'processed_messages'
module.exports = mongoose.model('Message', messageSchema, 'processed_messages');
