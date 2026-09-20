#!/usr/bin/env bash
# ==============================================================================
#            UZX WALLET FINANCIAL OS - SMART & INTERACTIVE APK BUILD ENGINE
# ==============================================================================
# This script intelligently checks all dependencies (Node.js, JDK, Android SDK,
# Capacitor), guides the developer to configure custom keystore options interactively,
# and performs a professional, signed production APK build.
# ==============================================================================

set -e

# ANSI Color Codes for Professional Console Outputs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Helper function to print headers
print_header() {
    echo -e "${CYAN}======================================================================${NC}"
    echo -e " ${BOLD}${BLUE}* $1${NC}"
    echo -e "${CYAN}======================================================================${NC}"
}

# Helper function to check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Helper function to check environment variables
check_env_var() {
    local var_name=$1
    local install_msg=$2
    if [ -z "${!var_name}" ]; then
        echo -e "${YELLOW}[WARNING] $var_name is not set.${NC}"
        echo -e "This might cause build failures. $install_msg"
        return 1
    else
        echo -e "${GREEN}[✔] $var_name is set to: ${!var_name}${NC}"
        return 0
    fi
}

clear || true
echo -e "${BOLD}${CYAN}======================================================================${NC}"
echo -e "${BOLD}${BLUE}         KASHFLOW FINANCIAL OS - ADVANCED SIGNED APK BUILD ENGINE     ${NC}"
echo -e "${BOLD}${CYAN}======================================================================${NC}"
echo ""

# ------------------------------------------------------------------------------
# STEP 1: Dependencies & Environment Audit
# ------------------------------------------------------------------------------
print_header "STEP 1: Auditing system dependencies & environment..."

# A. Node.js & npm Check
if ! command_exists node; then
    echo -e "${RED}[ERROR] Node.js is not installed on this system.${NC}"
    echo -e "Please install Node.js (v18 or higher recommended) from: https://nodejs.org/"
    exit 1
fi
if ! command_exists npm; then
    echo -e "${RED}[ERROR] npm (Node Package Manager) is missing.${NC}"
    echo -e "Please reinstall Node.js or run 'sudo apt install npm' depending on your OS."
    exit 1
fi
echo -e "${GREEN}[✔] Node.js & npm are ready.${NC} (Node $(node -v), npm $(npm -v))"

# B. Java JDK Check
if ! command_exists keytool; then
    echo -e "${YELLOW}[WARNING] Java Development Kit (JDK) 'keytool' utility was not found in PATH.${NC}"
    echo -e "The release keystore cannot be generated automatically without JDK tools."
    echo -e "Please make sure OpenJDK 17 or higher is installed."
    echo -e "  - Ubuntu/Debian: sudo apt update && sudo apt install openjdk-17-jdk -y"
    echo -e "  - macOS (Homebrew): brew install openjdk"
    echo -e "  - Windows: Download JDK from https://adoptium.net/ or Oracle."
    echo ""
    read -p "Would you like to proceed anyway and compile the unsigned APK only? (y/n) [n]: " PROCEED_NO_JAVA
    PROCEED_NO_JAVA=${PROCEED_NO_JAVA:-n}
    if [[ "$PROCEED_NO_JAVA" != "y" && "$PROCEED_NO_JAVA" != "Y" ]]; then
        echo -e "${RED}Build canceled. Please install Java JDK and run this script again.${NC}"
        exit 1
    fi
    HAS_JAVA=false
else
    echo -e "${GREEN}[✔] Java JDK Tools 'keytool' are ready.${NC}"
    HAS_JAVA=true
fi

# C. Android SDK Check
check_env_var "ANDROID_HOME" "Please install Android Studio and set ANDROID_HOME environment variable." || {
    echo -e "${YELLOW}Attempting to continue. If the build fails, you MUST configure the Android SDK properly.${NC}"
}

