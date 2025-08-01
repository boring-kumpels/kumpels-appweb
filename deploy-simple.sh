#!/bin/bash

# Simplified Deployment script for Kumpels App on EC2
# This script avoids git permission issues by using a cleaner approach

set -e

echo "🚀 Starting Kumpels App deployment (Simple Method)..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install essential tools
echo "🔧 Installing essential tools..."
sudo apt-get install -y curl wget rsync git

# Check and install Docker
echo "🐳 Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "Docker installed successfully!"
else
    echo "Docker is already installed (version: $(docker --version))"
fi

# Check and install Docker Compose
echo "🐳 Checking Docker Compose installation..."
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose installed successfully!"
else
    echo "Docker Compose is already installed (version: $(docker-compose --version))"
fi

# Create application directory
echo "📁 Setting up application directory..."
sudo mkdir -p /opt/kumpels-app
sudo chown $USER:$USER /opt/kumpels-app

# Deploy application using Git clone (cleanest method)
echo "📋 Deploying application..."
if [ -n "${REPO_URL:-}" ]; then
    echo "Using provided repository URL: $REPO_URL"
    if [ -d "/opt/kumpels-app/.git" ]; then
        echo "Updating existing repository..."
        cd /opt/kumpels-app
        git fetch origin
        git reset --hard origin/main
        git clean -fd
    else
        echo "Cloning fresh repository..."
        rm -rf /opt/kumpels-app/*
        git clone "$REPO_URL" /opt/kumpels-app
        cd /opt/kumpels-app
    fi
else
    echo "No REPO_URL provided. Please clone your repository manually:"
    echo "  git clone <your-repo-url> /opt/kumpels-app"
    echo "  cd /opt/kumpels-app"
    echo "  ./deploy-simple.sh"
    echo ""
    echo "Or set REPO_URL environment variable:"
    echo "  export REPO_URL='<your-repo-url>'"
    echo "  ./deploy-simple.sh"
    exit 1
fi

# Generate SSL certificate
echo "🔐 Generating SSL certificate..."
if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    ./scripts/generate-ssl.sh
else
    echo "SSL certificate already exists"
fi

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
if [ "$(docker-compose -f docker-compose.prod.yml ps -q | wc -l)" -gt 0 ]; then
    echo "Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down
fi

echo "Building Docker images..."
docker-compose -f docker-compose.prod.yml build

echo "Starting containers..."
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
fi

# Set up firewall
echo "🔥 Configuring firewall..."
if ! sudo ufw status | grep -q "Status: active"; then
    sudo ufw allow 22/tcp   # SSH
    sudo ufw allow 80/tcp   # HTTP
    sudo ufw allow 443/tcp  # HTTPS
    sudo ufw --force enable
    echo "Firewall configured!"
else
    echo "Firewall is already active"
fi

# Set up systemd service
echo "🔧 Setting up auto-start service..."
if [ ! -f "/etc/systemd/system/kumpels-app.service" ]; then
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
ExecStop=/usr/local/bin/docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl enable kumpels-app.service
    sudo systemctl start kumpels-app.service
    echo "Systemd service created!"
else
    echo "Systemd service already exists"
fi

echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 Application Status:"
echo "   - Web Interface: http://$(curl -s ifconfig.me)"
echo "   - Health Check: http://$(curl -s ifconfig.me)/health"
echo ""
echo "📝 Useful Commands:"
echo "   - View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   - Restart: sudo systemctl restart kumpels-app"
echo "   - Update: cd /opt/kumpels-app && git pull && docker-compose -f docker-compose.prod.yml up -d --build"