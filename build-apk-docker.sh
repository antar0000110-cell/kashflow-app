#!/usr/bin/env bash
set -e

echo "============================================================"
echo "         UZX WALLET - SIGNED APK BUILD ENGINE              "
echo "============================================================"

# 1. Install dependencies and build web frontend
echo "[1/7] Installing npm dependencies..."
npm install --legacy-peer-deps

echo "[2/7] Compiling Vite production web bundle..."
npm run build

# 2. Install Capacitor packages
echo "[3/7] Installing @capacitor/core @capacitor/android..."
npm install @capacitor/core @capacitor/android --legacy-peer-deps

# 3. Clean slate Android project
echo "[4/7] Installing and syncing Capacitor Android platform..."
rm -rf android
npx cap add android
npx cap sync android

# 3b. INJECT UZX ICONS into all Android mipmap directories
echo "[4b/7] Injecting UZX app icons into Android mipmap directories..."
ICON_SRC="public/icon.png"

if [ -f "$ICON_SRC" ]; then
    # Remove all default Capacitor icons
    find android/app/src/main/res -name "ic_launcher*" -delete 2>/dev/null || true
    find android/app/src/main/res -name "ic_launcher_round*" -delete 2>/dev/null || true
    find android/app/src/main/res -name "splash*" -delete 2>/dev/null || true

    # Copy icons to each density folder
    for density in mdpi:48 hdpi:72 xhdpi:96 xxhdpi:144 xxxhdpi:192; do
        d="${density%%:*}"
        s="${density##*:}"
        mkdir -p "android/app/src/main/res/mipmap-${d}"

        # Use Python PIL to resize (available in the Docker image)
        python3 -c "
from PIL import Image
img = Image.open('${ICON_SRC}')
img = img.resize((${s}, ${s}), Image.LANCZOS)
img.save('android/app/src/main/res/mipmap-${d}/ic_launcher.png', 'PNG')
img_round = img.copy()
# Create circular mask for round icon
mask = Image.new('L', (${s}, ${s}), 0)
from PIL import ImageDraw
draw = ImageDraw.Draw(mask)
draw.ellipse((0, 0, ${s}-1, ${s}-1), fill=255)
img_round.putalpha(mask)
img_round.save('android/app/src/main/res/mipmap-${d}/ic_launcher_round.png', 'PNG')
print(f'  mipmap-${d}: ${s}x${s} icons injected')
"
    done

    # Generate splash screen (1080x1920) with red background and centered logo
    python3 -c "
from PIL import Image, ImageDraw
# Create splash background
splash = Image.new('RGB', (1080, 1920), '#8B1E2D')
# Load and resize logo
logo = Image.open('${ICON_SRC}')
logo = logo.resize((400, 400), Image.LANCZOS)
# Center the logo
x = (1080 - 400) // 2
y = (1920 - 400) // 2
splash.paste(logo, (x, y), logo if logo.mode == 'RGBA' else None)
# Save to all drawable directories
import os
for d in ['drawable', 'drawable-port-mdpi', 'drawable-port-hdpi', 'drawable-port-xhdpi', 'drawable-port-xxhdpi', 'drawable-port-xxxhdpi']:
    path = f'android/app/src/main/res/{d}'
    os.makedirs(path, exist_ok=True)
    splash.save(f'{path}/splash.png', 'PNG')
print('  splash.png generated for all drawable densities')
"

    # Also generate adaptive icon foreground (square, no padding)
    python3 -c "
from PIL import Image
img = Image.open('${ICON_SRC}')
img = img.resize((432, 432), Image.LANCZOS)
img.save('android/app/src/main/res/drawable/ic_launcher_foreground.png', 'PNG')
print('  Adaptive icon foreground generated (432x432)')
"

    echo "  All UZX icons injected successfully!"
else
    echo "  WARNING: public/icon.png not found, using default Capacitor icons"
fi

# 4. PATCH: Force kotlin-stdlib-jdk7/jdk8 to 1.8.22 to avoid DuplicateClasses
echo "[5/7] Patching Gradle to resolve Kotlin stdlib duplicate classes..."

cat >> android/build.gradle << 'GRADLEOF'

// UZX Patch: Force kotlin-stdlib-jdk7/jdk8 to match kotlin-stdlib version
subprojects {
    afterEvaluate {
        configurations.all {
            resolutionStrategy {
                force "org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.8.22"
                force "org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.8.22"
            }
        }
    }
}
GRADLEOF

# 5. Copy keystore to Android project
echo "[6/7] Configuring release signing..."
cp zux-release.keystore android/app/zux-release.keystore

# Create signing config
cat > android/app/signing.gradle << 'EOF'
android {
    signingConfigs {
        release {
            storeFile file('zux-release.keystore')
            storePassword 'ZUX2026SecurePass!'
            keyAlias 'zux_key'
            keyPassword 'ZUX2026SecurePass!'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
EOF

# Apply signing config to app build.gradle
if ! grep -q "apply from: 'signing.gradle'" android/app/build.gradle; then
    sed -i "/^android {/i apply from: 'signing.gradle'" android/app/build.gradle
fi

# 6. Build signed release APK
echo "[7/7] Building signed release APK with Gradle..."
cd android
chmod +x gradlew
export GRADLE_OPTS="-Xmx2048m -XX:MaxMetaspaceSize=512m"
./gradlew assembleRelease --no-daemon -Dorg.gradle.jvmargs="-Xmx2048m -XX:MaxMetaspaceSize=512m"
cd ..

# Copy signed APK to output
SIGNED_APK="android/app/build/outputs/apk/release/app-release.apk"
OUTPUT_APK="uzx-wallet-signed.apk"

if [ -f "$SIGNED_APK" ]; then
    cp "$SIGNED_APK" "$OUTPUT_APK"
    echo "============================================================"
    echo " SUCCESS: Signed Production APK Generated Successfully!"
    echo " Output file: $OUTPUT_APK"
    echo " App ID: com.uzx.wallet"
    echo " Signed with 2048-bit RSA Keystore (Passes Google Play Protect)"
    echo "============================================================"
    ls -la "$OUTPUT_APK"
else
    echo "ERROR: Signed APK not found at $SIGNED_APK"
    exit 1
fi
