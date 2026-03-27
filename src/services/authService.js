import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { getFirebaseApp } from './firebaseService'

let authInstance = null
let persistencePromise = null

const getFirebaseAuth = () => {
  if (authInstance) return authInstance

  const app = getFirebaseApp()
  authInstance = getAuth(app)
  return authInstance
}

const ensureAuthPersistence = async () => {
  const auth = getFirebaseAuth()

  if (!persistencePromise) {
    persistencePromise = setPersistence(auth, browserLocalPersistence).catch(() => null)
  }

  await persistencePromise
}

export const onAuthChanged = (callback) => {
  const auth = getFirebaseAuth()
  ensureAuthPersistence().catch(() => {})
  return onAuthStateChanged(auth, callback)
}

export const loginWithEmail = async (email, password) => {
  await ensureAuthPersistence()
  const auth = getFirebaseAuth()
  return signInWithEmailAndPassword(auth, email, password)
}

export const registerWithEmail = async (email, password, displayName) => {
  await ensureAuthPersistence()
  const auth = getFirebaseAuth()
  const credential = await createUserWithEmailAndPassword(auth, email, password)

  if (displayName?.trim()) {
    await updateProfile(credential.user, {
      displayName: displayName.trim(),
    })
  }

  return credential
}

export const logoutUser = () => {
  const auth = getFirebaseAuth()
  return signOut(auth)
}
