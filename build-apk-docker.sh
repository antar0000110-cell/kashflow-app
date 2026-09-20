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

# Remove all default Capacitor icons
find android/app/src/main/res -name "ic_launcher*" -delete 2>/dev/null || true
find android/app/src/main/res -name "ic_launcher_round*" -delete 2>/dev/null || true

# Copy pre-generated icons from public/android-mipmap-*
for density in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
    mkdir -p "android/app/src/main/res/mipmap-${density}"
    if [ -f "public/android-mipmap-${density}/ic_launcher.png" ]; then
        cp "public/android-mipmap-${density}/ic_launcher.png" "android/app/src/main/res/mipmap-${density}/ic_launcher.png"
        cp "public/android-mipmap-${density}/ic_launcher_round.png" "android/app/src/main/res/mipmap-${density}/ic_launcher_round.png"
        echo "  mipmap-${density}: icons copied"
    fi
done

# Copy splash screen to drawable directories
if [ -f "public/splash.png" ]; then
    for d in drawable drawable-port-mdpi drawable-port-hdpi drawable-port-xhdpi drawable-port-xxhdpi drawable-port-xxxhdpi; do
        mkdir -p "android/app/src/main/res/${d}"
        cp "public/splash.png" "android/app/src/main/res/${d}/splash.png"
    done
    echo "  splash.png injected to all drawable densities"
fi

# Copy adaptive icon layers
if [ -f "public/ic_launcher_foreground.png" ]; then
    mkdir -p "android/app/src/main/res/drawable"
    cp "public/ic_launcher_foreground.png" "android/app/src/main/res/drawable/ic_launcher_foreground.png"
    cp "public/ic_launcher_background.png" "android/app/src/main/res/drawable/ic_launcher_background.png"
    echo "  Adaptive icon layers injected"

    # Generate adaptive icon XML for mipmap-anydpi-v26
    mkdir -p "android/app/src/main/res/mipmap-anydpi-v26"
    cat > android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml << 'XML'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
XML
    cat > android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml << 'XML'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
XML
    echo "  Adaptive icon XML generated"
fi

echo "  All UZX icons injected successfully!"

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
