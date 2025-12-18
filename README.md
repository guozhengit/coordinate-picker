# Coordinate Picker

A web tool for accurately picking coordinates from PDF documents and images.

## Live Demo

https://mark.anhejin.cn (Pure frontend implementation, no file data will be uploaded)

## Features

- 📄 Supports loading PDF and image files
- 🎯 Precise coordinate picking functionality
- 📏 Region selection and adjustment support
- 📋 One-click coordinate information copying
- 💻 Pure frontend implementation, no backend service required
- 🔍 Zoom controls (zoom in, zoom out, reset)
- 📊 Dual coordinate display (original & canvas coordinates)
- ⌨️ Keyboard shortcuts for page navigation
- 🎨 Visual selection with resize handles
- 🖱️ Mouse wheel zoom support (Ctrl + Scroll)

## Tech Stack

- TypeScript
- PDF.js
- HTML5 Canvas
- Native JavaScript

## Installation

```bash
# Install dependencies using pnpm (or npm)
pnpm install
# or
npm install
```

## Quick Start

**Windows (Easiest Way):**
```bash
# Double-click start.bat in the project folder
# Or run in terminal:
.\start.bat
```

The browser will automatically open at **http://localhost:3001**

> **Note:** The start.bat script will automatically stop any existing server on port 3001 before starting a new one.

## Docker Deployment

### Build Docker Image

**With Automatic Timestamp Version:**
```bash
# Double-click build.bat or run:
build.bat

# This creates images with timestamp versions like:
# - coordinate-picker:20251217_120530 (191 MB)
# - coordinate-picker:latest

# Features:
# ✅ Auto-cleanup old artifacts
# ✅ TypeScript compilation
# ✅ Image verification
# ✅ Build labels and metadata
# ✅ Layer optimization
```

**View Image Information:**
```bash
# View all image details and metadata
docker-info.bat

# Shows:
# - Image list with sizes
# - Build labels and timestamps
# - Environment variables
# - Layer information
```

**Or manually:**
```bash
# Build with custom version
docker build -t coordinate-picker:v1.0 \
  --build-arg VERSION=v1.0 \
  --build-arg BUILD_DATE=$(date +%Y%m%d) \
  --label "build.version=v1.0" .

# Build with docker-compose (uses environment variables)
VERSION=$(date +%Y%m%d_%H%M%S) BUILD_DATE=$(date +%Y%m%d_%H%M%S) docker-compose up -d --build
```

### Deploy to Cloud Server

**Automatic Deployment with Timestamp Version:**
```bash
# Deploy to cloud server (version auto-generated)
deploy-windows.bat YOUR_SERVER_IP 80

# Example:
deploy-windows.bat 123.45.67.89 80
```

**Deployment Process (7 Steps):**
1. ✅ Compile TypeScript
2. ✅ Build Docker image with version tag
3. ✅ Verify image integrity
4. ✅ Save and compress image (shows size)
5. ✅ Upload to server via SCP
6. ✅ Deploy on server with health checks
7. ✅ Clean up temporary files

**Features:**
- 🏷️ Automatic timestamp versioning
- 📦 Image size display
- ✅ Validation at each step
- 🔍 Post-deployment verification
- 🏥 Health check integration
- 📊 Detailed deployment info

## Development

```bash
# Start development mode with live TypeScript compilation
npm run dev

# Build the project
npm run build
```

## Usage

1. Open the `index.html` file
2. Click the "Choose File" button to upload a PDF or image
3. Click or drag on the document to select a region
4. Coordinate information will be displayed in real-time on the interface
5. Click the copy button to copy coordinate information
6. Use zoom controls (+, -, Reset) or Ctrl+Scroll to zoom in/out
7. Use arrow keys or click buttons to navigate between PDF pages
8. Double-click to clear the selection

## Supported File Types

- PDF files (.pdf)
- Image files (.jpg, .jpeg, .png, .gif, .bmp)

## Notes

- PDF processing depends on PDF.js, ensure CDN resources are accessible
- Zoom range: 25% - 400%
- Supports keyboard navigation (Arrow keys)
- Click coordinate display to copy to clipboard

## License

ISC License