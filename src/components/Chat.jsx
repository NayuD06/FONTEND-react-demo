import { useState, useEffect } from 'react'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import UserList from './UserList'
import {
  fetchMessages,
  fetchUsers,
  joinChat,
  leaveChat,
  sendChatMessage,
} from '../services/chatApiService'
import './Chat.css'

export default function Chat({ currentUser, onLogout, authError }) {
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState('')

  const currentUserId = currentUser?.uid || ''
  const username =
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    'User'
  const error = connectionError || authError
  const typing = ''

  const toFriendlyError = (err) => {
    const message = err?.message || ''
    if (!message) return 'Không thể kết nối server chat.'
    if (message.toLowerCase().includes('failed to fetch')) {
      return 'Không gọi được API chat. Hãy kiểm tra backend và VITE_API_BASE_URL.'
    }
    return message
  }

  useEffect(() => {
    if (!username || !currentUserId) return

    let isMounted = true
    let intervalId = null

    const syncData = async () => {
      if (isMounted) {
        try {
          const [messagesData, usersData] = await Promise.all([
            fetchMessages(60),
            fetchUsers(),
          ])
          setMessages(messagesData)
          setUsers(usersData)
          setConnectionError('')
        } catch (err) {
          setConnectionError(toFriendlyError(err))
          setIsConnected(false)
        }
      }
    }

    const bootstrap = async () => {
      try {
        await joinChat(currentUserId, username)
        if (!isMounted) return
        setIsConnected(true)
        await syncData()
        intervalId = window.setInterval(syncData, 2000)
      } catch (err) {
        if (isMounted) {
          setConnectionError(toFriendlyError(err))
          setIsConnected(false)
        }
      }
    }

    bootstrap()

    return () => {
      isMounted = false
      if (intervalId) {
        window.clearInterval(intervalId)
      }
      leaveChat(currentUserId).catch(() => {
        if (isMounted) {
          setConnectionError('Không thể cập nhật trạng thái rời phòng.')
        }
      })
    }
  }, [username, currentUserId])

  const handleSendMessage = async (text) => {
    if (text.trim() && username) {
      try {
        await sendChatMessage(username, text)
        const messagesData = await fetchMessages(60)
        setMessages(messagesData)
      } catch (err) {
        setConnectionError(toFriendlyError(err))
        setIsConnected(false)
      }
    }
  }

  const handleTyping = () => {
    // Firebase typing indicator can be added here if needed
  }

  const handleStopTyping = () => {
    // Firebase typing indicator can be added here if needed
  }

  return (
    <div className="chat-wrapper">
      <UserList users={users} currentUser={username} />
      <div className="chat-container">
        <ChatHeader
          usersCount={users.length}
          isConnected={isConnected}
          error={error}
          currentUserLabel={`Hello, ${username}`}
          onLogout={onLogout}
        />

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
