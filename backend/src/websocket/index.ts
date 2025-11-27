import { Server as WebSocketServer, WebSocket as WS } from 'ws'
import { verifyToken } from '../apis/utils/jwt.util'
import { MessageModel } from '../apis/models/message.model'
import { TopupModel } from '../apis/models/topup.model'
import pool from '../config/db.conf'

interface JwtPayload {
  id: number
  customer_id?: number
  employee_id?: number
  role: any
  name?: string
}

interface Client {
  ws: WS
  userId: number
  customerId?: number
  role: string
}

const clients = new Map<string, Client>() // key = "role_userId"

export function initWebSocket(server: any) {
  const wss = new WebSocketServer({ server })

  wss.on('connection', (ws, req) => {
    const token = new URL(req.url!, `http://${req.headers.host}`).searchParams.get('token')
    if (!token) return ws.close(1008, 'Missing token')

    let payload: JwtPayload
    try {
      payload = verifyToken(token) as JwtPayload
      console.log('WS Connect payload:', payload)
    } catch {
      console.error('Invalid token')
      return ws.close(1008, 'Invalid token')
    }

    if (!payload.id) {
      console.error('Payload missing id:', payload)
      return ws.close(1008, 'Invalid user ID in token')
    }

    // ===============================
    // STRICT NORMALIZE ROLE
    // ===============================
    const rawRole = payload.role
    let roleStr: string = 'unknown'

    if (rawRole) {
      if (typeof rawRole === 'string') {
        roleStr = rawRole.toLowerCase()
      } else if (typeof rawRole === 'number') {
        roleStr = rawRole === 1 ? 'admin' : rawRole === 2 ? 'employee' : rawRole === 3 ? 'customer' : 'unknown'
      } else if (typeof rawRole === 'object' && rawRole.role_name) {
        roleStr = String(rawRole.role_name).toLowerCase()
      } else {
        roleStr = String(rawRole).toLowerCase()
      }
    }

    if (roleStr === 'unknown') {
      console.warn(`Unknown role for user ${payload.id}: ${payload.role} → closing WS`)
      return ws.close(1008, 'Invalid role in token')
    }

    // 🔥 FIX QUAN TRỌNG: Admin luôn xem như employee
    if (roleStr === 'admin') roleStr = 'employee'

    const { id: userId, customer_id: customerId, name } = payload
    const key = `${roleStr}_${userId}`

    if (clients.has(key)) clients.delete(key)
    clients.set(key, { ws, userId, customerId, role: roleStr })

    console.log(`Client connected: ${key} (name: ${name ?? 'unknown'})`)

    // Send history
    MessageModel.getHistory(userId, roleStr as any, 20, (err, rows) => {
      if (!err) ws.send(JSON.stringify({ type: 'history', data: rows }))
    })

    // ===========================
    // MESSAGE HANDLER
    // ===========================
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString())

        switch (msg.type) {
          /* ===========================
           * CHAT
           * =========================== */
          case 'chat': {
            const { receiverId, receiverRole, content } = msg
            if (!receiverId || !receiverRole || !content) {
              console.error('Invalid chat msg:', msg)
              return
            }

            console.log(`Chat from ${roleStr} ${userId} to ${receiverRole} ${receiverId}: ${content}`)

            MessageModel.create(
              {
                senderId: userId,
                senderRole: roleStr as any,
                receiverId,
                receiverRole,
                content
              },
              (e, insertId) => {
                if (e) {
                  console.error('Chat create err:', e)
                  return ws.send(JSON.stringify({ type: 'error', message: e.message }))
                }

                const out = {
                  type: 'chat',
                  data: {
                    message_id: insertId,
                    sender_id: userId,
                    sender_role: roleStr,
                    sender_name: name ?? null,
                    receiver_id: receiverId,
                    receiver_role: receiverRole,
                    content,
                    sent_at: new Date()
                  }
                }

                ws.send(JSON.stringify(out)) // echo sender

                const recvKey = `${receiverRole}_${receiverId}`
                const recv = clients.get(recvKey)

                if (recv) {
                  console.log(`Chat forward to receiver ${recvKey}: ${content}`)
                  recv.ws.send(JSON.stringify(out))
                } else {
                  console.log(`Receiver ${recvKey} offline → stored only`)
                }
              }
            )

            break
          }

          /* ===========================
           * TOPUP REQUEST
           * =========================== */
          case 'topupRequest': {
            const { amount } = msg
            const actualCustomerId = customerId || msg.customerId

            if (!actualCustomerId) {
              return ws.send(JSON.stringify({ type: 'error', message: 'Customer ID not found in token' }))
            }

            if (!amount || typeof amount !== 'number' || amount <= 0) {
              return ws.send(JSON.stringify({ type: 'error', message: 'Invalid amount' }))
            }

            console.log(`📝 Topup request from customer ${actualCustomerId}: ${amount} VNĐ`)

            TopupModel.createRequest(actualCustomerId, amount, (e: any, rid?: number) => {
              if (e) {
                console.error('❌ Topup error:', e.message)
                return ws.send(JSON.stringify({ type: 'error', message: e.message }))
              }

              const notify = {
                type: 'topupRequest',
                data: {
                  requestId: rid,
                  customerId: actualCustomerId,
                  customerName: name ?? null,
                  amount
                }
              }

              console.log(`📢 Broadcasting topup request to employees:`)
              let employeeCount = 0

              // Use stored client.role to decide recipients (more reliable)
              clients.forEach((c) => {
                try {
                  if (c.role === 'employee' || c.role === 'admin') {
                    c.ws.send(JSON.stringify(notify))
                    employeeCount++
                  }
                } catch (sendErr) {
                  console.error('Failed to send topup notify to', c.userId, sendErr)
                }
              })

              console.log(`✅ Sent to ${employeeCount} employees`)
              ws.send(JSON.stringify({ type: 'topupRequestSent', requestId: rid }))
            })

            break
          }

          /* ===========================
           * TOPUP REPLY
           * =========================== */
          case 'topupReply': {
            if (roleStr !== 'employee') {
              return ws.send(JSON.stringify({ type: 'error', message: 'Permission denied' }))
            }

            const { requestId, status } = msg
            if (!requestId || !status) {
              return ws.send(JSON.stringify({ type: 'error', message: 'Missing requestId or status' }))
            }

            TopupModel.approve(requestId, userId, (e: any) => {
              if (e) {
                return ws.send(JSON.stringify({ type: 'error', message: e.message }))
              }

              TopupModel.getOne(requestId, (e2: any, row: any) => {
                if (e2 || !row) return

                const custKey = `customer_${row.customer_id}`
                const cust = clients.get(custKey)

                if (cust) {
                  cust.ws.send(
                    JSON.stringify({
                      type: 'topupDone',
                      status,
                      amount: row.amount,
                      newBalance: row.new_balance ?? row.amount
                    })
                  )
                }

                ws.send(JSON.stringify({ type: 'topupReplyDone', status }))
              })
            })

            break
          }
        }
      } catch (e) {
        console.error('❌ WS message error:', e)
        ws.send(JSON.stringify({ type: 'error', message: 'Bad message' }))
      }
    })

    ws.on('close', () => {
      clients.delete(key)
      console.log(`Client disconnected: ${key}`)
    })
  })
}
