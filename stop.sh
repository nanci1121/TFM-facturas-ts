#!/bin/bash

BACKEND_PID_FILE=".backend.pid"
FRONTEND_PID_FILE=".frontend.pid"

# Stop Backend
if [ -f $BACKEND_PID_FILE ]; then
    PID=$(cat $BACKEND_PID_FILE)
    if ps -p $PID > /dev/null; then
        echo "Stopping Backend (PID: $PID)..."
        # Kill the process group to ensure child processes (node/ts-node) are also killed
        kill -- -$PID 2>/dev/null || kill $PID
    else
        echo "Backend process $PID not found."
    fi
    rm $BACKEND_PID_FILE
else
    echo "Backend PID file not found."
fi

# Stop Frontend
if [ -f $FRONTEND_PID_FILE ]; then
    PID=$(cat $FRONTEND_PID_FILE)
    if ps -p $PID > /dev/null; then
        echo "Stopping Frontend (PID: $PID)..."
        # Kill the process group
        kill -- -$PID 2>/dev/null || kill $PID
    else
        echo "Frontend process $PID not found."
    fi
    rm $FRONTEND_PID_FILE
else
    echo "Frontend PID file not found."
fi

echo "Application stopped."