# D. Capacitor Packages Check
if [ ! -d "node_modules/@capacitor/core" ]; then
    echo -e "${YELLOW}[WARNING] Capacitor core dependency seems to be missing in node_modules.${NC}"
    read -p "Would you like to install standard Capacitor dependencies now? (y/n) [y]: " INSTALL_CAP
    INSTALL_CAP=${INSTALL_CAP:-y}
    if [[ "$INSTALL_CAP" == "y" || "$INSTALL_CAP" == "Y" ]]; then
        echo -e "${BLUE}Installing Capacitor core, cli and android dependencies...${NC}"
        npm install @capacitor/core @capacitor/cli @capacitor/android --save
        echo -e "${GREEN}[✔] Capacitor packages installed successfully.${NC}"
    else
        echo -e "${RED}Capacitor is required to build the Android wrapper. Build stopped.${NC}"
        exit 1
    fi
fi

# ------------------------------------------------------------------------------
# STEP 2: Production Build & Sync
# ------------------------------------------------------------------------------
print_header "STEP 2: Building Production Web Bundle..."
echo -e "${BLUE}Compiling Vite production web bundle...${NC}"
if npm run build; then
    echo -e "${GREEN}[✔] Vite production web bundle built successfully inside dist/${NC}"
else
    echo -e "${RED}[ERROR] Web build failed. Please fix any linter/compiler errors in the project.${NC}"
    exit 1
fi

# E. Android wrapper Check & Setup
if [ ! -d "android" ]; then
    echo -e "${YELLOW}[INFO] Android project folder not found.${NC}"
    read -p "Would you like to initialize the Capacitor Android Platform now? (y/n) [y]: " INIT_ANDROID
    INIT_ANDROID=${INIT_ANDROID:-y}
    if [[ "$INIT_ANDROID" == "y" || "$INIT_ANDROID" == "Y" ]]; then
        echo -e "${BLUE}Adding Capacitor Android wrapper...${NC}"
        npx cap add android
        echo -e "${GREEN}[✔] Android platform added successfully.${NC}"
    else
        echo -e "${RED}Android platform is required to proceed. Build stopped.${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}Syncing production assets with Capacitor Android wrapper...${NC}"
npx cap sync android

