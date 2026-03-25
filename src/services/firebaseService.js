import { initializeApp } from 'firebase/app'
import { getDatabase, ref, push, set, onValue, remove, query, orderByChild, limitToLast } from 'firebase/database'

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

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const database = getDatabase(app)

// Messages functions
export const sendMessage = (username, text) => {
  const messagesRef = ref(database, 'messages')
  const newMessageRef = push(messagesRef)
  
  return set(newMessageRef, {
    username,
    text,
    timestamp: Date.now(),
    sender: username, // to identify which side to show message
  })
}

export const listenToMessages = (callback) => {
  const messagesRef = ref(database, 'messages')
  const messagesQuery = query(messagesRef, limitToLast(50))
  
  return onValue(messagesQuery, (snapshot) => {
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
  })
}

// Users functions
export const addUser = (username, userId) => {
  const usersRef = ref(database, `users/${userId}`)
  return set(usersRef, {
    username,
    timestamp: Date.now(),
    status: 'online',
  })
}

export const removeUser = (userId) => {
  const usersRef = ref(database, `users/${userId}`)
  return remove(usersRef)
}

export const listenToUsers = (callback) => {
  const usersRef = ref(database, 'users')
  
  return onValue(usersRef, (snapshot) => {
    const users = []
    snapshot.forEach((childSnapshot) => {
      users.push({
        socketId: childSnapshot.key,
        ...childSnapshot.val(),
      })
    })
    callback(users)
  })
}

// System messages
export const addSystemMessage = (text) => {
  const messagesRef = ref(database, 'messages')
  const newMessageRef = push(messagesRef)
  
  return set(newMessageRef, {
    text,
    timestamp: Date.now(),
    isSystem: true,
  })
}

export default database
