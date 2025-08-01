// Production-ready server starter
const express = require('express');
const { createServer } = require('http');
const path = require('path');

// Set environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

console.log('Starting Plus500 VIP Bitcoin Investment Platform...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT || 5000);

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Catch-all handler for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

const port = process.env.PORT || 5000;
const server = createServer(app);

server.listen(port, '0.0.0.0', () => {
  console.log(`Plus500 VIP server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});