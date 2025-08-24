
const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create directory if it doesn't exist
const outputDir = './attached_assets/generated_images';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateInvestmentUpdateBanner() {
  // Create canvas - standard banner size
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Create gradient background - BitVault Pro theme
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(0.3, '#16213e');
  gradient.addColorStop(0.7, '#0f3460');
  gradient.addColorStop(1, '#533483');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add subtle pattern overlay
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < width; i += 50) {
    for (let j = 0; j < height; j += 50) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(i, j, 2, 2);
    }
  }
  ctx.globalAlpha = 1;

  // Add glowing border effect
  ctx.strokeStyle = '#f39c12';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#f39c12';
  ctx.shadowBlur = 20;
  ctx.strokeRect(10, 10, width - 20, height - 20);
  ctx.shadowBlur = 0;

  // Main title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillText('BITVAULT PRO', width / 2, 120);

  // Subtitle
  ctx.fillStyle = '#f39c12';
  ctx.font = 'bold 42px Arial, sans-serif';
  ctx.fillText('INVESTMENT UPDATE', width / 2, 180);

  // Add Bitcoin symbol
  ctx.fillStyle = '#f7931a';
  ctx.font = 'bold 80px Arial, sans-serif';
  ctx.fillText('₿', 150, 350);
  ctx.fillText('₿', width - 150, 350);

  // Performance indicators
  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 32px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('📈 LIVE PROFITS', 200, 280);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '28px Arial, sans-serif';
  ctx.fillText('🎯 Automated Returns Active', 200, 320);
  ctx.fillText('💎 24/7 Market Monitoring', 200, 360);
  ctx.fillText('🚀 Institutional Grade Security', 200, 400);

  // Add current date
  const now = new Date();
  const dateString = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  ctx.fillStyle = '#cccccc';
  ctx.font = '24px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(dateString, width / 2, 480);

  // Success rate indicator
  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.fillText('SUCCESS RATE: 99.9%', width / 2, 520);

  // Bottom tagline
  ctx.fillStyle = '#f39c12';
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.fillText('WHERE BITCOIN WEALTH IS BUILT SYSTEMATICALLY', width / 2, 580);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Save the image
  const timestamp = Date.now();
  const filename = `BitVault_Pro_investment_update_banner_${timestamp.toString(16)}.png`;
  const filepath = path.join(outputDir, filename);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filepath, buffer);
  
  console.log(`✅ New investment update banner generated: ${filename}`);
  return filename;
}

// Generate banner when script is run directly
if (require.main === module) {
  generateInvestmentUpdateBanner()
    .then(filename => {
      console.log(`🎨 Investment update banner created successfully: ${filename}`);
    })
    .catch(error => {
      console.error('❌ Failed to generate banner:', error);
    });
}

module.exports = { generateInvestmentUpdateBanner };
