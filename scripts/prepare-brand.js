import fs from 'fs';
import path from 'path';

const targetApp = process.argv[2] || 'management-os'; // 'management-os' or 'uzx-wallet'

const isOS = targetApp === 'management-os';

const config = isOS ? {
  appName: "Management OS",
  description: "Management OS - Authorized Agent Operations & Real-Time Management Terminal",
  iconJpg: "/management-os-icon.jpg",
  iconSvg: "/management-os-icon.svg",
  manifestFile: "manifest-management-os.json",
  themeColor: "#0EA5E9",
  appId: "com.uzx.agent",
  authPortal: "agent"
} : {
  appName: "UZX Wallet",
  description: "UZX Wallet - Official Fast Electronic Wallet & USDT TRC20 Gateway",
  iconJpg: "/uzx-wallet-icon.jpg",
  iconSvg: "/uzx-wallet-icon.svg",
  manifestFile: "manifest-uzx-wallet.json",
  themeColor: "#8B1E2D",
  appId: "com.uzx.wallet",
  authPortal: "wallet"
};

console.log(`\n⚙️ Configuring project branding for target: [${config.appName}]...`);

// 1. Update metadata.json
const metadataPath = path.resolve('metadata.json');
if (fs.existsSync(metadataPath)) {
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  metadata.name = config.appName;
  metadata.description = config.description;
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
  console.log(`  ✓ Updated metadata.json -> name: "${config.appName}"`);
}

// 2. Update public/manifest.json by copying target manifest
const targetManifestPath = path.resolve('public', config.manifestFile);
const mainManifestPath = path.resolve('public', 'manifest.json');
if (fs.existsSync(targetManifestPath)) {
  fs.copyFileSync(targetManifestPath, mainManifestPath);
  console.log(`  ✓ Synced public/manifest.json from public/${config.manifestFile}`);
}

// 3. Update index.html head tags
const indexPath = path.resolve('index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  
  html = html.replace(/<title>.*?<\/title>/, `<title>${config.appName}</title>`);
  html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${config.description}" />`);
  html = html.replace(/<link rel="manifest" id="app-manifest-link" href=".*?" \/>/, `<link rel="manifest" id="app-manifest-link" href="/${config.manifestFile}" />`);
  html = html.replace(/<link rel="icon" id="app-favicon-svg" type="image\/svg\+xml" href=".*?" \/>/, `<link rel="icon" id="app-favicon-svg" type="image/svg+xml" href="${config.iconSvg}" />`);
  html = html.replace(/<link rel="icon" id="app-favicon-png" type="image\/jpeg" sizes="512x512" href=".*?" \/>/, `<link rel="icon" id="app-favicon-png" type="image/jpeg" sizes="512x512" href="${config.iconJpg}" />`);
  html = html.replace(/<link rel="apple-touch-icon" id="app-apple-icon" href=".*?" \/>/, `<link rel="apple-touch-icon" id="app-apple-icon" href="${config.iconJpg}" />`);
  html = html.replace(/<meta name="theme-color" id="app-theme-color" content=".*?" \/>/, `<meta name="theme-color" id="app-theme-color" content="${config.themeColor}" />`);

  fs.writeFileSync(indexPath, html, 'utf8');
  console.log(`  ✓ Updated index.html title, icons, and theme color for ${config.appName}`);
}

// 4. Update capacitor.config.json
const capConfigPath = path.resolve('capacitor.config.json');
const capConfig = {
  appId: config.appId,
  appName: config.appName,
  webDir: "dist",
  server: {
    androidScheme: "https"
  },
  plugins: {
    LocalNotifications: {
      smallIcon: isOS ? "ic_stat_management_os" : "ic_stat_uzx_wallet",
      iconColor: config.themeColor
    }
  }
};
fs.writeFileSync(capConfigPath, JSON.stringify(capConfig, null, 2), 'utf8');
console.log(`  ✓ Created capacitor.config.json for appId: ${config.appId}`);

console.log(`✅ Branding preparation complete for [${config.appName}]!\n`);
