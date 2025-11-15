#!/usr/bin/env node

/**
 * PWA Icon Generator for iOS 18+
 * 
 * This script generates all required icon sizes for iOS PWA support.
 * 
 * Usage:
 *   1. Install sharp: npm install -D sharp
 *   2. Place your source icon (1024x1024 PNG) at: public/icon-source.png
 *   3. Run: node generate-icons.js
 * 
 * This will generate all required icons in:
 *   - public/icons/ (PWA icons)
 *   - public/splash/ (iOS splash screens)
 */

const fs = require('fs');
const path = require('path');

// Icon sizes needed for iOS PWA
const ICON_SIZES = [
  // Standard PWA icons
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
  
  // Apple Touch Icons
  { size: 57, name: 'apple-touch-icon-57x57.png' },
  { size: 60, name: 'apple-touch-icon-60x60.png' },
  { size: 72, name: 'apple-touch-icon-72x72.png' },
  { size: 76, name: 'apple-touch-icon-76x76.png' },
  { size: 114, name: 'apple-touch-icon-114x114.png' },
  { size: 120, name: 'apple-touch-icon-120x120.png' },
  { size: 144, name: 'apple-touch-icon-144x144.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 180, name: 'apple-touch-icon-180x180.png' },
  { size: 180, name: 'apple-touch-icon.png' }, // Default
  
  // Favicons
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  
  // Shortcut icons
  { size: 96, name: 'shortcut-dashboard.png' },
  { size: 96, name: 'shortcut-report.png' },
  { size: 96, name: 'shortcut-requests.png' },
  
  // Notification icons
  { size: 72, name: 'badge-72x72.png' },
  { size: 96, name: 'action-open.png' },
  { size: 96, name: 'action-close.png' },
];

// iOS Splash Screen sizes
const SPLASH_SCREENS = [
  // iPhone 15 Pro Max, 15 Plus, 14 Pro Max
  { width: 1290, height: 2796, name: 'iPhone_15_Pro_Max__iPhone_15_Plus__iPhone_14_Pro_Max_portrait.png' },
  
  // iPhone 15 Pro, 15, 14 Pro
  { width: 1179, height: 2556, name: 'iPhone_15_Pro__iPhone_15__iPhone_14_Pro_portrait.png' },
  
  // iPhone 14 Plus, 13 Pro Max, 12 Pro Max
  { width: 1284, height: 2778, name: 'iPhone_14_Plus__iPhone_13_Pro_Max__iPhone_12_Pro_Max_portrait.png' },
  
  // iPhone 14, 13 Pro, 13, 12 Pro, 12
  { width: 1170, height: 2532, name: 'iPhone_14__iPhone_13_Pro__iPhone_13__iPhone_12_Pro__iPhone_12_portrait.png' },
  
  // iPhone 13 mini, 12 mini, 11 Pro, XS, X
  { width: 1125, height: 2436, name: 'iPhone_13_mini__iPhone_12_mini__iPhone_11_Pro__iPhone_XS__iPhone_X_portrait.png' },
  
  // iPhone 11 Pro Max, XS Max
  { width: 1242, height: 2688, name: 'iPhone_11_Pro_Max__iPhone_XS_Max_portrait.png' },
  
  // iPhone 11, XR
  { width: 828, height: 1792, name: 'iPhone_11__iPhone_XR_portrait.png' },
  
  // iPhone 8 Plus, 7 Plus, 6s Plus, 6 Plus
  { width: 1242, height: 2208, name: 'iPhone_8_Plus__iPhone_7_Plus__iPhone_6s_Plus__iPhone_6_Plus_portrait.png' },
  
  // iPhone 8, 7, 6s, 6, SE
  { width: 750, height: 1334, name: 'iPhone_8__iPhone_7__iPhone_6s__iPhone_6__4.7__iPhone_SE_portrait.png' },
  
  // iPhone SE, iPod touch
  { width: 640, height: 1136, name: '4__iPhone_SE__iPod_touch_5th_generation_and_later_portrait.png' },
  
  // iPad Pro 12.9"
  { width: 2048, height: 2732, name: '12.9__iPad_Pro_portrait.png' },
  
  // iPad Pro 11", 10.5"
  { width: 1668, height: 2388, name: '11__iPad_Pro__10.5__iPad_Pro_portrait.png' },
  
  // iPad Air 10.9"
  { width: 1640, height: 2360, name: '10.9__iPad_Air_portrait.png' },
  
  // iPad Air 10.5"
  { width: 1668, height: 2224, name: '10.5__iPad_Air_portrait.png' },
  
  // iPad 10.2"
  { width: 1620, height: 2160, name: '10.2__iPad_portrait.png' },
  
  // iPad 9.7", iPad mini
  { width: 1536, height: 2048, name: '9.7__iPad_Pro__7.9__iPad_mini__9.7__iPad_Air__9.7__iPad_portrait.png' },
];

async function generateIcons() {
  try {
    // Check if sharp is installed
    let sharp;
    try {
      sharp = require('sharp');
    } catch (err) {
      console.error('❌ Sharp is not installed. Please run: npm install -D sharp');
      process.exit(1);
    }

    const publicDir = path.join(__dirname, 'public');
    const iconsDir = path.join(publicDir, 'icons');
    const splashDir = path.join(publicDir, 'splash');
    const sourceIcon = path.join(publicDir, 'icon-source.png');

    // Create directories if they don't exist
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true });
    }
    if (!fs.existsSync(splashDir)) {
      fs.mkdirSync(splashDir, { recursive: true });
    }

    // Check if source icon exists
    if (!fs.existsSync(sourceIcon)) {
      console.error('❌ Source icon not found at: public/icon-source.png');
      console.log('📝 Please create a 1024x1024 PNG icon at this location.');
      
      // Create a placeholder
      console.log('🎨 Creating placeholder icon...');
      await sharp({
        create: {
          width: 1024,
          height: 1024,
          channels: 4,
          background: { r: 30, g: 64, b: 175, alpha: 1 } // Blue background
        }
      })
      .png()
      .toFile(sourceIcon);
      
      console.log('✅ Placeholder icon created. Replace it with your actual logo.');
    }

    console.log('🚀 Generating PWA icons...\n');

    // Generate all icon sizes
    for (const icon of ICON_SIZES) {
      const outputPath = path.join(iconsDir, icon.name);
      await sharp(sourceIcon)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: ${icon.name} (${icon.size}x${icon.size})`);
    }

    console.log('\n🎨 Generating iOS splash screens...\n');

    // Generate splash screens
    for (const splash of SPLASH_SCREENS) {
      const outputPath = path.join(splashDir, splash.name);
      
      // Create splash screen with centered logo
      const logoSize = Math.min(splash.width, splash.height) * 0.3; // 30% of smallest dimension
      
      await sharp(sourceIcon)
        .resize(Math.round(logoSize), Math.round(logoSize), {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .extend({
          top: Math.round((splash.height - logoSize) / 2),
          bottom: Math.round((splash.height - logoSize) / 2),
          left: Math.round((splash.width - logoSize) / 2),
          right: Math.round((splash.width - logoSize) / 2),
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: ${splash.name} (${splash.width}x${splash.height})`);
    }

    console.log('\n✨ All icons and splash screens generated successfully!');
    console.log('\n📱 Your app is now iOS 18+ PWA ready!');
    console.log('\n📋 Next steps:');
    console.log('   1. Replace public/icon-source.png with your actual logo');
    console.log('   2. Run this script again to regenerate all icons');
    console.log('   3. Build and deploy your app');
    console.log('   4. Test on iPhone by adding to Home Screen');

  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

// Run the generator
generateIcons();
