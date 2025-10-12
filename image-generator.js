
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

  // Main title with icon
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 72px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillText('🏦 BITVAULT PRO', width / 2, 110);

  // Subtitle
  ctx.fillStyle = '#f39c12';
  ctx.font = 'bold 36px Arial, sans-serif';
  ctx.fillText('Professional Digital Asset Management', width / 2, 170);

  // Add Bitcoin symbol
  ctx.fillStyle = '#f7931a';
  ctx.font = 'bold 80px Arial, sans-serif';
  ctx.fillText('₿', 150, 350);
  ctx.fillText('₿', width - 150, 350);

  // Decorative line
  ctx.strokeStyle = '#f39c12';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(150, 200);
  ctx.lineTo(width - 150, 200);
  ctx.stroke();

  // Performance indicators
  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 38px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚡ LIVE UPDATE', width / 2, 260);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '30px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('✅ Automated Returns', 180, 330);
  ctx.fillText('✅ 24/7 Monitoring', 180, 380);
  ctx.fillText('✅ Institutional Security', 180, 430);
  
  ctx.textAlign = 'right';
  ctx.fillText('99.8% Uptime', width - 180, 330);
  ctx.fillText('Real-time Data', width - 180, 380);
  ctx.fillText('Multi-Sig Protected', width - 180, 430);

  // Decorative line
  ctx.strokeStyle = '#f39c12';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(150, 470);
  ctx.lineTo(width - 150, 470);
  ctx.stroke();

  // Add current date
  const now = new Date();
  const dateString = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  ctx.fillStyle = '#cccccc';
  ctx.font = '22px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(dateString, width / 2, 510);

  // Bottom tagline
  ctx.fillStyle = '#f39c12';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillText('Where Bitcoin Wealth is Built Systematically', width / 2, 560);

  // Status badges
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px Arial, sans-serif';
  ctx.fillText('🔒 Licensed  |  🛡️ Insured  |  ⚡ Secure', width / 2, 595);

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
