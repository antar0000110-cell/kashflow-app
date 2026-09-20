import fs from 'fs';
import path from 'path';

function getPngDimensions(filePath: string): { width: number; height: number } | null {
  try {
    const buffer = fs.readFileSync(filePath);
    // Check PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
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
    // IHDR chunk starts at byte 8. Length is 4 bytes (13), chunk type 'IHDR', width (4 bytes), height (4 bytes).
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  } catch {
    return null;
  }
}

function validateIcons() {
  const publicDir = path.resolve(process.cwd(), 'public');
  const appleIconPath = path.join(publicDir, 'apple-touch-icon.png');
  const faviconPath = path.join(publicDir, 'favicon.png');

  let hasErrors = false;

  console.log('[UZX Icon Validator] Checking Capacitor icons in /public...');

  // Check apple-touch-icon.png
  if (!fs.existsSync(appleIconPath)) {
    console.error(`[ERROR] Missing required icon: /public/apple-touch-icon.png`);
    hasErrors = true;
  } else {
    const dims = getPngDimensions(appleIconPath);
    if (!dims) {
      console.error(`[ERROR] /public/apple-touch-icon.png is not a valid PNG file.`);
      hasErrors = true;
    } else {
      console.log(`[OK] /public/apple-touch-icon.png found (${dims.width}x${dims.height}px).`);
      if (dims.width < 180 || dims.height < 180) {
        console.warn(`[WARNING] apple-touch-icon.png is smaller than Capacitor recommended size (180x180+).`);
      }
    }
  }

  // Check favicon.png
  if (!fs.existsSync(faviconPath)) {
    console.error(`[ERROR] Missing required icon: /public/favicon.png`);
    hasErrors = true;
  } else {
    const dims = getPngDimensions(faviconPath);
    if (!dims) {
      console.error(`[ERROR] /public/favicon.png is not a valid PNG file.`);
      hasErrors = true;
    } else {
      console.log(`[OK] /public/favicon.png found (${dims.width}x${dims.height}px).`);
      if (dims.width < 192 || dims.height < 192) {
        console.warn(`[WARNING] favicon.png is smaller than Capacitor recommended size (192x192+ or 512x512).`);
      }
    }
  }

  if (hasErrors) {
    console.error(`\n============================================================`);
    console.error(`[CRITICAL] Capacitor icon validation failed!`);
    console.error(`Please ensure both 'apple-touch-icon.png' (180x180+) and 'favicon.png' (512x512) exist in the /public directory.`);
    console.error(`Once fixed, run the following command to sync assets with Capacitor:`);
    console.error(`\n    npx cap sync\n`);
    console.error(`============================================================\n`);
    process.exit(1);
  } else {
    console.log(`\n[SUCCESS] All Capacitor icons validated successfully!`);
    console.log(`To sync assets with Capacitor, run:`);
    console.log(`\n    npx cap sync\n`);
  }
}

validateIcons();
