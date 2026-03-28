import { initializeApp, getApp, getApps } from 'firebase/app'
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  remove,
  query,
  limitToLast,
  onDisconnect,
  update,
  get,
} from 'firebase/database'

export const ONLINE_TTL_MS = 10 * 60 * 1000

const allowedUserCache = new Set()

// Firebase config - Replace with your values from Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
}

const resolvedDatabaseURL =
  firebaseConfig.databaseURL ||
  (firebaseConfig.projectId
    ? `https://${firebaseConfig.projectId}-default-rtdb.firebaseio.com`
    : '')

firebaseConfig.databaseURL = resolvedDatabaseURL

const requiredKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
]

const missingKeys = requiredKeys.filter((key) => {
  const value = firebaseConfig[key]
  if (!value) return true
  if (key === 'databaseURL' && value.includes('your_project')) return true
  return false
})

export const getFirebaseConfigError = () => {
  if (missingKeys.length === 0) return ''

  return `Cau hinh Firebase chua day du: ${missingKeys.join(', ')}. Kiem tra file .env va .env.production.`
}

export const getFirebaseApp = () => {
  const configError = getFirebaseConfigError()
  if (configError) {
    throw new Error(configError)
  }

  return getApps().length ? getApp() : initializeApp(firebaseConfig)
}

const getDb = () => {
  if (!firebaseConfig.databaseURL) {
    throw new Error('Khong tim thay databaseURL. Hay tao Realtime Database trong Firebase Console.')
  }

  const app = getFirebaseApp()
  return getDatabase(app)
}

const ensureUserIsProvisioned = async (userId) => {
  if (!userId) {
    const error = new Error('Missing Firebase user id.')
    error.code = 'permission_denied'
    throw error
  }

  if (allowedUserCache.has(userId)) return true

  const database = getDb()
  const allowedRef = ref(database, `allowedUsers/${userId}`)
  const snapshot = await get(allowedRef)
  const isAllowed = snapshot.exists() && snapshot.val() === true

  if (!isAllowed) {
    const error = new Error('Tai khoan chua duoc cap quyen chat tren Firebase.')
    error.code = 'permission_denied'
    throw error
  }

  allowedUserCache.add(userId)
  return true
}

export const setProvisionedUserAccess = async (userId) => {
  if (!userId) return
  const database = getDb()
  const allowedRef = ref(database, `allowedUsers/${userId}`)
  await set(allowedRef, true)
  allowedUserCache.add(userId)
}

export const removeProvisionedUserAccess = async (userId) => {
  if (!userId) return
  const database = getDb()
  const allowedRef = ref(database, `allowedUsers/${userId}`)
  await remove(allowedRef)
  allowedUserCache.delete(userId)
}

// Messages functions
export const sendMessage = async (username, text, recipient = '', senderUid = '') => {
  await ensureUserIsProvisioned(senderUid)
  const database = getDb()
  const messagesRef = ref(database, 'messages')
  const newMessageRef = push(messagesRef)
  
  return set(newMessageRef, {
    senderUid,
    username,
    text,
    recipient,
    timestamp: Date.now(),
    sender: username, // to identify which side to show message
  })
}

export const listenToMessages = (callback, onError) => {
  const database = getDb()
  const messagesRef = ref(database, 'messages')
  const messagesQuery = query(messagesRef, limitToLast(50))
  
  return onValue(
    messagesQuery,
    (snapshot) => {
      const messages = []
      snapshot.forEach((childSnapshot) => {
        messages.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        })
      })
      // Sort by timestamp ascending
      messages.sort((a, b) => a.timestamp - b.timestamp)
      callback(messages)
    },
    (error) => {
      if (onError) {
        onError(error)
      }
    }
  )
}

// Users functions
export const addUser = (username, userId) => {
  const run = async () => {
    await ensureUserIsProvisioned(userId)
  const database = getDb()
  const usersRef = ref(database, `users/${userId}`)
  const now = Date.now()

    await set(usersRef, {
      username,
      timestamp: now,
      lastActive: now,
      status: 'online',
    })

    const disconnect = onDisconnect(usersRef)
    await disconnect.remove()
  }

  return run()
}

export const removeUser = (userId) => {
  const database = getDb()
  const usersRef = ref(database, `users/${userId}`)
  return remove(usersRef)
}

export const touchUserActivity = (userId) => {
  const run = async () => {
    if (!userId) return
    await ensureUserIsProvisioned(userId)
    const database = getDb()
    const usersRef = ref(database, `users/${userId}`)
    await update(usersRef, {
      lastActive: Date.now(),
      status: 'online',
    })
  }

  return run()
}

export const listenToUsers = (callback, onError) => {
  const database = getDb()
  const usersRef = ref(database, 'users')
  
  return onValue(
    usersRef,
    (snapshot) => {
      const now = Date.now()
      const users = []
      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val() || {}
        const lastActive = userData.lastActive || userData.timestamp || 0
        const isOnline =
          userData.status === 'online' &&
          now - lastActive <= ONLINE_TTL_MS

        if (!isOnline) {
          return
        }

        users.push({
          socketId: childSnapshot.key,
          ...userData,
          lastActive,
        })
      })
      callback(users)
    },
    (error) => {
      if (onError) {
        onError(error)
      }
    }
  )
}

// System messages
export const addSystemMessage = (text) => {
  const database = getDb()
  const messagesRef = ref(database, 'messages')
  const newMessageRef = push(messagesRef)
  
  return set(newMessageRef, {
    text,
    timestamp: Date.now(),
    isSystem: true,
  })
}