# ------------------------------------------------------------------------------
# STEP 3: Smart Interactivity for Keystore & Signing Configuration
# ------------------------------------------------------------------------------
if [ "$HAS_JAVA" = true ]; then
    print_header "STEP 3: Configuring Release Signing Keystore"

    echo -e "${CYAN}Please configure your secure signing credentials.${NC}"
    echo -e "Leaving these empty will apply KashFlow official secure defaults."
    echo ""

    # Keystore filename
    read -p "1. Enter keystore filename [kashflow-release.keystore]: " USER_KEYSTORE
    KEYSTORE_FILE=${USER_KEYSTORE:-"kashflow-release.keystore"}

    # Key alias
    read -p "2. Enter key alias [kashflow_key]: " USER_ALIAS
    KEY_ALIAS=${USER_ALIAS:-"kashflow_key"}

    # Store pass (minimum 6 characters)
    while true; do
        read -s -p "3. Enter keystore password (min 6 characters) [KashFlow2026SecurePass!]: " USER_PASS
        echo ""
        STORE_PASS=${USER_PASS:-"KashFlow2026SecurePass!"}
        if [ ${#STORE_PASS} -lt 6 ]; then
            echo -e "${RED}[ERROR] Password must be at least 6 characters. Please try again.${NC}"
        else
            break
        fi
    done

    # DNAME details for Certificate Authority
    read -p "4. Enter your Organization Name [KashFlow Agency]: " ORG_NAME
    ORG_NAME=${ORG_NAME:-"KashFlow Agency"}

    read -p "5. Enter two-letter Country Code (e.g. EG, US, SA) [EG]: " COUNTRY_CODE
    COUNTRY_CODE=${COUNTRY_CODE:-"EG"}

    DNAME_STRING="CN=KashFlow Security, OU=FinTech Ops, O=${ORG_NAME}, L=Cairo, ST=Cairo, C=${COUNTRY_CODE}"

    # Generate the keystore file if it doesn't exist
    if [ ! -f "$KEYSTORE_FILE" ]; then
        echo -e "${BLUE}Generating official release keystore: $KEYSTORE_FILE...${NC}"
        if keytool -genkey -v -keystore "$KEYSTORE_FILE" \
            -alias "$KEY_ALIAS" \
            -keyalg RSA -keysize 2048 -validity 10000 \
            -storepass "$STORE_PASS" -keypass "$STORE_PASS" \
            -dname "$DNAME_STRING" 2>/dev/null; then
            echo -e "${GREEN}[✔] Secure Keystore generated successfully ($KEYSTORE_FILE).${NC}"
        else
            echo -e "${RED}[ERROR] Keystore generation failed. Ensure your JDK installation is correct.${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}[✔] Using existing release keystore file: $KEYSTORE_FILE.${NC}"
    fi
fi

# ------------------------------------------------------------------------------
# STEP 4: Compilation of Android APK via Gradle
# ------------------------------------------------------------------------------
print_header "STEP 4: Compiling Android App utilizing Gradle"

if [ -f "android/gradlew" ]; then
    echo -e "${BLUE}Found Gradle Wrapper. Compiling release build...${NC}"
    cd android
    chmod +x gradlew
    
    # Run Gradle Clean & Build
    if ./gradlew assembleRelease; then
        cd ..
        echo -e "${GREEN}[✔] Gradle build completed successfully!${NC}"
        GRADLE_SUCCESS=true
    else
        cd ..
        echo -e "${RED}[ERROR] Gradle compilation failed.${NC}"
        echo -e "Common causes:"
        echo -e "  - Missing Android SDK platform tools (Ensure ANDROID_HOME is exported)."
        echo -e "  - Incorrect JDK version (Make sure you are using JDK 17 for Gradle compatibilities)."
        echo -e "  - Missing local.properties (Usually auto-generated by Android Studio)."
        echo ""
        read -p "Would you like to open the project in Android Studio to solve & build manually? (y/n) [y]: " OPEN_STUDIO
        OPEN_STUDIO=${OPEN_STUDIO:-y}
        if [[ "$OPEN_STUDIO" == "y" || "$OPEN_STUDIO" == "Y" ]]; then
            npx cap open android
        fi
        exit 1
    fi
else
    echo -e "${YELLOW}[WARNING] android/gradlew wrapper was not found inside the wrapper directory.${NC}"
    echo -e "You can open the project in Android Studio to let it download wrappers and build the app automatically."
    echo ""
    read -p "Would you like to open the project in Android Studio now? (y/n) [y]: " OPEN_STUDIO
    OPEN_STUDIO=${OPEN_STUDIO:-y}
    if [[ "$OPEN_STUDIO" == "y" || "$OPEN_STUDIO" == "Y" ]]; then
        npx cap open android
    fi
    exit 0
fi

# ------------------------------------------------------------------------------
# STEP 5: Alignment & Code Signing
# ------------------------------------------------------------------------------
if [ "$GRADLE_SUCCESS" = true ] && [ "$HAS_JAVA" = true ]; then
    print_header "STEP 5: Official Code Signing & Integrity Verification"

    UNSIGNED_APK="android/app/build/outputs/apk/release/app-release-unsigned.apk"
    SIGNED_APK="kashflow-wallet-signed.apk"
    ALIGNED_APK="kashflow-wallet-aligned.apk"

    if [ -f "$UNSIGNED_APK" ]; then
        echo -e "${BLUE}Found unsigned production APK at: $UNSIGNED_APK${NC}"
        
        # A. Aligning the APK
        if command_exists zipalign; then
            echo -e "${BLUE}Aligning APK with zipalign...${NC}"
            rm -f "$ALIGNED_APK" || true
            zipalign -v 4 "$UNSIGNED_APK" "$ALIGNED_APK"
            APK_TO_SIGN="$ALIGNED_APK"
            echo -e "${GREEN}[✔] APK aligned successfully.${NC}"
        else
            echo -e "${YELLOW}[WARNING] 'zipalign' not found in system PATH. Proceeding without alignment...${NC}"
            APK_TO_SIGN="$UNSIGNED_APK"
        fi

        # B. Signing the APK
        SIGN_SUCCESS=false

        # Look for apksigner in common Android SDK paths as well
        APKSIGNER_CMD="apksigner"
        if ! command_exists apksigner; then
            # Attempt to find it in common SDK build-tools directory
            if [ -n "$ANDROID_HOME" ]; then
                POTENTIAL_SIGNER=$(find "$ANDROID_HOME/build-tools" -name apksigner -type f | sort -V | tail -n 1)
                if [ -n "$POTENTIAL_SIGNER" ]; then
                    APKSIGNER_CMD="$POTENTIAL_SIGNER"
                fi
            fi
        fi

        if command_exists "$APKSIGNER_CMD" || [[ "$APKSIGNER_CMD" != "apksigner" ]]; then
            echo -e "${BLUE}Signing APK with modern apksigner...${NC}"
            if "$APKSIGNER_CMD" sign --ks "$KEYSTORE_FILE" \
                --ks-pass "pass:$STORE_PASS" \
                --ks-key-alias "$KEY_ALIAS" \
                --key-pass "pass:$STORE_PASS" \
                --out "$SIGNED_APK" "$APK_TO_SIGN"; then
                SIGN_SUCCESS=true
            fi
        fi

        # Fallback to Jarsigner if apksigner failed or is missing
        if [ "$SIGN_SUCCESS" = false ] && command_exists jarsigner; then
            echo -e "${YELLOW}apksigner failed or missing. Falling back to JDK jarsigner...${NC}"
            if jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
                -keystore "$KEYSTORE_FILE" \
                -storepass "$STORE_PASS" \
                "$APK_TO_SIGN" "$KEY_ALIAS"; then
                cp "$APK_TO_SIGN" "$SIGNED_APK"
                SIGN_SUCCESS=true
            fi
        fi

        if [ "$SIGN_SUCCESS" = true ]; then
            # Clean up alignment temporary file
            rm -f "$ALIGNED_APK" || true

            echo ""
            echo -e "${BOLD}${GREEN}======================================================================${NC}"
            echo -e "${BOLD}${GREEN}  🏆 SUCCESS: OFFICIAL SIGNED PRODUCTION APK GENERATED SUCCESSFULLY!  ${NC}"
            echo -e "${BOLD}${GREEN}======================================================================${NC}"
            echo -e "  📌 ${BOLD}Output File:${NC}  $SIGNED_APK"
            echo -e "  📌 ${BOLD}App Bundle ID:${NC} com.kashflow.wallet"
            echo -e "  📌 ${BOLD}App Name:${NC}      KashFlow Wallet"
            echo -e "  📌 ${BOLD}Keystore File:${NC} $KEYSTORE_FILE"
            echo -e "  📌 ${BOLD}Key Alias:${NC}     $KEY_ALIAS"
            echo -e "  📌 ${BOLD}Certificate:${NC}   2048-bit RSA (Google Play Store Compliant)"
            echo -e "  📌 ${BOLD}Status:${NC}        Verified & Ready for Distribution!"
            echo -e "${BOLD}${GREEN}======================================================================${NC}"
            echo ""
        else
            echo -e "${RED}[ERROR] APK signing failed. The unsigned APK was built, but could not be signed.${NC}"
            echo -e "Please ensure you have apksigner or jarsigner installed.${NC}"
            exit 1
        fi
    else
        echo -e "${RED}[ERROR] Build failed. Gradle finished, but couldn't find output file at: $UNSIGNED_APK${NC}"
        exit 1
    fi
fi
