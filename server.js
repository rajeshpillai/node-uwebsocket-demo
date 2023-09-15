const fs = require('fs');

const uWS = require('uWebSockets.js');
const app = uWS.App();

const PORT = 3000;
const activeSockets = [];

// ROOM CODE -->
let rooms = {};

function joinRoom(ws, roomName) {
    if (!rooms[roomName]) {
        rooms[roomName] = [];
    }
    rooms[roomName].push(ws);
}

function leaveRoom(ws, roomName) {
    if (rooms[roomName]) {
        rooms[roomName] = rooms[roomName].filter(client => client !== ws);
        if (rooms[roomName].length === 0) {
            delete rooms[roomName];
        }
    }
}

function broadcastToRoom(roomName, message) {
    if (rooms[roomName]) {
        for (let client of rooms[roomName]) {
            client.send(message);
        }
    }
}
// END ROOM <--

// Default route for http
app.get('/*', (res, req) => {
  const fileBuffer = fs.readFileSync(__dirname + '/index.html');
  res.writeHeader('Content-Type', 'text/html');
  res.end(fileBuffer);
});

// Default route for socket
app.ws('/*', {
  open: (ws) => {
      console.log('Client connected');
  },
  message: (ws, message, isBinary) => {
      const data = JSON.parse(Buffer.from(message).toString());

      if (data.action === 'join') {
          console.log(`Joining room ${data.room}`)
          joinRoom(ws, data.room);
          ws.currentRoom = data.room; // Store the current room in the WebSocket object
      } else if (data.action === 'leave') {
          console.log(`Leaving room ${data.room}`)
          leaveRoom(ws, data.room);
          delete ws.currentRoom;
      } else if (data.action === 'message' && ws.currentRoom) {
          broadcastToRoom(ws.currentRoom, data.content);
      }
  },
  close: (ws) => {
      if (ws.currentRoom) {
          leaveRoom(ws, ws.currentRoom);
      }
      console.log('Client disconnected');
  }
}).listen(3000, (token) => {
  if (token) {
      console.log('WebSocket server started on port 3000.  Open multiple browser to test the chat feature!');
  } else {
      console.log('Failed to start WebSocket server');
  }
});
