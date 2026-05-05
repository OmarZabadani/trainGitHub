"""
City Eye — one-shot launcher.

Starts the FastAPI backend and the React frontend together, streams their logs
into the same terminal with colored prefixes, and shuts everything down cleanly
on Ctrl+C.

Usage (from the project root):
    python run.py
    python run.py --no-frontend          # backend only
    python run.py --no-backend           # frontend only
    python run.py --backend-port 9000    # custom backend port

Prerequisites (one time, see README.md):
    1. Python venv created in ./backend/.venv with pip install -r backend/requirements.txt
    2. yarn install run inside ./frontend
    3. MongoDB running locally on 27017 (or update backend/.env)
    4. backend/.env  and  frontend/.env  files in place (copy from .env.example)
"""

from __future__ import annotations

import argparse
import os
import platform
import shutil
import signal
import socket
import subprocess
import sys
import threading
import time
from pathlib import Path

# ---------- paths ----------
ROOT = Path(__file__).parent.resolve()
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"

IS_WINDOWS = platform.system() == "Windows"

# ---------- pretty printing ----------
class C:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    CYAN = "\033[36m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    RED = "\033[31m"
    MAGENTA = "\033[35m"


def banner():
    print(f"""{C.CYAN}{C.BOLD}
   ____ _ _          _____
  / ___(_) |_ _   _ | ____|_   _  ___
 | |   | | __| | | ||  _| | | | |/ _ \\
 | |___| | |_| |_| || |___| |_| |  __/
  \\____|_|\\__|\\__, ||_____|\\__, |\\___|
              |___/        |___/
{C.RESET}{C.DIM}  AI-Powered Smart Traffic Monitoring · launcher{C.RESET}
""")


def log(prefix: str, color: str, line: str):
    sys.stdout.write(f"{color}[{prefix}]{C.RESET} {line.rstrip()}\n")
    sys.stdout.flush()


# ---------- helpers ----------
def python_executable_for_backend() -> str:
    """Return the python interpreter inside backend/.venv if present, else current."""
    venv = BACKEND / (".venv/Scripts/python.exe" if IS_WINDOWS else ".venv/bin/python")
    if venv.exists():
        return str(venv)
    return sys.executable


def yarn_executable() -> str:
    cmd = "yarn.cmd" if IS_WINDOWS else "yarn"
    found = shutil.which(cmd)
    if not found:
        raise SystemExit(
            f"{C.RED}yarn not found on PATH. Install it: npm install -g yarn{C.RESET}"
        )
    return found


def port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.4)
        return s.connect_ex((host, port)) == 0


def check_mongo(url: str) -> bool:
    """Best-effort MongoDB ping — does not fail the launcher if check itself fails."""
    try:
        host = "127.0.0.1"
        port = 27017
        # parse "mongodb://host:port" minimally
        if url.startswith("mongodb://"):
            tail = url[len("mongodb://"):].split("/", 1)[0]
            if "@" in tail:
                tail = tail.split("@", 1)[1]
            if ":" in tail:
                host, p = tail.split(":", 1)
                port = int(p.split(",")[0])
            else:
                host = tail
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1.5)
            return s.connect_ex((host, port)) == 0
    except Exception:
        return False


def read_env_file(path: Path) -> dict:
    out: dict[str, str] = {}
    if not path.exists():
        return out
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def stream_output(proc: subprocess.Popen, prefix: str, color: str):
    assert proc.stdout is not None
    for line in proc.stdout:
        log(prefix, color, line)


# ---------- service starters ----------
def start_backend(port: int) -> subprocess.Popen:
    py = python_executable_for_backend()
    cmd = [
        py,
        "-m",
        "uvicorn",
        "server:app",
        "--host",
        "0.0.0.0",
        "--port",
        str(port),
        "--reload",
    ]
    log("BACKEND", C.GREEN, f"starting · {' '.join(cmd)}")
    log("BACKEND", C.DIM, f"cwd={BACKEND}")
    return subprocess.Popen(
        cmd,
        cwd=str(BACKEND),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )


