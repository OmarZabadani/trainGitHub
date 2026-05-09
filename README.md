# City Eye — AI-Powered Smart Traffic Monitoring System

Real-time vehicle detection, traffic density scoring, and signal-timing recommendations powered by **YOLOv8**.
Stack: **FastAPI** + **MongoDB** + **React** + **Ultralytics YOLOv8**.

---

## 1. Prerequisites

Install these on your machine first:

| Tool           | Version         | Install                                                                                 |
| -------------- | --------------- | --------------------------------------------------------------------------------------- |
| **Python**     | 3.10 or 3.11    | https://www.python.org/downloads/                                                       |
| **Node.js**    | 18 or newer     | https://nodejs.org/                                                                     |
| **Yarn**       | latest          | `npm install -g yarn`                                                                   |
| **MongoDB**    | 6.x             | https://www.mongodb.com/try/download/community  (or use `mongod` / MongoDB Atlas)       |
| **Git**        | latest          | https://git-scm.com/downloads                                                           |

> Note: the first run will download the YOLOv8n model weights (~6 MB) automatically.

---

## 2. Clone the repository

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

---

## 3. Start MongoDB

**Option A — local install:**
```bash
mongod --dbpath /path/to/your/data/folder
```

**Option B — Docker (easiest):**
```bash
docker run -d --name city-eye-mongo -p 27017:27017 mongo:6
```

**Option C — MongoDB Atlas:**
Create a free cluster and copy the connection string — you'll paste it into `backend/.env` in the next step.

---

## 4. Backend setup (FastAPI + YOLOv8)

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

# Install dependencies (this downloads PyTorch + Ultralytics — can take a few minutes)
pip install -r requirements.txt
```

### Create `backend/.env`

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="city_eye"
CORS_ORIGINS="http://localhost:3000"
FRONTEND_URL="http://localhost:3000"
JWT_SECRET="replace-with-any-long-random-hex-string"
ADMIN_EMAIL="admin@cityeye.io"
ADMIN_PASSWORD="admin123"
```

### Run the backend

```bash
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Backend is now live at **http://localhost:8001**.
Test it: open http://localhost:8001/api/ — you should see `{"service":"City Eye API","status":"ok"}`.

On first image analysis the `yolov8n.pt` model will auto-download to the `backend/` folder.

---

## 5. Frontend setup (React)

Open a **new terminal**, then:

```bash
cd frontend
yarn install
```

### Create `frontend/.env`

```env
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=0
```

> Important: if you host the backend on a different host/port, update `REACT_APP_BACKEND_URL`.
> The backend cookies use `SameSite=None; Secure` — for pure `http://localhost` development you may need
> to change the cookie flags in `backend/server.py` (function `set_auth_cookies`) to:
> `secure=False, samesite="lax"`.

### Run the frontend

```bash
yarn start
```

Frontend is now live at **http://localhost:3000**.

---

## 6. First login

A demo **Analyzer** account is seeded automatically on first backend start:

```
Email:    admin@cityeye.io
Password: admin123
Role:     analyzer
```

Or register fresh accounts at `/register` and pick a role: **Citizen**, **Police Officer**, or **Analyzer**.

---

## 7. Using the app

1. Go to `/analyze`
2. Drop a **traffic image** (jpg/png) or a short **video clip** (mp4/webm)
3. Click **Run AI Analysis** — YOLOv8 detects vehicles, draws bounding boxes, scores density, and recommends a traffic-signal phase
4. Visit `/history` to see all past scenes
5. **Police** users get `/police` for flagging incidents; **Analyzer** users get `/analyzer` for aggregate charts

---

## 8. Project structure

```
.
├── backend/
│   ├── server.py            # FastAPI app, auth, YOLOv8 detection, endpoints
│   ├── requirements.txt
│   ├── .env                 # (create this yourself)
│   ├── uploads/             # auto-created: original + annotated images
│   └── yolov8n.pt           # auto-downloaded YOLOv8 model
└── frontend/
    ├── package.json
    ├── .env                 # (create this yourself)
    └── src/
        ├── App.js
        ├── lib/api.js
        ├── contexts/AuthContext.jsx
        ├── components/{Navbar,DensityMeter,SignalCard,VehicleCounts,ProtectedRoute}.jsx
        └── pages/{Landing,Login,Register,Dashboard,Analyze,History,AnalysisDetail,PolicePortal,AnalyzerPortal}.jsx
```

---

## 9. Troubleshooting

| Symptom                                           | Fix                                                                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `ModuleNotFoundError: ultralytics`                | Re-run `pip install -r requirements.txt` inside the activated venv                                           |
| Backend can't connect to MongoDB                  | Confirm `mongod` is running on 27017 — or update `MONGO_URL` in `backend/.env`                               |
| Login succeeds but `/dashboard` bounces to `/login` on localhost | Cookies with `SameSite=None;Secure` aren't sent over plain HTTP. Edit `set_auth_cookies` in `server.py` → `secure=False, samesite="lax"` |
| `CORS error` in the browser                       | Set `CORS_ORIGINS` and `FRONTEND_URL` in `backend/.env` to your exact frontend origin (e.g. `http://localhost:3000`) |
| YOLO model download blocked                       | Manually download `yolov8n.pt` from https://github.com/ultralytics/assets/releases and drop it in `backend/` |
| PyTorch install is huge / fails on your machine   | Install CPU-only: `pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu` before `pip install -r requirements.txt` |

---

## 10. Quick start cheat-sheet (tl;dr)

```bash
# terminal 1 — mongo
docker run -d --name city-eye-mongo -p 27017:27017 mongo:6

# terminal 2 — backend
cd backend && python -m venv .venv && source .venv/bin/activate \
  && pip install -r requirements.txt \
  && cp .env.example .env   # (or create .env manually as shown above)
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# terminal 3 — frontend
cd frontend && yarn install && yarn start
```

Open http://localhost:3000 and sign in with `admin@cityeye.io` / `admin123`.

Happy traffic watching.
