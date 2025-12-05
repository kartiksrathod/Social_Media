#!/usr/bin/env python3
"""
Start Express.js backend server
"""
import subprocess
import os
import sys

# Change to Express.js directory
os.chdir('/app/backend_express')

# Start Express.js server
try:
    subprocess.run(['node', 'server.js'], check=True)
except KeyboardInterrupt:
    print("Server stopped")
    sys.exit(0)
except Exception as e:
    print(f"Error starting server: {e}")
    sys.exit(1)