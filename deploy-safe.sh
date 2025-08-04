#!/bin/bash

# Safe Deployment script for Kumpels App on EC2
# This script includes better error handling and memory management

set -e

echo "🚀 Starting Kumpels App safe deployment..."

# Function to handle errors
handle_error() {
    echo "❌ Error occurred at line $1"
    echo "🔄 Attempting to clean up..."
    
    # Stop any running containers
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    fi
    
    # Clean up Docker system
    docker system prune -f 2>/dev/null || true
    
    echo "💡 Tips to resolve issues:"
    echo "   - Check available memory: free -h"
    echo "   - Check disk space: df -h"
    echo "   - View Docker logs: docker-compose -f docker-compose.prod.yml logs"
    echo "   - Restart Docker: sudo systemctl restart docker"
    
    exit 1
}

# Set error trap
trap 'handle_error $LINENO' ERR

# Check system resources
echo "🔍 Checking system resources..."
MEMORY_AVAILABLE=$(free -m | awk 'NR==2{printf "%.0f", $7}')
DISK_AVAILABLE=$(df -BG / | awk 'NR==2{print $4}' | sed 's/G//')

echo "   Available memory: ${MEMORY_AVAILABLE}MB"
echo "   Available disk space: ${DISK_AVAILABLE}GB"

# Check minimum requirements
if [ "$MEMORY_AVAILABLE" -lt 1024 ]; then
    echo "⚠️  Warning: Less than 1GB memory available. Build may fail."
    echo "   Consider increasing EC2 instance memory or adding swap."
fi

if [ "$DISK_AVAILABLE" -lt 5 ]; then
    echo "⚠️  Warning: Less than 5GB disk space available. Build may fail."
    echo "   Consider cleaning up disk space."
fi

# Update system packages (non-blocking)
echo "📦 Updating system packages..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq || echo "⚠️  Package upgrade failed, continuing..."

# Install essential tools
echo "🔧 Installing essential tools..."
sudo apt-get install -y -qq rsync git curl wget htop

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

# Check and install Nginx
echo "🌐 Checking Nginx installation..."
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo apt-get install -y -qq nginx
    echo "Nginx installed successfully!"
else
    echo "Nginx is already installed (version: $(nginx -v 2>&1))"
fi

# Create application directory
echo "📁 Setting up application directory..."
if [ ! -d "/opt/kumpels-app" ]; then
    sudo mkdir -p /opt/kumpels-app
    sudo chown $USER:$USER /opt/kumpels-app
    echo "Application directory created!"
else
    echo "Application directory already exists at /opt/kumpels-app"
fi

