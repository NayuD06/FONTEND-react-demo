# Chat App (Firebase Auth + MongoDB)

Ung dung chat don gian voi:
- Frontend: React + Vite
- Xac thuc: Firebase Authentication (email/password)
- Luu tin nhan: MongoDB qua Express API

## 1. Cai dat

Tai thu muc goc:

```bash
npm install
```

Tai thu muc server:

```bash
cd server
npm install
```

## 2. Cau hinh bien moi truong

Tao file .env tai thu muc goc tu mau .env.example.

Can thiet:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_DATABASE_URL=
VITE_API_BASE_URL=http://localhost:3001
```

Tao file .env tai thu muc server tu mau server/.env.example.

Can thiet:

```bash
PORT=3001
MONGO_URI=mongodb://127.0.0.1:27017/chat_app03
```

## 3. Chay local

Tu thu muc goc:

```bash
npm run start
```

Lenh nay chay dong thoi frontend va backend.

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 4. API chinh

- GET /api/messages?limit=60
- POST /api/messages
- GET /api/users
- POST /api/users
- DELETE /api/users/:userId

## 5. Ghi chu

- Tai khoan dang nhap dang dung Firebase Auth.
- Tin nhan va thong diep he thong duoc luu trong MongoDB.
- Danh sach user online duoc giu tam trong bo nho server.
- Khi deploy frontend, bat buoc set VITE_API_BASE_URL tro toi backend public (https://...), neu khong app se OFFLINE.
