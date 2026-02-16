#!/bin/bash

# Configuration
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
BACKEND_LOG="backend.log"
FRONTEND_LOG="frontend.log"
BACKEND_PID_FILE=".backend.pid"
FRONTEND_PID_FILE=".frontend.pid"

echo "Starting Backend..."
cd $BACKEND_DIR
# Start in background, redirect logs
npm run dev > ../$BACKEND_LOG 2>&1 &
echo $! > ../$BACKEND_PID_FILE
echo "Backend started (PID: $(cat ../$BACKEND_PID_FILE))"
cd ..

echo "Starting Frontend..."
cd $FRONTEND_DIR
npm run dev > ../$FRONTEND_LOG 2>&1 &
echo $! > ../$FRONTEND_PID_FILE
echo "Frontend started (PID: $(cat ../$FRONTEND_PID_FILE))"
cd ..

echo "Application started in background."
echo "Logs are available in $BACKEND_LOG and $FRONTEND_LOG"
echo "Run ./stop.sh to stop the application."
