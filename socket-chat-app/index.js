const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const userRegistry = {};

io.on('connection', (socket) => {
  // NEW LOGIC: Tell the terminal immediately when a raw connection happens
  console.log('A user connected to the server');

  socket.on('user joined', (nickname) => {
    socket.nickname = nickname; 
    userRegistry[nickname] = { isOnline: true, isTyping: false };
    io.emit('status update', userRegistry);
    
    // Tell the terminal who joined
    console.log(nickname + ' joined the chat');
  });

  socket.on('chat message', (data) => {
    socket.broadcast.emit('chat message', data);
  });

  socket.on('typing', (isTyping) => {
    if (socket.nickname && userRegistry[socket.nickname]) {
      userRegistry[socket.nickname].isTyping = isTyping;
      io.emit('status update', userRegistry);
      
      // Tell the terminal so we can debug if the typing event is working
      console.log(socket.nickname + ' is typing: ' + isTyping);
    }
  });

  socket.on('disconnect', () => {
    if (socket.nickname) {
      delete userRegistry[socket.nickname];
      io.emit('status update', userRegistry);
      
      // Tell the terminal who left
      console.log(socket.nickname + ' disconnected');
    }
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});