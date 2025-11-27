import { Server as HttpServer } from 'http'
import WebSocket, { Server as WSServer } from 'ws'

type Role = 'client' | 'admin'

interface WSMessage {
  type: string
  // payload flexible
  [key: string]: any
}

const clients = new Map<string, WebSocket>() // clientId -> ws
const admins = new Set<WebSocket>()

export function initWebSocket(server: HttpServer) {
  const wss = new WSServer({ server, path: '/ws' })

  wss.on('connection', (ws: WebSocket) => {
    let registeredRole: Role | null = null
    let registeredClientId: string | null = null

    ws.on('message', (data) => {
      let msg: WSMessage
      try {
        msg = typeof data === 'string' ? JSON.parse(data) : JSON.parse(data.toString())
      } catch (err) {
        console.warn('Invalid WS message format', err)
        return
      }

      const { type } = msg

      if (type === 'init') {
        const role: Role = msg.role || 'client'
        registeredRole = role
        if (role === 'admin') {
          admins.add(ws)
          ws.send(JSON.stringify({ type: 'init_ack', role: 'admin' }))
        } else {
          const clientId: string = msg.clientId || generateClientId()
          registeredClientId = clientId
          clients.set(clientId, ws)
          ws.send(JSON.stringify({ type: 'init_ack', role: 'client', clientId }))
          // Inform admins a new client connected (optional)
          broadcastToAdmins({
            type: 'client_connected',
            clientId
          })
        }
        return
      }

      if (type === 'chat') {
        // From client -> broadcast to admins and ack to client
        const clientId: string = msg.clientId || registeredClientId
        const content: string = msg.content || ''
        if (!clientId) {
          ws.send(JSON.stringify({ type: 'error', message: 'clientId required' }))
          return
        }
        const payload = {
          type: 'chat',
          clientId,
          content,
          timestamp: Date.now()
        }
        // send to all admins
        broadcastToAdmins(payload)
        // ack back to sender so client UI can show the sent message
        ws.send(JSON.stringify({ ...payload, self: true }))
        return
      }

      if (type === 'reply') {
        // From admin -> send to specific client
        const toClientId: string = msg.toClientId
        const content: string = msg.content || ''
        if (!toClientId) {
          ws.send(JSON.stringify({ type: 'error', message: 'toClientId required' }))
          return
        }
        const clientWs = clients.get(toClientId)
        const payload = {
          type: 'reply',
          from: 'admin',
          content,
          timestamp: Date.now()
        }
        if (clientWs && clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify(payload))
          // optionally ack admin
          ws.send(JSON.stringify({ type: 'reply_ack', toClientId }))
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'client not connected', toClientId }))
        }
        return
      }

      // Unknown type -> ignore or send error
      ws.send(JSON.stringify({ type: 'error', message: 'unknown message type' }))
    })

    ws.on('close', () => {
      if (registeredRole === 'admin') {
        admins.delete(ws)
      }
      if (registeredClientId) {
        clients.delete(registeredClientId)
        broadcastToAdmins({ type: 'client_disconnected', clientId: registeredClientId })
      }
    })

    ws.on('error', (err) => {
      console.error('WS error', err)
    })
  })

  function broadcastToAdmins(payload: any) {
    const data = JSON.stringify(payload)
    admins.forEach((a) => {
      if (a.readyState === WebSocket.OPEN) {
        a.send(data)
      }
    })
  }

  function generateClientId() {
    return 'c_' + Math.random().toString(36).slice(2, 9)
  }

  console.log('WebSocket server initialized at /ws')
}
