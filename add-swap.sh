#!/bin/bash

# Script to add swap space to EC2 instance
# This helps prevent memory-related build failures

echo "🔧 Adding swap space to EC2 instance..."

# Check if swap already exists
if swapon --show | grep -q "/swapfile"; then
    echo "✅ Swap file already exists"
    swapon --show
    exit 0
fi

# Check available disk space
DISK_AVAILABLE=$(df -BG / | awk 'NR==2{print $4}' | sed 's/G//')
echo "Available disk space: ${DISK_AVAILABLE}GB"

# Determine swap size (2GB or 25% of available space, whichever is smaller)
if [ "$DISK_AVAILABLE" -gt 8 ]; then
    SWAP_SIZE="2G"
else
    SWAP_SIZE="1G"
fi

echo "Creating ${SWAP_SIZE} swap file..."

# Create swap file
sudo fallocate -l $SWAP_SIZE /swapfile

# Set correct permissions
sudo chmod 600 /swapfile

# Make it swap
sudo mkswap /swapfile

# Enable swap
sudo swapon /swapfile

# Make swap permanent
if ! grep -q "/swapfile" /etc/fstab; then
    echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab
fi

# Set swappiness to 10 (less aggressive swapping)
if ! grep -q "vm.swappiness" /etc/sysctl.conf; then
    echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf
    sudo sysctl vm.swappiness=10
fi

echo "✅ Swap space added successfully!"
echo ""
echo "📊 Current memory status:"
free -h
echo ""
echo "📋 Swap configuration:"
swapon --show
echo ""
echo "💡 Swap will persist across reboots" 