require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Message = require('./models/Message');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('DB connected for processing'))
  .catch(err => console.log(err));

const payloadDir = path.join(__dirname, 'payloads');

fs.readdirSync(payloadDir).forEach(file => {
  console.log(`Processing file: ${file}`);
  const data = JSON.parse(fs.readFileSync(path.join(payloadDir, file), 'utf8'));

  try {
    const change = data.metaData.entry[0].changes[0];
    const value = change.value;

    // If it contains "messages", it's a new message payload
    if (value.messages && value.messages.length > 0) {
      const contact = value.contacts[0];
      const msg = value.messages[0];

      const newMessage = new Message({
        wa_id: contact.wa_id,
        name: contact.profile.name,
        message: msg.text ? msg.text.body : '',
        timestamp: new Date(parseInt(msg.timestamp) * 1000), // convert to ms
        status: 'sent',
        meta_msg_id: msg.id
      });

      newMessage.save().then(() =>
        console.log(`Inserted message for ${contact.wa_id}`)
      );
    }

    // If it contains "statuses", it's a status update
    if (value.statuses && value.statuses.length > 0) {
      const statusObj = value.statuses[0];
      Message.findOneAndUpdate(
        { meta_msg_id: statusObj.id },
        { status: statusObj.status }
      ).then(() =>
        console.log(`Updated status for message ${statusObj.id}`)
      );
    }

  } catch (err) {
    console.error(`Error processing ${file}:`, err.message);
  }
});
