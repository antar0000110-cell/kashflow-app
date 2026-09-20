import * as fs from 'fs';
import * as path from 'path';

/**
 * ZUX Wallet Capacitor Configuration Validator
 * Validates bundle ID, app name, and asset mapping for both iOS and Android platforms.
 */
function validateCapacitor(): void {
  console.log('\x1b[36m======================================================================\x1b[0m');
  console.log('\x1b[35m🛡️  ZUX WALLET - CAPACITOR PRODUCTION CONFIGURATION VALIDATOR  🛡️\x1b[0m');
  console.log('\x1b[36m======================================================================\x1b[0m');

  const configPath = path.join(process.cwd(), 'capacitor.config.json');
  
  if (!fs.existsSync(configPath)) {
    console.error('\x1b[31m[❌ ERROR] capacitor.config.json not found in the project root!\x1b[0m');
    return;
  }

  try {
    const rawConfig = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(rawConfig);

    let hasErrors = false;
    let hasWarnings = false;

    // 1. Validate Bundle / Package ID
    console.log('\n\x1b[33m1. Package / Bundle ID Check:\x1b[0m');
    const appId = config.appId;
    if (!appId) {
      console.error('  \x1b[31m[❌ ERROR] appId is missing in configuration!\x1b[0m');
      hasErrors = true;
    } else {
      console.log(`  \x1b[32m[✔] Found App ID:\x1b[0m ${appId}`);
      if (appId !== 'com.uzx.wallet' && appId !== 'com.zux.wallet') {
        console.warn(`  \x1b[33m[⚠️ WARNING] App ID "${appId}" does not match standard ZUX bundle format ("com.zux.wallet" or "com.uzx.wallet")\x1b[0m`);
        hasWarnings = true;
      }
    }

    // 2. Validate App Name
    console.log('\n\x1b[33m2. Application Name Check:\x1b[0m');
    const appName = config.appName;
    if (!appName) {
      console.error('  \x1b[31m[❌ ERROR] appName is missing in configuration!\x1b[0m');
      hasErrors = true;
    } else {
      console.log(`  \x1b[32m[✔] Found App Name:\x1b[0m ${appName}`);
      if (!appName.toLowerCase().includes('zux') && !appName.toLowerCase().includes('uzx')) {
        console.warn(`  \x1b[33m[⚠️ WARNING] App Name "${appName}" does not contain "ZUX" or "UZX" brand indicator.\x1b[0m`);
        hasWarnings = true;
      }
    }

    // 3. Validate Web Asset Directory
    console.log('\n\x1b[33m3. Web Build Directory Check:\x1b[0m');
    const webDir = config.webDir || 'dist';
    console.log(`  \x1b[32m[✔] Found Web Directory:\x1b[0m ${webDir}`);
    const fullWebDirPath = path.join(process.cwd(), webDir);
    if (!fs.existsSync(fullWebDirPath)) {
      console.warn(`  \x1b[33m[⚠️ WARNING] Web build directory "${webDir}" does not exist yet! Make sure to run "npm run build" first.\x1b[0m`);
      hasWarnings = true;
    } else {
      console.log(`  \x1b[32m[✔] Web build directory exists.\x1b[0m`);
    }

    // 4. Validate Native Android Resources & Icons
    console.log('\n\x1b[33m4. Native Android Resources & Icons Check:\x1b[0m');
    const resPath = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res');
    if (!fs.existsSync(resPath)) {
      console.log('  \x1b[33m[⚠️ INFO] Android native wrapper directory does not exist or has not been added yet.\x1b[0m');
    } else {
      const mipmapDirs = [
        'mipmap-hdpi',
        'mipmap-mdpi',
        'mipmap-xhdpi',
        'mipmap-xxhdpi',
        'mipmap-xxxhdpi'
      ];
      
      let missingIcons = 0;
      mipmapDirs.forEach((dir) => {
        const iconPath = path.join(resPath, dir, 'ic_launcher.png');
        if (!fs.existsSync(iconPath)) {
          missingIcons++;
        }
      });

      if (missingIcons > 0) {
        console.warn(`  \x1b[33m[⚠️ WARNING] ${missingIcons} mipmap icon files are missing or default in the android resource folders.\x1b[0m`);
        hasWarnings = true;
      } else {
        console.log('  \x1b[32m[✔] All Android high-definition launcher icons are successfully present.\x1b[0m');
      }
    }

    // 5. Native iOS Check
    console.log('\n\x1b[33m5. iOS Wrapper Check:\x1b[0m');
    const iosPath = path.join(process.cwd(), 'ios');
    if (!fs.existsSync(iosPath)) {
      console.log('  \x1b[32m[✔] iOS directory not present (Operating on a single Android/Web codebase as targeted).\x1b[0m');
    } else {
      console.log('  \x1b[32m[✔] iOS directory detected and ready for Asset Catalog compilation.\x1b[0m');
    }

    // Summary
    console.log('\n\x1b[36m======================================================================\x1b[0m');
    console.log('\x1b[35m📊  VALIDATION SUMMARY  📊\x1b[0m');
    console.log('\x1b[36m======================================================================\x1b[0m');
    
    if (hasErrors) {
      console.log('  \x1b[31m🔴 STATUS: FAILED. Please fix the required fields above before compiling.\x1b[0m');
    } else if (hasWarnings) {
      console.log('  \x1b[33m🟡 STATUS: PASSED WITH WARNINGS. Ready for production but verify icon directories.\x1b[0m');
    } else {
      console.log('  \x1b[32m🟢 STATUS: 100% VALID & HEALTHY. Perfect production alignment!\x1b[0m');
    }

    console.log('\n\x1b[33m📢  RECOMMENDED CLI COMMANDS TO SYNC AND COMPILE ASSETS:\x1b[0m');
    console.log('  \x1b[32m1. Build the production web bundle:\x1b[0m');
    console.log('     npm run build');
    console.log('  \x1b[32m2. Sync build assets and plugins into Capacitor:\x1b[0m');
    console.log('     npx cap sync');
    console.log('  \x1b[32m3. Generate/update all iOS/Android icons and splash screens natively:\x1b[0m');
    console.log('     npx cordova-res android --skip-config --copy');
    console.log('     npx cordova-res ios --skip-config --copy');
    console.log('     \x1b[90m(Or use Capacitor-assets tool: npx @capacitor/assets generate)\x1b[0m');
    console.log('  \x1b[32m4. Open Android Studio to build your final signed APK/AAB:\x1b[0m');
    console.log('     npx cap open android');
    console.log('\x1b[36m======================================================================\x1b[0m\n');

  } catch (error) {
    console.error('  \x1b[31m[❌ ERROR] Failed to parse or validate capacitor.config.json:\x1b[0m', error);
  }
}

validateCapacitor();
