#!/usr/bin/env node

/**
 * Icon Generator Script
 *
 * This script creates placeholder PNG icons for the Chrome extension.
 *
 * For production use, you should:
 * 1. Open generate-icons.html in a browser
 * 2. Download the generated icons
 * 3. Or use a design tool like Figma, Sketch, or Illustrator
 *
 * For now, this creates simple colored square placeholders.
 */

const fs = require('fs');
const path = require('path');

console.log('📦 Icon Generator for Groww to ChatGPT Extension\n');

// Check if we have canvas support
let Canvas;
try {
  Canvas = require('canvas');
  console.log('✓ Canvas library found, generating icons...\n');
} catch (e) {
  console.log('⚠️  Canvas library not found.');
  console.log('To generate icons automatically, install canvas:');
  console.log('  npm install canvas\n');
  console.log('Alternatively, open icons/generate-icons.html in your browser');
  console.log('to generate and download the icons manually.\n');
  createPlaceholderInstructions();
  process.exit(0);
}

const { createCanvas } = Canvas;

const sizes = [16, 32, 48, 128];

function drawIcon(canvas, size) {
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');

  // Draw circle background
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size*0.47, 0, Math.PI * 2);
  ctx.fill();

  // Scale factor
  const scale = size / 128;

  // Draw stock chart line
  const chartGradient = ctx.createLinearGradient(0, 0, 0, size);
  chartGradient.addColorStop(0, '#48bb78');
  chartGradient.addColorStop(1, '#38a169');

  ctx.strokeStyle = chartGradient;
  ctx.lineWidth = Math.max(2, 4 * scale);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(25*scale, 75*scale);
  ctx.lineTo(35*scale, 70*scale);
  ctx.lineTo(45*scale, 60*scale);
  ctx.lineTo(55*scale, 65*scale);
  ctx.lineTo(65*scale, 45*scale);
  ctx.lineTo(75*scale, 50*scale);
  ctx.lineTo(85*scale, 35*scale);
  ctx.lineTo(95*scale, 40*scale);
  ctx.lineTo(103*scale, 30*scale);
  ctx.stroke();

  // Draw chart points
  ctx.fillStyle = '#ffffff';
  [[45, 60], [65, 45], [85, 35]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x*scale, y*scale, Math.max(2, 3*scale), 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw AI sparkle
  ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
  drawSparkle(ctx, 100*scale, 20*scale, Math.max(3, 6*scale));

  // Draw arrow
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, 3 * scale);
  ctx.beginPath();
  ctx.moveTo(70*scale, 85*scale);
  ctx.lineTo(90*scale, 85*scale);
  ctx.moveTo(85*scale, 80*scale);
  ctx.lineTo(90*scale, 85*scale);
  ctx.lineTo(85*scale, 90*scale);
  ctx.stroke();
}

function drawSparkle(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size*0.3, y - size*0.3);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size*0.3, y + size*0.3);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size*0.3, y + size*0.3);
  ctx.lineTo(x - size, y);
  ctx.lineTo(x - size*0.3, y - size*0.3);
  ctx.closePath();
  ctx.fill();
}

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  drawIcon(canvas, size);

  const buffer = canvas.toBuffer('image/png');
  const filename = path.join(__dirname, `icon${size}.png`);

  fs.writeFileSync(filename, buffer);
  console.log(`✓ Generated icon${size}.png`);
}

function createPlaceholderInstructions() {
  const readme = `# Extension Icons

## How to Generate Icons

### Option 1: Using Browser (Recommended)
1. Open \`generate-icons.html\` in your web browser
2. Icons will be automatically generated
3. Click "Download" button under each icon to save

### Option 2: Using Node.js
1. Install canvas library: \`npm install canvas\`
2. Run: \`node generate-icons.js\`

### Option 3: Manual Creation
Create PNG icons with these sizes:
- icon16.png (16x16 pixels)
- icon32.png (32x32 pixels)
- icon48.png (48x48 pixels)
- icon128.png (128x128 pixels)

Design suggestions:
- Use the Groww brand colors (green) or purple/blue gradient
- Include a stock chart or growth symbol
- Add an AI/sparkle icon to indicate automation
- Ensure the icon is clear at 16x16 size

### Option 4: Use Design Tools
Use Figma, Sketch, Adobe Illustrator, or similar tools to create
professional icons based on the provided icon.svg template.

## Current Status

Icons need to be generated before the extension can be loaded.
Use one of the methods above to create the icon files.
`;

  fs.writeFileSync(path.join(__dirname, 'README.md'), readme);
  console.log('✓ Created icons/README.md with instructions');
}

// Generate all sizes
try {
  sizes.forEach(size => generateIcon(size));
  console.log('\n✅ All icons generated successfully!');
} catch (error) {
  console.error('\n❌ Error generating icons:', error.message);
  console.log('\nPlease use the browser method instead:');
  console.log('Open icons/generate-icons.html in your browser\n');
}
