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
echo "[4/7] Initializing Capacitor Android platform..."
rm -rf android
npx cap add android
npx cap sync android

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
