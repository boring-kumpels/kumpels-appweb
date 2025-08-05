#!/bin/bash

# Deployment script for Kumpels App on EC2
# This script sets up the application on a fresh EC2 instance

set -e

echo "🚀 Starting Kumpels App deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install essential tools
echo "🔧 Installing essential tools..."
if ! command -v rsync &> /dev/null; then
    echo "Installing rsync..."
    sudo apt-get install -y rsync
fi

if ! command -v git &> /dev/null; then
    echo "Installing git..."
    sudo apt-get install -y git
fi

# Check and install Docker
echo "🐳 Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release

    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

    # Add Docker repository
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
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
    sudo apt-get install -y nginx
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
        # Get the current branch or commit
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
                # Use rsync to exclude unnecessary files
                if command -v rsync &> /dev/null; then
                    rsync -av --exclude='.git' --exclude='node_modules' --exclude='.next' --exclude='*.log' . /opt/kumpels-app/
                else
                    # Fallback to cp with manual exclusion
                    find . -maxdepth 1 -not -name '.git' -not -name 'node_modules' -not -name '.next' -not -name '.' -exec sudo cp -r {} /opt/kumpels-app/ \;
                fi
            fi
        fi
    else
        echo "Not a Git repository. Using direct file copy..."
        # Use rsync to exclude unnecessary files
        if command -v rsync &> /dev/null; then
            rsync -av --exclude='node_modules' --exclude='.next' --exclude='*.log' . /opt/kumpels-app/
        else
            # Fallback to cp with manual exclusion
            find . -maxdepth 1 -not -name 'node_modules' -not -name '.next' -not -name '.' -exec sudo cp -r {} /opt/kumpels-app/ \;
        fi
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

# Build and start the application
echo "🔨 Building and starting the application..."
if [ "$($DOCKER_COMPOSE_CMD -f docker-compose.prod.yml ps -q 2>/dev/null | wc -l)" -gt 0 ]; then
    echo "Containers are already running. Stopping and rebuilding..."
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml down
fi

echo "Building Docker images..."
# Load and export environment variables from .env file
echo "📋 Loading environment variables..."
set -a  # automatically export all variables
source .env
set +a  # stop automatically exporting

# Verify key environment variables are loaded
echo "🔍 Verifying environment variables..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL is not set"
    exit 1
fi
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY is not set"
    exit 1
fi
echo "✅ Environment variables loaded successfully"

# Build with environment variables - preserve environment for sudo
echo "🔨 Building Docker image..."
if [ "$DOCKER_COMPOSE_CMD" = "sudo docker-compose" ]; then
    # Use sudo with environment preservation
    sudo -E docker-compose -f docker-compose.prod.yml build
else
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml build
fi

echo "Starting containers..."
if [ "$DOCKER_COMPOSE_CMD" = "sudo docker-compose" ]; then
    # Use sudo with environment preservation
    sudo -E docker-compose -f docker-compose.prod.yml up -d
else
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml up -d
fi

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

# Set up automatic updates
echo "🔄 Setting up automatic security updates..."
if ! dpkg -l | grep -q unattended-upgrades; then
    echo "Installing unattended-upgrades..."
    sudo apt-get install -y unattended-upgrades
    sudo dpkg-reconfigure -plow unattended-upgrades
    echo "Automatic updates configured!"
else
    echo "Unattended-upgrades is already installed"
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
echo "   - Check status: sudo systemctl status kumpels-app"
echo ""
echo "🔐 SSL Certificate:"
echo "   - For production, replace the self-signed certificate in /opt/kumpels-app/ssl/"
echo "   - Use Let's Encrypt or a proper Certificate Authority"
echo ""
echo "🔄 Re-run this script anytime to update or repair the installation!" 