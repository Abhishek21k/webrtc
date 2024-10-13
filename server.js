const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    fs.readFile('index.html', (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (req.url === '/client.js') {
    fs.readFile('client.js', (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading client.js');
      }
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(data);
    });
  } else if (req.url === '/styles.css') {
    fs.readFile('styles.css', (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading style.css');
      }
      res.writeHead(200, { 'Content-Type': 'text/css' });
      res.end(data);
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocket.Server({ server });
const clients = new Map();

wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');

  const clientId = Math.random().toString(36).substr(2, 9);
  clients.set(clientId, ws);

  ws.send(JSON.stringify({ type: 'client-id', clientId }));

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    console.log('Received message:', data);

    switch (data.type) {
      case 'offer':
      case 'answer':
      case 'ice-candidate':
        console.log(`Received ${data.type}`);
        const targetClient = clients.get(data.target);
        if (targetClient) {
          targetClient.send(JSON.stringify({
            type: data.type,
            data: data.data,
            source: clientId
          }));
        }
        break;
      default:
        console.error('Unrecognized message', data);
    };

  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
});