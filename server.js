const fs = require('fs');

const uWS = require('uWebSockets.js');
const app = uWS.App();

const PORT = 3000;
const activeSockets = [];

// Default route for http
app.get('/*', (res, req) => {
  const fileBuffer = fs.readFileSync(__dirname + '/index.html');
  res.writeHeader('Content-Type', 'text/html');
  res.end(fileBuffer);
});

// Default route for socket
app.ws('/*', {
  /* Options */
  compression: uWS.SHARED_COMPRESSOR,
  maxPayloadLength: 16 * 1024 * 1024,
  idleTimeout: 10,
  /* Handlers */
  open: (ws) => {
    console.log('A user connected.');
    activeSockets.push(ws);
  },
  message: (ws, message, isBinary) => {
    let receivedMessage = Buffer.from(message).toString();
    console.log('Received message:', receivedMessage);
    
    // Broadcast the message to all connected clients
    for (let client of activeSockets) {
      if (client !== ws) { // Optional: exclude the sender
        console.log(`Sending message ${message} to client: `, client);
        client.send(message, isBinary);
      }
    }
  },
  drain: (ws) => {
      console.log('WebSocket backpressure: ' + ws.getBufferedAmount());
  },
  close: (ws, code, message) => {
    console.log('WebSocket closed');
    const index = activeSockets.indexOf(ws);
    if (index > -1) {
        activeSockets.splice(index, 1);
    }
  }
}).listen(PORT, (token) => {
  if (token) {
      console.log('Server started on port: (Open multiple browser window to test out the chat feature)', PORT);
  } else {
      console.log('Failed to start server on port:', PORT);
  }
});
