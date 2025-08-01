#!/bin/bash

# Quick fix for Docker permission issues

echo "🔧 Fixing Docker permissions..."

# Add user to docker group
sudo usermod -aG docker $USER

# Change ownership of docker socket (temporary fix)
sudo chown $USER:docker /var/run/docker.sock 2>/dev/null || true

echo "✅ Docker permissions fixed!"
echo ""
echo "📝 Note: For a permanent fix, you should log out and log back in, or run:"
echo "   newgrp docker"
echo ""
echo "🔄 You can now run the deployment script again."