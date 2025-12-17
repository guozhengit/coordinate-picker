# Fix Docker Registry Issue

## The Problem
Docker is trying to use `hub-mirror.c.163.com` (NetEase mirror) which is timing out.

## Solution: Update Docker Daemon Configuration

### Windows (Docker Desktop)

**Method 1: Via Docker Desktop Settings (Easiest)**

1. Open Docker Desktop
2. Click the **Settings** (gear icon) in the top right
3. Go to **Docker Engine**
4. You'll see a JSON configuration. Find and remove or comment out any `registry-mirrors` section
5. The configuration should look like this:

```json
{
  "builder": {
    "gc": {
      "defaultKeepStorage": "20GB",
      "enabled": true
    }
  },
  "experimental": false
}
```

**Remove these lines if present:**
```json
  "registry-mirrors": [
    "https://hub-mirror.c.163.com"
  ]
```

6. Click **Apply & Restart**
7. Wait for Docker to restart

**Method 2: Edit daemon.json Directly**

1. Navigate to: `C:\Users\YourUsername\.docker\daemon.json`
2. Open in text editor
3. Remove the `registry-mirrors` section
4. Save the file
5. Restart Docker Desktop

### After Configuration

Try building again:

```bash
# Try the original Dockerfile
docker build -t coordinate-picker .

# Or try the Node.js version
docker build -f Dockerfile.node -t coordinate-picker .

# Or try without cache
docker build --no-cache -t coordinate-picker .
```

## Alternative: Use Docker Hub Directly

If you still have issues, try pulling from Docker Hub first:

```bash
# Pull the base image first
docker pull nginx:1.25-alpine

# Then build
docker build -t coordinate-picker .
```

## Quick Test

Test if Docker can access Docker Hub:

```bash
docker pull hello-world
```

If this works, your Docker is configured correctly!
