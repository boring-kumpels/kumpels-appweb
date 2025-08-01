#!/bin/bash

# Deployment script for Kumpels App on EC2
# This script sets up the application on a fresh EC2 instance

set -e

echo "🚀 Starting Kumpels App deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker and Docker Compose
echo "🐳 Installing Docker and Docker Compose..."
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Nginx (for SSL termination and load balancing)
echo "🌐 Installing Nginx..."
sudo apt-get install -y nginx

# Create application directory
echo "📁 Setting up application directory..."
sudo mkdir -p /opt/kumpels-app
sudo chown $USER:$USER /opt/kumpels-app

# Copy application files (assuming they're in the current directory)
echo "📋 Copying application files..."
cp -r . /opt/kumpels-app/
cd /opt/kumpels-app

# Generate SSL certificate for development
echo "🔐 Generating SSL certificate..."
./scripts/generate-ssl.sh

# Create environment file
echo "⚙️  Setting up environment configuration..."
if [ ! -f .env ]; then
    echo "Please create a .env file with your Supabase configuration."
    echo "You can copy from env.example as a starting point."
    cp env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file with your actual Supabase configuration:"
    echo "   - Get your Supabase credentials from: https://supabase.com/dashboard"
    echo "   - Update DATABASE_URL and DIRECT_URL with your Supabase database URL"
    echo "   - Update SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY"
    echo "   - Generate a strong NEXTAUTH_SECRET (at least 32 characters)"
    echo "   - Add your RESEND_API_KEY for email functionality"
    echo ""
    echo "After updating .env, run this script again."
    exit 1
fi

# Build and start the application
echo "🔨 Building and starting the application..."
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🏥 Checking service health..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Application is healthy!"
else
    echo "❌ Application health check failed. Check logs with:"
    echo "   docker-compose -f docker-compose.prod.yml logs"
    exit 1
fi

# Set up firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable

# Set up automatic updates
echo "🔄 Setting up automatic security updates..."
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Create systemd service for auto-start
echo "🔧 Setting up auto-start service..."
sudo tee /etc/systemd/system/kumpels-app.service > /dev/null <<EOF
[Unit]
Description=Kumpels App Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/kumpels-app
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
sudo systemctl enable kumpels-app.service
sudo systemctl start kumpels-app.service

echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 Application Status:"
echo "   - Web Interface: http://$(curl -s ifconfig.me)"
echo "   - Health Check: http://$(curl -s ifconfig.me)/health"
echo ""
echo "📝 Useful Commands:"
echo "   - View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   - Restart app: sudo systemctl restart kumpels-app"
echo "   - Stop app: sudo systemctl stop kumpels-app"
echo "   - Update app: cd /opt/kumpels-app && git pull && docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
echo "🔐 SSL Certificate:"
echo "   - For production, replace the self-signed certificate in /opt/kumpels-app/ssl/"
echo "   - Use Let's Encrypt or a proper Certificate Authority" 