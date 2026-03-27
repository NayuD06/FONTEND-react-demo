import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Support both server/.env and root/.env so local setup is more forgiving.
dotenv.config({ path: path.resolve(__dirname, '.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const app = express()
app.use(cors())
app.use(express.json())

const users = new Map()

const messageSchema = new mongoose.Schema(
  {
    username: { type: String, default: '' },
    text: { type: String, required: true, trim: true },
    isSystem: { type: Boolean, default: false },
    timestamp: { type: Number, default: () => Date.now() },
  },
  { versionKey: false }
)

const Message = mongoose.model('Message', messageSchema)

const userProfileSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, default: '' },
    displayName: { type: String, default: '' },
    photoURL: { type: String, default: '' },
    lastLoginAt: { type: Number, default: () => Date.now() },
  },
  {
    versionKey: false,
    timestamps: true,
  }
)

const UserProfile = mongoose.model('UserProfile', userProfileSchema)

const toClientMessage = (doc) => ({
  id: doc._id.toString(),
  username: doc.username,
  text: doc.text,
  isSystem: doc.isSystem,
  timestamp: doc.timestamp,
})

const saveSystemMessage = async (text) => {
  await Message.create({
    text,
    isSystem: true,
  })
}

const getUsersList = () => Array.from(users.values())

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    mongoState: mongoose.connection.readyState,
  })
})

app.post('/api/user-profiles/upsert', async (req, res) => {
  try {
    const firebaseUid = req.body?.firebaseUid?.trim()
    if (!firebaseUid) {
      return res.status(400).json({ message: 'Thieu firebaseUid.' })
    }

    const email = req.body?.email?.trim() || ''
    const displayName = req.body?.displayName?.trim() || ''
    const photoURL = req.body?.photoURL?.trim() || ''

    const updated = await UserProfile.findOneAndUpdate(
      { firebaseUid },
      {
        firebaseUid,
        email,
        displayName,
        photoURL,
        lastLoginAt: Date.now(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    ).lean()

    return res.json({
      id: updated._id.toString(),
      firebaseUid: updated.firebaseUid,
      email: updated.email,
      displayName: updated.displayName,
      photoURL: updated.photoURL,
      lastLoginAt: updated.lastLoginAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Khong the luu thong tin user vao MongoDB.',
      detail: error.message,
    })
  }
})

app.get('/api/user-profiles/:firebaseUid', async (req, res) => {
  try {
    const firebaseUid = req.params.firebaseUid
    const found = await UserProfile.findOne({ firebaseUid }).lean()

    if (!found) {
      return res.status(404).json({ message: 'Khong tim thay user profile.' })
    }

    return res.json({
      id: found._id.toString(),
      firebaseUid: found.firebaseUid,
      email: found.email,
      displayName: found.displayName,
      photoURL: found.photoURL,
      lastLoginAt: found.lastLoginAt,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Khong the lay thong tin user.',
      detail: error.message,
    })
  }
})

app.get('/api/messages', async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit, 10) || 50
    const safeLimit = Math.min(Math.max(limit, 1), 200)
    const docs = await Message.find({})
      .sort({ timestamp: -1 })
      .limit(safeLimit)
      .lean()

    const messages = docs
      .reverse()
      .map((doc) => ({ ...doc, id: doc._id.toString() }))

    res.json(messages)
  } catch (error) {
    res.status(500).json({
      message: 'Khong the lay danh sach tin nhan.',
      detail: error.message,
    })
  }
})

app.post('/api/messages', async (req, res) => {
  try {
    const text = req.body?.text?.trim()
    const username = req.body?.username?.trim() || ''
    const isSystem = Boolean(req.body?.isSystem)

    if (!text) {
      return res.status(400).json({ message: 'Noi dung tin nhan khong duoc de trong.' })
    }

    if (!isSystem && !username) {
      return res.status(400).json({ message: 'Thieu ten nguoi gui.' })
    }

    const created = await Message.create({
      username,
      text,
      isSystem,
      timestamp: Date.now(),
    })

    return res.status(201).json(toClientMessage(created))
  } catch (error) {
    return res.status(500).json({
      message: 'Khong the gui tin nhan.',
      detail: error.message,
    })
  }
})

app.get('/api/users', (req, res) => {
  res.json(getUsersList())
})

app.post('/api/users', async (req, res) => {
  try {
    const userId = req.body?.userId?.trim()
    const username = req.body?.username?.trim()

    if (!userId || !username) {
      return res.status(400).json({ message: 'Thieu thong tin userId hoac username.' })
    }

    const existedUser = users.get(userId)
    users.set(userId, {
      socketId: userId,
      username,
      timestamp: Date.now(),
      status: 'online',
    })

    if (!existedUser) {
      await saveSystemMessage(`${username} joined the chat`)
    }

    return res.status(201).json(getUsersList())
  } catch (error) {
    return res.status(500).json({
      message: 'Khong the them user.',
      detail: error.message,
    })
  }
})

app.delete('/api/users/:userId', async (req, res) => {
  try {
    const userId = req.params.userId
    const user = users.get(userId)

    if (user) {
      users.delete(userId)
      await saveSystemMessage(`${user.username} left the chat`)
    }

    res.json(getUsersList())
  } catch (error) {
    res.status(500).json({
      message: 'Khong the xoa user.',
      detail: error.message,
    })
  }
})

const startServer = async () => {
  const mongoUriRaw = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017'
  const mongoDbName = process.env.MONGO_DB_NAME || 'chat_app03'

  const mongoUri =
    mongoUriRaw.includes('?') || mongoUriRaw.endsWith(mongoDbName)
      ? mongoUriRaw
      : `${mongoUriRaw}/${mongoDbName}`

  await mongoose.connect(mongoUri)
  console.log('MongoDB connected')

  const port = Number.parseInt(process.env.PORT, 10) || 3001
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
  })
}

startServer().catch((error) => {
  console.error('Failed to start server:', error.message)
  process.exit(1)
})
