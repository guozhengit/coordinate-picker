#!/bin/bash

# Coordinate Picker - Cloud Deployment Script
# This script deploys the application to a cloud server

set -e

echo "======================================================"
echo "  Coordinate Picker - Cloud Deployment"
echo "======================================================"
echo ""

# Check if SERVER_IP is provided
if [ -z "$1" ]; then
    echo "Usage: ./deploy.sh <server-ip> [port]"
    echo "Example: ./deploy.sh 123.45.67.89 80"
    exit 1
fi

SERVER_IP=$1
PORT=${2:-80}
APP_NAME="coordinate-picker"

echo "📦 Building Docker image..."
docker build -t $APP_NAME:latest .

echo ""
echo "💾 Saving Docker image..."
docker save $APP_NAME:latest | gzip > ${APP_NAME}.tar.gz

echo ""
echo "📤 Uploading to server..."
scp ${APP_NAME}.tar.gz root@${SERVER_IP}:/tmp/

echo ""
echo "🚀 Deploying on server..."
ssh root@${SERVER_IP} << 'ENDSSH'
cd /tmp
docker load < coordinate-picker.tar.gz
docker stop coordinate-picker 2>/dev/null || true
docker rm coordinate-picker 2>/dev/null || true
docker run -d \
    --name coordinate-picker \
    --restart unless-stopped \
    -p PORT:80 \
    coordinate-picker:latest
rm coordinate-picker.tar.gz
ENDSSH

# Replace PORT placeholder
ssh root@${SERVER_IP} "sed -i 's/PORT/${PORT}/g' /tmp/deployment-command.sh"

echo ""
echo "✅ Deployment completed!"
echo "======================================================"
echo "🌐 Your application is now running at:"
echo "   http://${SERVER_IP}:${PORT}"
echo "======================================================"
echo ""
echo "🔧 Useful commands:"
echo "   View logs:    ssh root@${SERVER_IP} 'docker logs -f coordinate-picker'"
echo "   Restart:      ssh root@${SERVER_IP} 'docker restart coordinate-picker'"
echo "   Stop:         ssh root@${SERVER_IP} 'docker stop coordinate-picker'"
echo "======================================================"

# Cleanup
rm ${APP_NAME}.tar.gz
