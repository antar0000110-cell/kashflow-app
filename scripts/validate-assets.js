import fs from 'fs';
import path from 'path';

function getPngDimensions(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    if (
      buffer[0] !== 0x89 ||
      buffer[1] !== 0x50 ||
      buffer[2] !== 0x4e ||
      buffer[3] !== 0x47 ||
      buffer[4] !== 0x0d ||
      buffer[5] !== 0x0a ||
      buffer[6] !== 0x1a ||
      buffer[7] !== 0x0a
    ) {
      return null;
    }
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  } catch {
    return null;
  }
}

function runValidation() {
  const publicDir = path.resolve(process.cwd(), 'public');
  const appleTouchIcon = path.join(publicDir, 'apple-touch-icon.png');
  const faviconPng = path.join(publicDir, 'favicon.png');

  console.log('=== UZX Mobile Asset Requirements Validator ===');
  let hasErrors = false;

  // Validate apple-touch-icon.png
  if (!fs.existsSync(appleTouchIcon)) {
    console.error('❌ Missing Required Asset: /public/apple-touch-icon.png');
    hasErrors = true;
  } else {
    const dims = getPngDimensions(appleTouchIcon);
    if (!dims) {
      console.error('❌ Invalid PNG format: /public/apple-touch-icon.png');
      hasErrors = true;
    } else if (dims.width < 180 || dims.height < 180) {
      console.error(`❌ Mobile Requirement Not Met: /public/apple-touch-icon.png is ${dims.width}x${dims.height} but common mobile requirements need at least 180x180.`);
      hasErrors = true;
    } else {
      console.log(`✅ /public/apple-touch-icon.png meets mobile requirements (${dims.width}x${dims.height}).`);
    }
  }

  // Validate favicon.png
  if (!fs.existsSync(faviconPng)) {
    console.error('❌ Missing Required Asset: /public/favicon.png');
    hasErrors = true;
  } else {
    const dims = getPngDimensions(faviconPng);
    if (!dims) {
      console.error('❌ Invalid PNG format: /public/favicon.png');
      hasErrors = true;
    } else if (dims.width < 192 || dims.height < 192) {
      console.error(`❌ Mobile Requirement Not Met: /public/favicon.png is ${dims.width}x${dims.height} but common mobile requirements need at least 192x192 (ideally 512x512).`);
      hasErrors = true;
    } else {
      console.log(`✅ /public/favicon.png meets mobile requirements (${dims.width}x${dims.height}).`);
    }
  }

  if (hasErrors) {
    console.log('\n============================================================');
    console.log('⚠️  CAPACITOR MOBILE ASSET INTEGRATION BLOCKED!');
    console.log('Please ensure that both required icons exist and satisfy standard dimensions.');
    console.log('To synchronize assets into native projects once corrected, run:');
    console.log('\n    npx cap sync\n');
    console.log('============================================================\n');
    process.exit(1);
  } else {
    console.log('\n🎉 All Capacitor mobile required icons are successfully verified!');
    console.log('Sync the assets into your native projects by executing the following command:');
    console.log('\n    npx cap sync\n');
  }
}

runValidation();
