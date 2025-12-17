const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3001;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 Coordinate Picker Server Started!');
  console.log('='.repeat(50));
  console.log(`📍 Server running at: http://localhost:${PORT}`);
  console.log(`🌐 Opening browser...`);
  console.log('='.repeat(50));
  console.log('Press Ctrl+C to stop the server');
  console.log('='.repeat(50));
  
  // Automatically open browser
  const url = `http://localhost:${PORT}`;
  const platform = process.platform;
  const command = platform === 'win32' ? `start ${url}` : 
                  platform === 'darwin' ? `open ${url}` : 
                  `xdg-open ${url}`;
  
  setTimeout(() => {
    exec(command, (error) => {
      if (error) {
        console.log(`\n⚠️  Could not auto-open browser. Please manually open: ${url}`);
      } else {
        console.log(`✅ Browser opened successfully!`);
      }
    });
  }, 500);
});
