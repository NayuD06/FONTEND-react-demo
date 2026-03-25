import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import UserList from './UserList'
import './Chat.css'

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  const [username, setUsername] = useState('')
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [typing, setTyping] = useState('')

  useEffect(() => {
    // Create socket connection
    const newSocket = io('http://localhost:3001', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    newSocket.on('connect', () => {
      console.log('Connected to server')
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server')
      setIsConnected(false)
    })

    newSocket.on('receive-message', (messageData) => {
      setMessages((prev) => [...prev, messageData])
    })

    newSocket.on('user-list', (userList) => {
      setUsers(userList)
    })

    newSocket.on('system-message', (message) => {
      setMessages((prev) => [
        ...prev,
        {
          ...message,
          isUser: false,
          isSystem: true,
        },
      ])
    })

    newSocket.on('user-typing', (typingUsername) => {
      setTyping(typingUsername)
    })

    newSocket.on('user-stop-typing', () => {
      setTyping('')
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  const handleJoin = (name) => {
    if (socket && name.trim()) {
      setUsername(name)
      socket.emit('user-join', name)
    }
  }

  const handleSendMessage = (text) => {
    if (socket && text.trim()) {
      socket.emit('send-message', { text })
    }
  }

  const handleTyping = () => {
    if (socket && username) {
      socket.emit('user-typing', username)
    }
  }

  const handleStopTyping = () => {
    if (socket) {
      socket.emit('user-stop-typing')
    }
  }

  // Join room UI
  if (!username) {
    return (
      <div className="join-container">
        <div className="join-box">
          <h1>💬 Chat App</h1>
          <p>Enter your name to start chatting</p>
          <input
            type="text"
            placeholder="Your name..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleJoin(e.target.value)
                e.target.value = ''
              }
            }}
            className="username-input"
          />
          <button
            onClick={(e) => {
              const input = e.target.previousElementSibling
              handleJoin(input.value)
              input.value = ''
            }}
            className="join-button"
          >
            Join Chat
          </button>
          <p className={`status ${isConnected ? 'connected' : 'connecting'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Connecting...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-wrapper">
      <UserList users={users} currentUser={username} />
      <div className="chat-container">
        <div className="chat-header">
          <div className="header-content">
            <h1>💬 Chat App</h1>
            <p>Users: {users.length}</p>
          </div>
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Online' : '🔴 Offline'}
          </div>
        </div>

        <MessageList messages={messages} currentUser={username} typing={typing} />

        <ChatInput 
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          onStopTyping={handleStopTyping}
        />
      </div>
    </div>
  )
}
