#!/bin/bash

# Cleanup function
cleanup() {
  echo "Shutting down..."
  kill $OLLAMA_PID 2>/dev/null || true
  exit
}

trap cleanup SIGTERM SIGINT

# Start ollama in the background
echo "Starting Ollama..."
ollama serve &
OLLAMA_PID=$!

# Wait for ollama to be ready
echo "Waiting for Ollama to be ready..."
sleep 5

# Pull the model if not already present
echo "Pulling Ollama model..."
ollama pull hf.co/unsloth/granite-4.0-h-tiny-GGUF:Q4_K_M || true

# Start the Node.js backend (blocking)
echo "Starting backend..."
node server.js
