"""
Proxy to start Express.js backend from uvicorn
"""
import subprocess
import os
import signal
import sys

# Global process handle
process = None

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    if process:
        process.terminate()
        process.wait()
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

# Change to express backend directory
os.chdir('/app/backend_express')

# Start Express backend
process = subprocess.Popen(['node', 'server.js'])

# Wait for process
try:
    process.wait()
except KeyboardInterrupt:
    pass
finally:
    if process:
        process.terminate()
        process.wait()
