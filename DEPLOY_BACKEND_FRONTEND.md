# Deploy Chat App (Backend + Frontend)

## 1) Deploy backend (Railway)

1. Vao Railway > New Project > Deploy from GitHub repo nay.
2. Tao service tu folder `server` (Root Directory = `server`).
3. Railway se doc `server/railway.json` va start bang `npm start`.
4. Set Environment Variables cho service:

- `MONGO_URI` = chuoi MongoDB cua ban
- `MONGO_DB_NAME` = `chat_app03`
- `PORT` = de Railway cap tu dong (khong can set thu cong)

5. Sau khi deploy xong, lay URL backend (vi du):

`https://your-chat-api.up.railway.app`

6. Kiem tra backend song:

`https://your-chat-api.up.railway.app/api/health`

Neu thay JSON co `ok: true` (hoac co response), backend da chay.

## 2) Deploy frontend (Firebase Hosting)

1. Mo file `.env.production` va set:

`VITE_API_BASE_URL=https://your-chat-api.up.railway.app`

2. Chay deploy frontend:

```bash
npm run deploy:hosting
```

## 3) Sau khi deploy

1. Hard refresh trinh duyet (`Ctrl + F5`).
2. Mo lai web hosting va dang nhap.
3. Neu van OFFLINE, kiem tra lai:

- Backend URL co dang `https://...` khong
- URL co dung service backend khong
- `/api/health` co tra ket qua khong

## Ghi chu quan trong

- Khong dat `VITE_API_BASE_URL` bang domain frontend Firebase (`*.web.app`).
- Frontend HTTPS bat buoc goi backend HTTPS.
