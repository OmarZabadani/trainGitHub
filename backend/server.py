from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import io
import uuid
import logging
import secrets
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import bcrypt
import jwt
import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, UploadFile, File, status
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorClient
from starlette.middleware.cors import CORSMiddleware

# ---------- Setup ----------
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("cityeye")

UPLOAD_DIR = ROOT_DIR / "uploads"
ORIG_DIR = UPLOAD_DIR / "original"
ANNOT_DIR = UPLOAD_DIR / "annotated"
for d in (UPLOAD_DIR, ORIG_DIR, ANNOT_DIR):
    d.mkdir(parents=True, exist_ok=True)

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ["JWT_SECRET"]

VALID_ROLES = {"user", "police", "analyzer"}
VEHICLE_CLASSES = {"car", "bus", "truck", "motorcycle", "bicycle"}

# ---------- YOLO lazy loader ----------
_model = None

def get_model():
    global _model
    if _model is None:
        from ultralytics import YOLO
        model_path = ROOT_DIR / "yolov8n.pt"
        _model = YOLO(str(model_path)) if model_path.exists() else YOLO("yolov8n.pt")
    return _model

# ---------- Security helpers ----------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id, "email": email, "role": role, "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id, "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=60*60*24, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=60*60*24*7, path="/")

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_roles(*roles: str):
    async def checker(user: dict = Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Insufficient role")
        return user
    return checker

# ---------- Models ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)
    role: Literal["user", "police", "analyzer"] = "user"

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: str

class VehicleCounts(BaseModel):
    car: int = 0
    bus: int = 0
    truck: int = 0
    motorcycle: int = 0
    bicycle: int = 0
    total: int = 0

class SignalRecommendation(BaseModel):
    phase: Literal["green", "yellow", "red"]
    duration_seconds: int
    reason: str

class AnalysisOut(BaseModel):
    id: str
    user_id: str
    user_email: str
    media_type: str
    original_url: str
    annotated_url: str
    counts: VehicleCounts
    density: Literal["low", "medium", "high"]
    density_score: float
    signal: SignalRecommendation
    flagged: bool = False
    flag_note: Optional[str] = None
    created_at: str

class FlagIn(BaseModel):
    note: Optional[str] = None

# ---------- Detection Logic ----------
COCO_VEHICLE_NAMES = {"car", "bus", "truck", "motorcycle", "bicycle"}

def run_detection_on_image(image_bytes: bytes, out_path: Path) -> dict:
    """Run YOLO on raw image bytes; save annotated image to out_path. Returns counts + meta."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid image data")

    # CLAHE contrast enhancement on L channel (preprocessing per project spec)
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l2 = clahe.apply(l)
    enhanced = cv2.cvtColor(cv2.merge([l2, a, b]), cv2.COLOR_LAB2BGR)

    model = get_model()
    results = model.predict(enhanced, conf=0.35, verbose=False)[0]
    names = results.names

    counts = {k: 0 for k in COCO_VEHICLE_NAMES}
    boxes = []

    color_map = {
        "car": (255, 229, 0),       # cyan-yellow BGR approx neon
        "bus": (0, 165, 255),       # orange
        "truck": (255, 59, 48),     # red-ish
        "motorcycle": (6, 214, 160),
        "bicycle": (255, 255, 255),
    }

    for b in results.boxes:
        cls_id = int(b.cls[0])
        name = names.get(cls_id, "").lower()
        if name in COCO_VEHICLE_NAMES:
            counts[name] += 1
            x1, y1, x2, y2 = map(int, b.xyxy[0].tolist())
            conf = float(b.conf[0])
            boxes.append({"class": name, "conf": round(conf, 3), "x1": x1, "y1": y1, "x2": x2, "y2": y2})
            color = color_map.get(name, (0, 229, 255))
            cv2.rectangle(enhanced, (x1, y1), (x2, y2), color, 2)
            label = f"{name} {conf:.2f}"
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            cv2.rectangle(enhanced, (x1, y1 - th - 6), (x1 + tw + 6, y1), color, -1)
            cv2.putText(enhanced, label, (x1 + 3, y1 - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)

    cv2.imwrite(str(out_path), enhanced)
    total = sum(counts.values())
    return {"counts": {**counts, "total": total}, "boxes": boxes}

def extract_first_frame(video_bytes: bytes, tmp_path: Path) -> bytes:
    tmp_path.write_bytes(video_bytes)
    cap = cv2.VideoCapture(str(tmp_path))
    ok, frame = cap.read()
    cap.release()
    if not ok or frame is None:
        raise ValueError("Could not read video frame")
    ok2, buf = cv2.imencode(".jpg", frame)
    if not ok2:
        raise ValueError("Could not encode frame")
    return buf.tobytes()

def classify_density(total: int) -> tuple[str, float]:
    # density score: simple saturating curve
    score = min(1.0, total / 30.0)
    if total <= 5:
        return "low", score
    elif total <= 15:
        return "medium", score
    return "high", score

def recommend_signal(density: str, total: int) -> SignalRecommendation:
    if density == "high":
        return SignalRecommendation(phase="green", duration_seconds=45, reason=f"High congestion ({total} vehicles). Extend green to clear queue.")
    if density == "medium":
        return SignalRecommendation(phase="green", duration_seconds=30, reason=f"Moderate flow ({total} vehicles). Standard green phase.")
    return SignalRecommendation(phase="yellow", duration_seconds=15, reason=f"Low traffic ({total} vehicles). Prioritize cross-street green.")

# ---------- App ----------
app = FastAPI(title="City Eye API")
api = APIRouter(prefix="/api")

# Static files mount for uploads under /api/uploads (so it goes through ingress)
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# ---------- Auth endpoints ----------
@api.post("/auth/register", response_model=UserOut)
async def register(body: RegisterIn, response: Response):
    email = body.email.lower()
    if body.role not in VALID_ROLES:
        raise HTTPException(400, "Invalid role")
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(400, "Email already registered")
    uid = str(uuid.uuid4())
    doc = {
        "id": uid,
        "email": email,
        "name": body.name,
        "role": body.role,
        "password_hash": hash_password(body.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    set_auth_cookies(response, create_access_token(uid, email, body.role), create_refresh_token(uid))
    return UserOut(id=uid, email=email, name=body.name, role=body.role, created_at=doc["created_at"])

@api.post("/auth/login", response_model=UserOut)
async def login(body: LoginIn, response: Response):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    set_auth_cookies(response, create_access_token(user["id"], email, user["role"]), create_refresh_token(user["id"]))
    return UserOut(id=user["id"], email=user["email"], name=user["name"], role=user["role"], created_at=user["created_at"])

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}

@api.get("/auth/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return UserOut(**user)

# ---------- Analysis endpoints ----------
def _persist_analysis(user: dict, media_type: str, orig_name: str, annot_name: str, detection: dict) -> dict:
    counts_dict = detection["counts"]
    total = counts_dict["total"]
    density, density_score = classify_density(total)
    signal = recommend_signal(density, total)

    analysis_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": analysis_id,
        "user_id": user["id"],
        "user_email": user["email"],
        "media_type": media_type,
        "original_url": f"/api/uploads/original/{orig_name}",
        "annotated_url": f"/api/uploads/annotated/{annot_name}",
        "counts": {
            "car": counts_dict.get("car", 0),
            "bus": counts_dict.get("bus", 0),
            "truck": counts_dict.get("truck", 0),
            "motorcycle": counts_dict.get("motorcycle", 0),
            "bicycle": counts_dict.get("bicycle", 0),
            "total": total,
        },
        "density": density,
        "density_score": round(density_score, 3),
        "signal": signal.model_dump(),
        "flagged": False,
        "flag_note": None,
        "created_at": now_iso,
    }
    return doc

@api.post("/analyze/image", response_model=AnalysisOut)
async def analyze_image(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    data = await file.read()
    if not data:
        raise HTTPException(400, "Empty file")
    ext = (file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg").lower()
    if ext not in ("jpg", "jpeg", "png", "webp", "bmp"):
        ext = "jpg"
    uid_name = str(uuid.uuid4())
    orig_name = f"{uid_name}.{ext}"
    annot_name = f"{uid_name}.jpg"
    (ORIG_DIR / orig_name).write_bytes(data)
    try:
        detection = run_detection_on_image(data, ANNOT_DIR / annot_name)
    except Exception as e:
        logger.exception("detection failed")
        raise HTTPException(500, f"Detection failed: {e}")
    doc = _persist_analysis(user, "image", orig_name, annot_name, detection)
    await db.analyses.insert_one(dict(doc))
    return AnalysisOut(**doc)

@api.post("/analyze/video", response_model=AnalysisOut)
async def analyze_video(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    data = await file.read()
    if not data:
        raise HTTPException(400, "Empty file")
    ext = (file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "mp4").lower()
    uid_name = str(uuid.uuid4())
    orig_name = f"{uid_name}.{ext}"
    annot_name = f"{uid_name}.jpg"
    (ORIG_DIR / orig_name).write_bytes(data)
    tmp_video_path = ORIG_DIR / f"_tmp_{uid_name}.{ext}"
    try:
        frame_bytes = extract_first_frame(data, tmp_video_path)
    except Exception as e:
        raise HTTPException(400, f"Could not read video: {e}")
    finally:
        if tmp_video_path.exists():
            tmp_video_path.unlink(missing_ok=True)
    try:
        detection = run_detection_on_image(frame_bytes, ANNOT_DIR / annot_name)
    except Exception as e:
        logger.exception("video detection failed")
        raise HTTPException(500, f"Detection failed: {e}")
    # Save the extracted frame as "original" thumbnail too for display (keep video as original file)
    doc = _persist_analysis(user, "video", orig_name, annot_name, detection)
    await db.analyses.insert_one(dict(doc))
    return AnalysisOut(**doc)

@api.get("/analyses", response_model=List[AnalysisOut])
async def list_analyses(user: dict = Depends(get_current_user)):
    query = {} if user["role"] in ("police", "analyzer") else {"user_id": user["id"]}
    cursor = db.analyses.find(query, {"_id": 0}).sort("created_at", -1).limit(200)
    return [AnalysisOut(**doc) async for doc in cursor]

@api.get("/analyses/{aid}", response_model=AnalysisOut)
async def get_analysis(aid: str, user: dict = Depends(get_current_user)):
    doc = await db.analyses.find_one({"id": aid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Not found")
    if user["role"] == "user" and doc["user_id"] != user["id"]:
        raise HTTPException(403, "Forbidden")
    return AnalysisOut(**doc)

@api.post("/analyses/{aid}/flag", response_model=AnalysisOut)
async def flag_analysis(aid: str, body: FlagIn, user: dict = Depends(require_roles("police"))):
    doc = await db.analyses.find_one({"id": aid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Not found")
    await db.analyses.update_one({"id": aid}, {"$set": {"flagged": True, "flag_note": body.note}})
    doc["flagged"] = True
    doc["flag_note"] = body.note
    return AnalysisOut(**doc)

@api.post("/analyses/{aid}/unflag", response_model=AnalysisOut)
async def unflag_analysis(aid: str, user: dict = Depends(require_roles("police"))):
    doc = await db.analyses.find_one({"id": aid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Not found")
    await db.analyses.update_one({"id": aid}, {"$set": {"flagged": False, "flag_note": None}})
    doc["flagged"] = False
    doc["flag_note"] = None
    return AnalysisOut(**doc)

# ---------- Analytics (analyzer) ----------
@api.get("/analytics/summary")
async def analytics_summary(user: dict = Depends(require_roles("analyzer", "police"))):
    total = await db.analyses.count_documents({})
    by_density = {}
    for d in ("low", "medium", "high"):
        by_density[d] = await db.analyses.count_documents({"density": d})
    flagged = await db.analyses.count_documents({"flagged": True})
    # aggregate vehicle totals
    pipeline = [
        {"$group": {
            "_id": None,
            "car": {"$sum": "$counts.car"},
            "bus": {"$sum": "$counts.bus"},
            "truck": {"$sum": "$counts.truck"},
            "motorcycle": {"$sum": "$counts.motorcycle"},
            "bicycle": {"$sum": "$counts.bicycle"},
            "total_vehicles": {"$sum": "$counts.total"},
        }}
    ]
    agg = await db.analyses.aggregate(pipeline).to_list(1)
    totals = agg[0] if agg else {"car": 0, "bus": 0, "truck": 0, "motorcycle": 0, "bicycle": 0, "total_vehicles": 0}
    totals.pop("_id", None)
    # recent trend: last 14 entries density scores
    recent = await db.analyses.find({}, {"_id": 0, "created_at": 1, "density_score": 1, "counts.total": 1}).sort("created_at", -1).limit(14).to_list(14)
    trend = [{"created_at": r["created_at"], "score": r["density_score"], "total": r["counts"]["total"]} for r in reversed(recent)]
    return {
        "total_analyses": total,
        "by_density": by_density,
        "flagged": flagged,
        "vehicle_totals": totals,
        "trend": trend,
    }

@api.get("/")
async def root():
    return {"service": "City Eye API", "status": "ok"}

# ---------- Startup ----------
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.analyses.create_index("user_id")
    await db.analyses.create_index("created_at")
    # Seed admin as analyzer role
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@cityeye.io").lower()
    admin_pw = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "name": "Admin Analyzer",
            "role": "analyzer",
            "password_hash": hash_password(admin_pw),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Seeded admin analyzer: {admin_email}")
    # Pre-load model lazily on first request to avoid long startup
    logger.info("City Eye API started")

@app.on_event("shutdown")
async def shutdown():
    client.close()

app.include_router(api)

# CORS - explicit origin for cookies
frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
