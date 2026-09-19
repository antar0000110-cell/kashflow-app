#!/usr/bin/env bash
set -e

echo "============================================================"
echo "      KASHFLOW FINANCIAL OS - SERVER DEPLOYMENT SCRIPT     "
echo "============================================================"

# Process flags
CLEAN_DATA=false

for arg in "$@"; do
    case $arg in
        --clean-data)
        CLEAN_DATA=true
        shift
        ;;
    esac
done

if [ "$CLEAN_DATA" = true ]; then
    echo "[!] Production Zero-Data Mode Requested: Clearing local storage caches & state..."
    rm -rf .data_cache
fi

echo "[1/3] Installing production dependencies..."
npm install --production=false

echo "[2/3] Building production assets..."
npm run build

echo "[3/3] Launching production Node server on port 3000..."
export NODE_ENV=production
export PORT=3000
npm run start || npm run dev
