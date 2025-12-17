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

**Or use npm:**
```bash
npm start
```

The browser will automatically open at **http://localhost:3001**

> **Note:** The start.bat script will automatically stop any existing server on port 3001 before starting a new one.

## Development

```bash
# Start the development server (recommended)
npm start
# Server will run at http://localhost:3001

# Start development mode with live TypeScript compilation
pnpm dev
# or
npm run dev

# Build the project
pnpm build
# or
npm run build

# Alternative: Serve using npx (requires no installation)
pnpm serve
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

## Deployment

For detailed cloud deployment instructions:
- **English Guide**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **中文快速指南**: 查看 [部署快速指南.md](部署快速指南.md)

**Quick deployment:**

```bash
# Build the application
npm run build

# Deploy using Docker
docker build -t coordinate-picker .
docker run -d -p 80:80 --name coordinate-picker coordinate-picker
```

**Automated deployment (Windows):**

```bash
# Deploy to cloud server
deploy-windows.bat YOUR_SERVER_IP 80
```

**Automated deployment (Linux/Mac):**

```bash
chmod +x deploy.sh
./deploy.sh YOUR_SERVER_IP 80
```

## Notes

- PDF processing depends on PDF.js, ensure CDN resources are accessible
- Zoom range: 25% - 400%
- Supports keyboard navigation (Arrow keys)
- Click coordinate display to copy to clipboard

## License

ISC License