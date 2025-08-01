#!/usr/bin/env node

// Production starter for Plus500 VIP Bitcoin Investment Platform
const { existsSync } = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist', 'index.js');

console.log('Starting Plus500 VIP Bitcoin Investment Platform...');
console.log('Environment:', process.env.NODE_ENV || 'production');
console.log('Port:', process.env.PORT || 5000);

// Check if build exists
if (!existsSync(distPath)) {
  console.error('Build not found at:', distPath);
  console.error('Please run the build process first');
  process.exit(1);
}

// Set production environment
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Import and start the server
try {
  require(distPath);
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}