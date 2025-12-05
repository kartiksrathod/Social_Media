#!/usr/bin/env python3
"""
Wrapper script to start Express.js backend from supervisor
This allows supervisor to start the Node.js backend properly
"""
import subprocess
import sys
import os

# Change to backend directory
os.chdir('/app/backend_express')

# Start the Express backend
try:
    subprocess.run(['node', 'server.js'], check=True)
except KeyboardInterrupt:
    sys.exit(0)
except Exception as e:
    print(f"Error starting backend: {e}", file=sys.stderr)
    sys.exit(1)
