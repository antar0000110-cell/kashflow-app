#!/bin/bash
JWT=$(openssl rand -hex 32)
DATA=/root/kashflow-data
mkdir -p $DATA
cat > /root/kashflow-app/.env << EOF
JWT_SECRET=$JWT
DATA_DIR=$DATA
APP_URL=https://uzx.agency
PORT=3000
EOF
echo "=== .env created ==="
cat /root/kashflow-app/.env
echo ""
echo "=== Data dir ==="
ls -la $DATA
