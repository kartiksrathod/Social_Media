"""
FastAPI shim that starts Express.js backend
"""
from fastapi import FastAPI
import subprocess
import os
import atexit

app = FastAPI()

# Start Express backend
os.chdir('/app/backend_express')
backend_process = subprocess.Popen(['node', 'server.js'])

def cleanup():
    if backend_process:
        backend_process.terminate()
        backend_process.wait()

atexit.register(cleanup)

@app.get("/health")
def health():
    return {"status": "running"}
