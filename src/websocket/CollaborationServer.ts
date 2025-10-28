// CollaborationServer.ts
import http from 'http'
import WebSocket, { WebSocketServer } from 'ws'

const PORT = +(process.env.YJS_PORT || 1234)

const server = http.createServer((req, res) => {
  res.writeHead(200)
  res.end('Yjs websocket server\n')
})

const wss = new WebSocketServer({ server })

wss.on('connection', (ws: WebSocket, req) => {
  // Dynamically require the CommonJS module
  const { setupWSConnection } = require('@y/websocket-server/utils');

  console.log("ws>>", ws, req)
  // setupWSConnection handles the Yjs websocket protocol (rooms, persistence optional)
  // Options: { gc: true } is fine for testing
  setupWSConnection(ws, req, { gc: true })
})

server.listen(PORT, () => {
  console.log(`✅ y-websocket server listening on ws://localhost:${PORT}`)
})