def start_frontend() -> subprocess.Popen:
    yarn = yarn_executable()
    log("FRONTEND", C.MAGENTA, f"starting · {yarn} start")
    log("FRONTEND", C.DIM, f"cwd={FRONTEND}")

    env = os.environ.copy()
    # keep CRA from auto-opening a browser tab in headless envs
    env.setdefault("BROWSER", "none")

    return subprocess.Popen(
        [yarn, "start"],
        cwd=str(FRONTEND),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        env=env,
    )


# ---------- main ----------
def main():
    parser = argparse.ArgumentParser(description="City Eye launcher")
    parser.add_argument("--backend-port", type=int, default=8001)
    parser.add_argument("--no-backend", action="store_true")
    parser.add_argument("--no-frontend", action="store_true")
    args = parser.parse_args()

    banner()

    # Sanity checks
    if not BACKEND.exists():
        raise SystemExit(f"{C.RED}backend/ not found at {BACKEND}{C.RESET}")
    if not FRONTEND.exists():
        raise SystemExit(f"{C.RED}frontend/ not found at {FRONTEND}{C.RESET}")

    backend_env = read_env_file(BACKEND / ".env")
    if not backend_env:
        log(
            "WARN",
            C.YELLOW,
            "backend/.env not found — copy backend/.env.example to backend/.env",
        )

    mongo_url = backend_env.get("MONGO_URL", "mongodb://localhost:27017")
    if not check_mongo(mongo_url):
        log(
            "WARN",
            C.YELLOW,
            f"MongoDB not reachable at {mongo_url} — start it before using the API.",
        )
    else:
        log("MONGO", C.CYAN, f"reachable at {mongo_url}")

    if not args.no_backend and port_in_use(args.backend_port):
        log(
            "WARN",
            C.YELLOW,
            f"port {args.backend_port} is already in use — backend may collide.",
        )

    procs: list[tuple[subprocess.Popen, str, str]] = []
    threads: list[threading.Thread] = []

    if not args.no_backend:
        bp = start_backend(args.backend_port)
        procs.append((bp, "BACKEND", C.GREEN))

    if not args.no_frontend:
        # Slight delay so the backend logs come up first
        time.sleep(1.0)
        fp = start_frontend()
        procs.append((fp, "FRONTEND", C.MAGENTA))

    if not procs:
        raise SystemExit("nothing to run")

    for proc, prefix, color in procs:
        t = threading.Thread(
            target=stream_output, args=(proc, prefix, color), daemon=True
        )
        t.start()
        threads.append(t)

    log(
        "READY",
        C.CYAN,
        f"backend → http://localhost:{args.backend_port}/api   frontend → http://localhost:3000",
    )
    log("READY", C.DIM, "press Ctrl+C to stop everything")

    def shutdown(*_):
        log("STOP", C.YELLOW, "shutting down…")
        for proc, prefix, color in procs:
            if proc.poll() is None:
                try:
                    if IS_WINDOWS:
                        proc.send_signal(signal.CTRL_BREAK_EVENT)  # type: ignore[attr-defined]
                    else:
                        proc.terminate()
                except Exception:
                    pass
        deadline = time.time() + 8
        for proc, prefix, color in procs:
            try:
                proc.wait(timeout=max(0.1, deadline - time.time()))
            except Exception:
                proc.kill()
        log("STOP", C.YELLOW, "bye.")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    if not IS_WINDOWS:
        signal.signal(signal.SIGTERM, shutdown)

    # Watch processes
    try:
        while True:
            for proc, prefix, color in procs:
                if proc.poll() is not None:
                    log(prefix, C.RED, f"process exited with code {proc.returncode}")
                    shutdown()
            time.sleep(0.5)
    except KeyboardInterrupt:
        shutdown()


if __name__ == "__main__":
    main()
