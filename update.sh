#!/bin/bash
# ==============================================================================
# KashFlow Auto-Update Script
# Pulls latest from GitHub, rebuilds Docker image, and restarts container
# ==============================================================================

set -e

REPO_DIR="/root/kashflow-app"
cd "$REPO_DIR"

echo "========================================================"
echo "🔄 KashFlow Auto-Update Started"
echo "========================================================"

# 1. Fetch latest changes
echo "📥 1/5: Fetching latest changes from GitHub..."
git fetch origin

# Check if there are new commits
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/master)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "✅ Already up to date. No changes to deploy."
    exit 0
fi

echo "🆕 New commits found. Updating..."

# 2. Pull latest code
echo "⬇️  2/5: Pulling latest code..."
git pull origin master

# 3. Rebuild Docker image
echo "🏗️  3/5: Rebuilding Docker image..."
docker compose build --no-cache

# 4. Restart container
echo "🔄  4/5: Restarting container..."
docker compose down --remove-orphans
docker compose up -d

# 5. Health check
echo "🏥  5/5: Verifying deployment..."
sleep 5
if curl -f -s http://127.0.0.1:3000 > /dev/null; then
    echo "========================================================"
    echo "✅ Update Successful!"
    echo "🌐 Application running at https://admin.uzx.agency"
    echo "========================================================"
else
    echo "❌ Health check failed! Check logs: docker compose logs"
    exit 1
fi