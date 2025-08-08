const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = __dirname;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  if (body) res.end(body); else res.end();
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.join(ROOT, urlPath);

  // Prevent directory traversal
  if (!filePath.startsWith(ROOT)) {
    return send(res, 403, { 'Content-Type': 'text/plain' }, 'Forbidden');
  }

  // If path is a directory, serve index.html
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (err) {
      // If not found, try index.html (spa-like fallback)
      filePath = path.join(ROOT, 'index.html');
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        return send(res, 404, { 'Content-Type': 'text/plain' }, 'Not Found');
      }
      const ext = path.extname(filePath).toLowerCase();
      const type = mimeTypes[ext] || 'application/octet-stream';
      send(res, 200, { 'Content-Type': type }, data);
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`LOTR Chess server running at http://${HOST}:${PORT}`);
});