# Deploy tren Vercel (fix OFFLINE)

Ban can 2 project rieng tren Vercel:

- Frontend project (thu muc goc repo)
- Backend project (thu muc `server`)

Neu chi deploy frontend thi app se OFFLINE vi khong co API chat.

## A. Deploy backend project tren Vercel

1. Vao Vercel > Add New > Project > chon repo nay.
2. Trong phan setting project backend:
- Root Directory: `server`
- Framework Preset: `Other`
- Build Command: de mac dinh
- Output Directory: de trong
- Install Command: `npm install`

3. Them Environment Variables cho backend project:
- `MONGO_URI` = chuoi ket noi MongoDB
- `MONGO_DB_NAME` = `chat_app03`

4. Deploy backend.
5. Lay URL backend, vi du:
`https://fontend-react-demo-api.vercel.app`

6. Test backend:
- Mo `https://fontend-react-demo-api.vercel.app/api/health`
- Neu co JSON tra ve la OK.

## B. Gan frontend toi backend

1. Vao frontend project tren Vercel > Settings > Environment Variables.
2. Them bien:
- `VITE_API_BASE_URL` = URL backend vua deploy
Vi du: `https://fontend-react-demo-api.vercel.app`

3. Redeploy frontend (Deployments > Redeploy).

## C. Kiem tra

1. Mo web frontend.
2. Dang nhap.
3. Header khong con OFFLINE, user list va message load duoc.

## Luu y quan trong

- Khong dat `VITE_API_BASE_URL` bang domain frontend.
- Frontend HTTPS phai goi backend HTTPS.
