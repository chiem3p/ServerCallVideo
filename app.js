const express = require('express');
const app = express();
const fs = require('fs');
const open = require('open');
const options = {
  key: fs.readFileSync('./fake-keys/privatekey.pem'),
  cert: fs.readFileSync('./fake-keys/certificate.pem'),
};
const https = require('https');
const http = require('http');
var server;
if (process.env.LOCAL) {
  server = https.createServer(options, app);
} else {
  server = http.createServer(app);
}
const io = require('socket.io')(server);
console.log(process.env.LOCAL);
/* ==============================
 Middleware
 ================================ */
app.use(express.static(__dirname + '/public'));
app.get('/', getCallback);
io.on('connection', ioCallback);
server.listen(process.env.PORT||4443,()=>{
	console.log('server is runing')
})
/* ==============================
 Middleware Functions
 ================================ */
function getCallback(req, res) {
  console.log('get /');
  res.sendFile(__dirname + '/index.html');
}



function ioCallback(socket) {
  console.log(`Socket id: ${socket.id}`);
  
  socket.on('join', (roomID, callback) => {
    console.log('join', roomID);
    
    const socketIds = socketIdsInRoom(roomID);
    console.log(socketIds);
    
    callback(socketIds);
    socket.join(roomID);
    socket.room = roomID;
  });
  
  socket.on('exchange', data => {
    console.log('exchange', data.to);
    
    data.from = socket.id;
    const to = io.sockets.connected[data.to];
    to.emit('exchange', data);
  });
  
  socket.on('disconnect', () => {
    console.log('disconnect');
    
    if (socket.room) {
      const room = socket.room;
      io.to(room).emit('leave', socket.id);
      socket.leave(room);
      
      console.log('leave');
    }
  });
}

/* ==============================
 Socket Functions
 ================================ */
function socketIdsInRoom(roomID) {
  const socketIds = io.nsps['/'].adapter.rooms[roomID];
  if (socketIds) {
    const collection = [];
    for (const key in socketIds) {
      collection.push(key);
    }
    return collection;
  } else {
    return [];
  }
}