# Deploy application files
echo "📋 Deploying application files..."
if [ "$PWD" != "/opt/kumpels-app" ]; then
    # Check if this is a git repository
    if [ -d ".git" ]; then
        echo "Detected Git repository. Using Git deployment method..."
        CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
        REPO_URL=$(git config --get remote.origin.url 2>/dev/null)
        
        if [ -d "/opt/kumpels-app/.git" ]; then
            echo "Updating existing Git repository..."
            cd /opt/kumpels-app
            git fetch origin
            git reset --hard origin/$CURRENT_BRANCH
            git clean -fd
        else
            echo "Cloning repository to /opt/kumpels-app..."
            if [ -n "$REPO_URL" ]; then
                sudo rm -rf /opt/kumpels-app/*
                git clone "$REPO_URL" /tmp/kumpels-app-deploy
                sudo cp -r /tmp/kumpels-app-deploy/* /opt/kumpels-app/
                sudo rm -rf /tmp/kumpels-app-deploy
            else
                echo "No remote repository found. Using file copy method..."
                rsync -av --exclude='.git' --exclude='node_modules' --exclude='.next' --exclude='*.log' . /opt/kumpels-app/
            fi
        fi
    else
        echo "Not a Git repository. Using direct file copy..."
        rsync -av --exclude='node_modules' --exclude='.next' --exclude='*.log' . /opt/kumpels-app/
    fi
    
    # Fix ownership of all files
    sudo chown -R $USER:$USER /opt/kumpels-app/
    cd /opt/kumpels-app
    echo "Application files deployed to /opt/kumpels-app"
else
    echo "Already in application directory"
    # If we're already in the app directory, pull latest changes if it's a git repo
    if [ -d ".git" ]; then
        echo "Pulling latest changes..."
        git fetch origin
        CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
        git reset --hard origin/$CURRENT_BRANCH
        git clean -fd
        echo "Repository updated!"
    fi
fi

# Generate SSL certificate for development
echo "🔐 Checking SSL certificate..."
if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    echo "Generating SSL certificate..."
    mkdir -p ssl
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

# Check Docker permissions
echo "🔍 Checking Docker permissions..."
if ! docker ps > /dev/null 2>&1; then
    echo "⚠️  Docker permission issue detected. Fixing..."
    sudo usermod -aG docker $USER
    echo "✅ Added user to docker group. You may need to log out and log back in."
    echo "   Alternatively, run: newgrp docker"
    echo ""
    echo "🔄 Attempting to continue with sudo for Docker commands..."
    DOCKER_CMD="sudo docker"
    DOCKER_COMPOSE_CMD="sudo docker-compose"
else
    echo "✅ Docker permissions OK"
    DOCKER_CMD="docker"
    DOCKER_COMPOSE_CMD="docker-compose"
fi

# Load environment variables
echo "🔍 Checking environment variables..."
if [ -f .env ]; then
    echo "✅ .env file found"
    # Check if required variables are set
    if grep -q "NEXT_PUBLIC_SUPABASE_URL=" .env && grep -q "DATABASE_URL=" .env; then
        echo "✅ Environment variables appear to be configured"
    else
        echo "⚠️  Some environment variables may be missing. Please check your .env file."
    fi
else
    echo "❌ .env file not found!"
    exit 1
fi

# Clean up Docker system before building
echo "🧹 Cleaning up Docker system..."
$DOCKER_CMD system prune -f
$DOCKER_CMD builder prune -f

# Stop any existing containers
echo "🛑 Stopping existing containers..."
$DOCKER_COMPOSE_CMD -f docker-compose.prod.yml down 2>/dev/null || true

# Build and start the application with timeout and memory limits
echo "🔨 Building and starting the application..."
echo "Building Docker images (this may take several minutes)..."
echo "   - Setting build timeout to 30 minutes"
echo "   - Using buildkit for better performance"

# Set Docker build options
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Build with timeout and progress monitoring
timeout 1800 $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml build --no-cache --progress=plain || {
    echo "❌ Build timed out after 30 minutes"
    echo "🔄 Attempting to build without cache..."
    timeout 1800 $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml build --progress=plain || {
        echo "❌ Build failed even without cache"
        echo "💡 Try these solutions:"
        echo "   1. Increase EC2 instance memory (t3.medium or higher)"
        echo "   2. Add swap space: sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile"
        echo "   3. Clean Docker: docker system prune -a -f"
        exit 1
    }
}

echo "Starting containers..."
$DOCKER_COMPOSE_CMD -f docker-compose.prod.yml up -d

# Wait for services to be ready with better monitoring
echo "⏳ Waiting for services to be ready..."
for i in {1..60}; do
    if curl -f http://localhost/health > /dev/null 2>&1; then
        echo "✅ Application is healthy!"
        break
    fi
    
    if [ $i -eq 60 ]; then
        echo "❌ Application failed to start within 5 minutes"
        echo "📋 Container logs:"
        $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml logs --tail=50
        exit 1
    fi
    
    echo "   Waiting... ($i/60)"
    sleep 5
done

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
if ! sudo ufw status | grep -q "Status: active"; then
    echo "Configuring UFW firewall..."
    sudo ufw allow 22/tcp   # SSH
    sudo ufw allow 80/tcp   # HTTP
    sudo ufw allow 443/tcp  # HTTPS
    sudo ufw --force enable
    echo "Firewall configured and enabled!"
else
    echo "Firewall is already active"
    # Check if required ports are allowed
    if ! sudo ufw status | grep -q "80/tcp"; then
        sudo ufw allow 80/tcp
    fi
    if ! sudo ufw status | grep -q "443/tcp"; then
        sudo ufw allow 443/tcp
    fi
fi

# Create systemd service for auto-start
echo "🔧 Setting up auto-start service..."
if [ ! -f "/etc/systemd/system/kumpels-app.service" ]; then
    echo "Creating systemd service..."
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
    echo "Systemd service created and started!"
else
    echo "Systemd service already exists"
    # Reload systemd and restart service if needed
    sudo systemctl daemon-reload
    if ! sudo systemctl is-active --quiet kumpels-app.service; then
        sudo systemctl start kumpels-app.service
        echo "Systemd service restarted!"
    else
        echo "Systemd service is already running"
    fi
fi

echo "🎉 Safe deployment completed successfully!"
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
echo "   - Check status: sudo systemctl status kumpels-app"
echo "   - Monitor resources: htop"
echo ""
echo "🔐 SSL Certificate:"
echo "   - For production, replace the self-signed certificate in /opt/kumpels-app/ssl/"
echo "   - Use Let's Encrypt or a proper Certificate Authority"
echo ""
echo "🔄 Re-run this script anytime to update or repair the installation!" 