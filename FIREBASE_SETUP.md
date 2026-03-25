# Firebase Chat Setup Guide 🚀

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create project"**
3. Project name: `chat-app` (or your preferred name)
4. Disable Google Analytics (optional)
5. Click **"Create"**

---

## Step 2: Get Firebase Credentials

1. In Firebase Console, click **⚙️ Project Settings** (click the gear icon, top-left)
2. Select tab **"Your apps"** or scroll down
3. Click **"Create app"** → Select **Web** (</> icon)
4. App name: `chat-app`
5. Click **"Register app"**
6. Copy your Firebase config object (looks like this):

```javascript
{
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcd1234efgh5678",
  databaseURL: "https://your-project.firebaseio.com"
}
```

---

## Step 3: Update Environment Variables

Replace values in `.env`:

```bash
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcd1234efgh5678
VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

Also update `.env.production` (for Vercel):

```bash
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcd1234efgh5678
VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

---

## Step 4: Enable Realtime Database

1. In Firebase Console, go to **"Realtime Database"** (left sidebar)
2. Click **"Create Database"**
3. Start in **"Test Mode"** (for development)
4. Location: choose closest to you
5. Click **"Enable"**

---

## Step 5: Set Database Security Rules

1. Go to **"Realtime Database"** → **"Rules"** tab
2. Replace with these rules:

```json
{
  "rules": {
    "messages": {
      ".read": true,
      ".write": true
    },
    "users": {
      ".read": true,
      ".write": true
    }
  }
}
```

3. Click **"Publish"**

---

## Step 6: Install Dependencies

```bash
npm install
```

---

## Step 7: Test Locally

```bash
npm run dev
```

Then open http://localhost:5173 and test with multiple browser tabs.

---

## Step 8: Deploy to Vercel

1. Push code to GitHub:
```bash
git add .
git commit -m "Add Firebase chat integration"
git push origin main
```

2. Go to [Vercel Dashboard](https://vercel.com)
3. Connect your GitHub repo
4. Add environment variables in **Settings** → **Environment Variables**:
   - Copy all `VITE_FIREBASE_*` values from `.env.production`

5. Click **"Deploy"**

---

## ✅ You're Done!

Now share your Vercel URL with friends and they can chat with you in real-time!

**Example:** https://your-chat-app.vercel.app

---

## 🔐 Security Notes

- Test Mode is only for development
- Before going to production, set up proper authentication
- Implement security rules based on your needs
- Consider adding user authentication with Firebase Auth

---

## 📱 Multi-user Chat

- Open your Vercel link in multiple windows/tabs
- Enter different names
- All users will see messages in real-time
- No WebSocket server needed!
