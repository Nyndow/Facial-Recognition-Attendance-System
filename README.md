# Facial Recognition Attendance System

Attendance tracking based on face recognition. The app is made of three services that run side by side:

| Service | Folder | Stack | Port |
|---|---|---|---|
| **API** | `Backend/API` | Flask, SQLAlchemy (SQLite), JWT | `5000` |
| **AI detector** | `Backend/AI` | Flask, YOLO (Ultralytics), FaceNet (PyTorch), OpenCV | `5002` |
| **Frontend** | `Frontend` | Next.js 16, React 19, Tailwind CSS 4 | `3000` |

```
Browser ──► Frontend (3000) ──► API (5000) ──► AI detector (5002) ──► webcam
                                    ▲                    │
                                    └── attendance ──────┘
```

The ports `5000` and `5002` are hard-coded in the backend (`Backend/AI/core.py`, `Backend/API/routes/CameraRoutes.py`, `Backend/API/routes/StudentRoutes.py`), so all three services are expected to run on the same machine.

---

## Prerequisites

- **Python 3.11 or 3.12** (the API's pinned `numpy==2.4.4` needs Python ≥ 3.11)
- **Node.js 20+** and npm
- **Git**
- A **webcam** (or a video file / stream URL) for the AI detector
- **Linux** recommended: `Backend/AI/requirements.txt` pins NVIDIA CUDA wheels (`nvidia-*`, `cuda-toolkit`, `triton`) that are only published for Linux
- Optional: an NVIDIA GPU. Detection falls back to CPU automatically when CUDA is not available.

On Debian/Ubuntu, OpenCV's preview window also needs a few system libraries:

```bash
sudo apt install python3-venv libgl1 libglib2.0-0
```

---

## 1. Clone the repository

```bash
git clone <repository-url> Facial-Recognition-Attendance-System
cd Facial-Recognition-Attendance-System
```

---

## 2. API (`Backend/API`)

```bash
cd Backend/API
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Configuration (optional)

`Backend/API/config/config.py` reads these environment variables:

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | `dev-key` | Flask secret key |
| `DATABASE_URL` | `sqlite:///students.db` | SQLAlchemy database URI. With SQLite the file is created in `Backend/API/instance/` |

> The JWT signing key is currently hard-coded as `SECRET_KEY` in `Backend/API/routes/AuthRoutes.py`. Change it before any real deployment.

### Run

The API must be started from inside `Backend/API` because it imports its modules relatively (`config`, `models`, `routes`):

```bash
cd Backend/API
source venv/bin/activate
python app.py
```

The API listens on <http://127.0.0.1:5000>. Tables are created automatically on first start.

---

## 3. AI detector (`Backend/AI`)

Use a **separate** virtual environment: its dependencies (TensorFlow, PyTorch, CUDA wheels) are large and pin a different `numpy` version than the API.

```bash
cd Backend/AI
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

> The install downloads several GB (PyTorch + CUDA libraries). On the first run, `facenet-pytorch` also downloads its pretrained FaceNet weights, so an internet connection is needed.

The trained face-detection model is already included at `Backend/AI/model/best.pt`.

### Run

Start it from inside `Backend/AI` (the default model path `model/best.pt` is relative):

```bash
cd Backend/AI
source venv/bin/activate
python server.py
```

The detector listens on <http://0.0.0.0:5002>. When a session is started from the app, an OpenCV window titled **Face Detection** opens; press `q` in that window to stop detection.

### Useful options

All options are defined in `Backend/AI/config/config.py`:

| Option | Default | Description |
|---|---|---|
| `--source` | `0` | Camera index, video file path, or stream URL |
| `--model` | `model/best.pt` | YOLO weights |
| `--device` | auto | `cpu`, `cuda`, `0`, … |
| `--conf` | `0.45` | Detection confidence threshold |
| `--similarity` | `0.6` | Face-matching similarity threshold |
| `--confirm-frames` | `5` | Frames a face must be matched before it is confirmed |
| `--skip-frames` | `2` | Process every Nth frame |
| `--show-fps` | off | Show FPS in the preview window |
| `--save` / `--output` | off / `output.avi` | Record the annotated video |

Example with a second webcam on CPU:

```bash
python server.py --source 1 --device cpu --show-fps
```

---

## 4. Frontend (`Frontend`)

```bash
cd Frontend
npm install
```

Create `Frontend/.env.local` so the frontend knows where the API is:

```bash
echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:5000" > .env.local
```

### Run (development)

```bash
npm run dev
```

Open <http://localhost:3000>.

### Run (production build)

```bash
npm run build
npm start
```

`NEXT_PUBLIC_*` variables are embedded at build time, so rebuild after changing `NEXT_PUBLIC_API_URL`.

---

## 5. Create the first admin account

There is no default user. With the API running, register an admin through the `/register` endpoint:

```bash
curl -X POST http://127.0.0.1:5000/register \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "change-me", "isAdmin": true}'
```

Then log in at <http://localhost:3000/login> with those credentials.

---

## Starting everything

Open three terminals from the repository root:

```bash
# Terminal 1 — API
cd Backend/API && source venv/bin/activate && python app.py

# Terminal 2 — AI detector
cd Backend/AI && source venv/bin/activate && python server.py

# Terminal 3 — Frontend
cd Frontend && npm run dev
```

Quick health checks:

```bash
curl http://127.0.0.1:5002/health   # {"status": "idle"}
curl -X POST http://127.0.0.1:5000/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "change-me"}'
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `ModuleNotFoundError: No module named 'config'` | Run `app.py` / `server.py` from inside its own folder (`Backend/API` or `Backend/AI`). |
| Frontend requests go to `undefined/...` | `Frontend/.env.local` is missing `NEXT_PUBLIC_API_URL`; restart `npm run dev` after adding it. |
| Camera does not open / black window | Try another `--source` index; on Linux make sure your user is in the `video` group. |
| `qt.qpa.xcb: could not connect to display` | The detector needs a graphical session for its preview window (no headless/SSH without X forwarding). |
| `pip install` fails on the `nvidia-*` packages | You are not on Linux x86_64. Remove the `nvidia-*`, `cuda-*` and `triton` lines from `Backend/AI/requirements.txt` and install the CPU build of PyTorch. |
| Students cannot be registered with a photo | The AI detector (port 5002) must be running: the API calls it to compute face embeddings. |
