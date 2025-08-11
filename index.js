require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');
const http = require('http');
const Message = require('./models/Message');

const port = process.env.PORT || 5000;
const app = express();
app.use(cors({
  origin: 'https://whatsapp-frontend-five-phi.vercel.app',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('DB connected'))
  .catch(err => console.log(err));

// API routes
app.get('/api/conversations', async (req, res) => {
  const conversations = await Message.aggregate([
    {
      $group: {
        _id: "$wa_id",
        name: { $first: "$name" },
        lastMessage: { $last: "$message" },
        lastTime: { $last: "$timestamp" }
      }
    },
    { $sort: { lastTime: -1 } }
  ]);
  res.json(conversations);
});

app.get('/api/conversations/:wa_id', async (req, res) => {
  const messages = await Message.find({ wa_id: req.params.wa_id }).sort({ timestamp: 1 });
  res.json(messages);
});

app.post('/api/messages', async (req, res) => {
  const newMsg = new Message({
    wa_id: req.body.wa_id,
    name: req.body.name,
    message: req.body.message,
    timestamp: new Date(),
    status: 'sent',
    meta_msg_id: Date.now().toString()
  });
  await newMsg.save();

  // Emit new message to all clients
  io.emit('messageReceived', newMsg);

  res.json(newMsg);
});

// Create HTTP server & attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Handle socket connections
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('sendMessage', async (msgData) => {
    const msg = new Message(msgData);
    await msg.save();

    io.emit('messageReceived', msg);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

app.get('/', (req, res) => {
  res.send('Backend is running');
});


server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
