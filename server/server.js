import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

app.use(cors())
app.use(express.json())

// Store connected users
const users = new Map()

// Track active connections
io.on('connection', (socket) => {
  console.log(`New user connected: ${socket.id}`)

  // Handle user join
  socket.on('user-join', (username) => {
    users.set(socket.id, { username, socketId: socket.id })
    
    // Broadcast user list to all clients
    io.emit('user-list', Array.from(users.values()))
    io.emit('system-message', {
      text: `${username} joined the chat`,
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    })
    console.log(`${username} joined. Total users: ${users.size}`)
  })

  // Handle incoming messages
  socket.on('send-message', (data) => {
    const user = users.get(socket.id)
    if (user) {
      const messageData = {
        text: data.text,
        username: user.username,
        isUser: true,
        time: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        sender: socket.id,
      }
      
      // Broadcast message to all clients
      io.emit('receive-message', messageData)
    }
  })

  // Handle disconnect
  socket.on('disconnect', () => {
    const user = users.get(socket.id)
    if (user) {
      users.delete(socket.id)
      io.emit('user-list', Array.from(users.values()))
      io.emit('system-message', {
        text: `${user.username} left the chat`,
        time: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
      })
      console.log(`${user.username} disconnected. Total users: ${users.size}`)
    }
  })

  // Handle typing indicator
  socket.on('user-typing', (username) => {
    socket.broadcast.emit('user-typing', username)
  })

  socket.on('user-stop-typing', () => {
    socket.broadcast.emit('user-stop-typing')
  })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
