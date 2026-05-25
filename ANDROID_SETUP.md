# AI Agent Server - Android Setup Guide

This guide explains how to run the AI Agent Server on your Android device using Termux.

## What You Need

- **Android Phone** (Android 8+)
- **Termux** (free terminal app from F-Droid or Play Store)
- **At least 4GB free storage** (for models)
- **WiFi connection** (recommended)

---

## Step 1: Install Termux

1. Download **Termux** from:
   - **F-Droid** (recommended): https://f-droid.org/packages/com.termux/
   - Or Google Play Store

2. Open Termux after installation

---

## Step 2: Update Termux

```bash
pkg update && pkg upgrade -y
```

This will take a few minutes. Press `Y` when prompted.

---

## Step 3: Install Node.js

```bash
pkg install nodejs -y
```

Verify installation:
```bash
node -v
npm -v
```

---

## Step 4: Install Ollama (Option A - Easy)

**If your device has 8GB+ RAM:**

```bash
# Install Ollama from Play Store or F-Droid
# https://play.google.com/store/apps/details?id=com.ollama
```

Then in Termux:
```bash
# Set Ollama environment
export OLLAMA_HOST=127.0.0.1:11434
```

**If Ollama app is not available, use Option B below**

---

## Step 4 (Alternative - Option B): Install LLM via Termux

```bash
# Install Python
pkg install python -y

# Install LLM
pip install ollama

# Start Ollama in Termux
ollama serve
```

---

## Step 5: Clone Your Repository

In Termux:

```bash
# Go to home directory
cd ~

# Install git
pkg install git -y

# Clone your repo
git clone https://github.com/m9cherif/Ai-agent-server.git

# Enter directory
cd Ai-agent-server
```

---

## Step 6: Install Dependencies

```bash
npm install
```

---

## Step 7: Download AI Model

**Open a NEW Termux session** (swipe left to create new tab):

```bash
# Download Mistral model (lightweight - ~4GB)
ollama pull mistral

# Or lighter options:
ollama pull neural-chat        # ~4GB
ollama pull orca-mini         # ~1.3GB (very lightweight)
```

This will take 10-30 minutes depending on your internet.

---

## Step 8: Start Ollama Server

**Keep this running in one Termux session:**

```bash
ollama serve
```

You should see:
```
listening on 127.0.0.1:11434
```

---

## Step 9: Start Your AI Server

**In a DIFFERENT Termux session**, run:

```bash
cd ~/Ai-agent-server
node server.js
```

You should see:
```
✓ Server Running on http://localhost:3000
```

---

## Step 10: Test It

**In a THIRD Termux session**, test:

```bash
# Test connection
curl http://localhost:3000/test-connection

# List models
curl http://localhost:3000/models

# Send a message
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is machine learning?"}'
```

---

## Access From Other Devices

To access your server from another device (laptop/tablet):

### Find Your Phone's IP Address

In Termux:
```bash
ifconfig
```

Look for `inet` address (e.g., `192.168.1.100`)

### From Another Device

```bash
# Replace 192.168.1.100 with your phone's IP
curl http://192.168.1.100:3000/

curl -X POST http://192.168.1.100:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```

---

## Running Multiple Termux Sessions

Termux supports multiple sessions:

- **Swipe left** on the terminal to create new sessions
- **Swipe right** to switch between sessions
- **Long press** a session to rename it

### Recommended Setup:
1. **Session 1**: `ollama serve` (always running)
2. **Session 2**: `node server.js` (always running)
3. **Session 3**: Testing/commands

---

## Environment Variables

Set these in your Termux session before starting the server:

```bash
# Use a different model
export OLLAMA_MODEL="neural-chat"

# Use a different port
export PORT=3000

# Custom Ollama URL (if on different device)
export OLLAMA_URL="http://192.168.1.100:11434"
```

Then start server:
```bash
node server.js
```

---

## Troubleshooting

### "command not found: node"
```bash
pkg install nodejs -y
```

### "Cannot connect to Ollama"
- Make sure `ollama serve` is running in another Termux session
- Check if port 11434 is available: `netstat -tuln | grep 11434`

### "Out of memory"
- Close other apps
- Use lighter model: `ollama pull orca-mini`

### "Model download stuck"
- Check internet connection
- Restart Termux
- Try smaller model

### Storage full
```bash
# Check space
df -h

# See what's using space
du -sh ~/*

# Clean up old cache
rm -rf ~/.ollama/models/blobs/*
```

---

## Useful Commands

```bash
# Check running processes
ps aux | grep node
ps aux | grep ollama

# Kill a process
pkill node
pkill ollama

# View server logs in real-time
tail -f ~/Ai-agent-server/server.log

# Keep server running after closing Termux (using screen)
pkg install screen -y
screen -S server
# Start server, then press Ctrl+A then D to detach
# Reattach: screen -r server
```

---

## Make Server Start Automatically

Create a startup script:

```bash
# Create script
cat > ~/start-ai-server.sh << 'EOF'
#!/bin/bash
cd ~/Ai-agent-server
node server.js
EOF

# Make executable
chmod +x ~/start-ai-server.sh

# Run it
~/start-ai-server.sh
```

---

## API Endpoints

| Endpoint | Method | Example |
|----------|--------|---------|
| `/` | GET | `curl http://localhost:3000/` |
| `/health` | GET | `curl http://localhost:3000/health` |
| `/test-connection` | GET | `curl http://localhost:3000/test-connection` |
| `/models` | GET | `curl http://localhost:3000/models` |
| `/chat` | POST | `curl -X POST http://localhost:3000/chat -H "Content-Type: application/json" -d '{"message":"hello"}'` |

---

## Important Notes

⚠️ **Battery Usage**: Running AI models drains battery fast
- Keep phone plugged in
- Reduce model size if needed
- Use `orca-mini` for lightweight option

⚠️ **Phone Storage**: Large models take space
- `mistral`: ~4GB
- `neural-chat`: ~4GB
- `orca-mini`: ~1.3GB

⚠️ **RAM Usage**: Keep at least 2-3GB free
- Close unnecessary apps
- Stop other heavy processes

---

## Next Steps

1. ✅ Install Termux
2. ✅ Install Node.js
3. ✅ Install Ollama
4. ✅ Clone repository
5. ✅ Download model
6. ✅ Start both services
7. ✅ Test endpoints
8. ✅ Access from other devices!

**You now have a free AI server running on your Android phone!** 🚀

---

## Need Help?

- Check Termux: https://wiki.termux.com/
- Check Ollama: https://ollama.ai
- GitHub Issues: https://github.com/m9cherif/Ai-agent-server/issues
