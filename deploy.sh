#!/bin/bash

# Deployment script for Kumpels App on EC2
# This script sets up the application on a fresh EC2 instance

set -e

echo "🚀 Starting Kumpels App deployment..."

# Load environment variables early - before any Docker operations
echo "📋 Loading environment variables..."
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with your Supabase configuration."
    exit 1
fi

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

# Install monitoring tools
echo "📊 Installing monitoring tools..."
if ! command -v htop &> /dev/null; then
    echo "Installing htop..."
    sudo apt-get install -y htop
fi

if ! command -v jq &> /dev/null; then
    echo "Installing jq..."
    sudo apt-get install -y jq
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

# Handle SSL certificate generation
echo "🔐 Setting up SSL certificate..."
SSL_MODE=${SSL_MODE:-"self-signed"}
DOMAIN=${DOMAIN:-$(curl -s ifconfig.me 2>/dev/null || echo "localhost")}
SSL_EMAIL=${SSL_EMAIL:-""}

if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    echo "No SSL certificate found. Generating new certificate..."
    if [[ "$SSL_MODE" == "letsencrypt" && -n "$SSL_EMAIL" && "$DOMAIN" != "localhost" ]]; then
        echo "Generating Let's Encrypt certificate for production..."
        ./scripts/generate-ssl.sh letsencrypt "$DOMAIN" "$SSL_EMAIL"
    else
        echo "Generating self-signed certificate for development..."
        ./scripts/generate-ssl.sh self-signed "$DOMAIN"
    fi
else
    echo "SSL certificate already exists"
    echo "To regenerate: rm -rf ssl/ && ./scripts/generate-ssl.sh"
fi

# Check Docker permissions and set up commands with environment preservation
echo "🔍 Checking Docker permissions..."
if ! docker ps > /dev/null 2>&1; then
    echo "⚠️  Docker permission issue detected. Using sudo with environment preservation..."
    DOCKER_CMD="sudo -E docker"
    DOCKER_COMPOSE_CMD="sudo -E docker-compose"
else
    echo "✅ Docker permissions OK"
    DOCKER_CMD="docker"
    DOCKER_COMPOSE_CMD="docker-compose"
fi

# Create monitoring script
echo "📊 Creating monitoring script..."
sudo tee /opt/kumpels-app/monitor.sh > /dev/null <<'EOF'
#!/bin/bash

# Kumpels App Monitoring Script
# This script monitors the application and restarts services if needed

LOG_FILE="/opt/kumpels-app/monitor.log"
DOCKER_COMPOSE_CMD="docker-compose"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to check if a service is healthy
check_service_health() {
    local service_name=$1
    local health_status
    
    health_status=$($DOCKER_COMPOSE_CMD -f docker-compose.prod.yml ps --format json | jq -r ".[] | select(.Service==\"$service_name\") | .Health")
    
    if [ "$health_status" = "healthy" ]; then
        return 0
    else
        return 1
    fi
}

# Function to restart a service
restart_service() {
    local service_name=$1
    log_message "Restarting $service_name service..."
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml restart "$service_name"
    sleep 30
}

# Function to check application health via HTTP
check_app_http() {
    if curl -f -s http://localhost/api/health > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to check nginx health via HTTP
check_nginx_http() {
    if curl -f -s http://localhost/health > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Main monitoring logic
log_message "Starting monitoring cycle..."

# Check if we're in the right directory
if [ ! -f "docker-compose.prod.yml" ]; then
    log_message "ERROR: docker-compose.prod.yml not found. Exiting."
    exit 1
fi

# Check app service health
if ! check_service_health "app"; then
    log_message "WARNING: App service is not healthy"
    restart_service "app"
fi

# Check nginx service health
if ! check_service_health "nginx"; then
    log_message "WARNING: Nginx service is not healthy"
    restart_service "nginx"
fi

# Check HTTP health endpoints
if ! check_app_http; then
    log_message "WARNING: App HTTP health check failed"
    restart_service "app"
fi

if ! check_nginx_http; then
    log_message "WARNING: Nginx HTTP health check failed"
    restart_service "nginx"
fi

# Check if containers are running
if [ "$($DOCKER_COMPOSE_CMD -f docker-compose.prod.yml ps -q | wc -l)" -eq 0 ]; then
    log_message "ERROR: No containers are running. Starting all services..."
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml up -d
fi

log_message "Monitoring cycle completed"
EOF

# Make monitoring script executable
sudo chmod +x /opt/kumpels-app/monitor.sh

# Build and start the application
echo "🔨 Building and starting the application..."
if [ "$($DOCKER_COMPOSE_CMD -f docker-compose.prod.yml ps -q 2>/dev/null | wc -l)" -gt 0 ]; then
    echo "Containers are already running. Stopping and rebuilding..."
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml down
fi

echo "Building Docker images..."
# Build with environment variables
echo "🔨 Building Docker image..."
$DOCKER_COMPOSE_CMD -f docker-compose.prod.yml build

echo "Starting containers..."
$DOCKER_COMPOSE_CMD -f docker-compose.prod.yml up -d

# Show logs immediately to help with debugging
echo "📋 Showing container logs for debugging..."
echo "=========================================="
$DOCKER_COMPOSE_CMD -f docker-compose.prod.yml logs --tail=50
echo "=========================================="

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🏥 Checking service health..."
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    echo "✅ Application is healthy!"
else
    echo "❌ Application health check failed."
    echo ""
    echo "🔍 Debugging information:"
    echo "=========================================="
    echo "Container status:"
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml ps
    echo ""
    echo "Recent logs:"
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml logs --tail=100
    echo "=========================================="
    echo ""
    echo "📋 Manual debugging commands:"
    echo "   - View all logs: $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml logs -f"
    echo "   - View specific service logs: $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml logs -f [service-name]"
    echo "   - Check container status: $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml ps"
    echo "   - Restart services: $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml restart"
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

# Create systemd service for auto-start with enhanced restart policy
echo "🔧 Setting up auto-start service..."
if [ ! -f "/etc/systemd/system/kumpels-app.service" ]; then
    echo "Creating systemd service..."
    sudo tee /etc/systemd/system/kumpels-app.service > /dev/null <<EOF
[Unit]
Description=Kumpels App Docker Compose
Requires=docker.service
After=docker.service
StartLimitIntervalSec=0

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/kumpels-app
EnvironmentFile=/opt/kumpels-app/.env
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
ExecReload=/usr/local/bin/docker-compose -f docker-compose.prod.yml restart
TimeoutStartSec=0
Restart=always
RestartSec=10

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

# Create monitoring service
echo "📊 Setting up monitoring service..."
sudo tee /etc/systemd/system/kumpels-monitor.service > /dev/null <<EOF
[Unit]
Description=Kumpels App Monitoring Service
After=kumpels-app.service
Wants=kumpels-app.service

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/kumpels-app
ExecStart=/opt/kumpels-app/monitor.sh
Restart=always
RestartSec=60
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Create monitoring timer for periodic checks
sudo tee /etc/systemd/system/kumpels-monitor.timer > /dev/null <<EOF
[Unit]
Description=Run Kumpels App monitoring every 2 minutes
Requires=kumpels-monitor.service

[Timer]
Unit=kumpels-monitor.service
OnCalendar=*:0/2
Persistent=true

[Install]
WantedBy=timers.target
EOF

# Enable and start monitoring
sudo systemctl enable kumpels-monitor.timer
sudo systemctl start kumpels-monitor.timer
echo "Monitoring service configured!"

# Configure nginx auto-restart
echo "🌐 Configuring nginx auto-restart..."
sudo tee /etc/systemd/system/nginx.service.d/override.conf > /dev/null <<EOF
[Service]
Restart=always
RestartSec=10
EOF

# Reload systemd and restart nginx
sudo systemctl daemon-reload
sudo systemctl restart nginx
echo "Nginx auto-restart configured!"

# Create log rotation for monitoring logs
echo "📋 Setting up log rotation..."
sudo tee /etc/logrotate.d/kumpels-monitor > /dev/null <<EOF
/opt/kumpels-app/monitor.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
EOF

echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 Application Status:"
if [[ "$SSL_MODE" == "letsencrypt" && -n "$SSL_EMAIL" ]]; then
    echo "   - Web Interface: https://$DOMAIN"
    echo "   - Health Check: https://$DOMAIN/api/health"
    echo "   - HTTP redirect: http://$DOMAIN → https://$DOMAIN"
else
    echo "   - Web Interface: https://$(curl -s ifconfig.me)"
    echo "   - Health Check: https://$(curl -s ifconfig.me)/api/health"
    echo "   - HTTP redirect: http://$(curl -s ifconfig.me) → https://$(curl -s ifconfig.me)"
    echo "   ⚠️  Using self-signed certificate - browsers will show security warning"
fi
echo ""
echo "🔧 Auto-Restart Features:"
echo "   - Docker containers: restart=unless-stopped (in docker-compose)"
echo "   - Systemd service: Restart=always with 10s delay"
echo "   - Monitoring service: Checks every 2 minutes"
echo "   - Nginx: Restart=always with 10s delay"
echo ""
echo "📝 Useful Commands:"
echo "   - View logs: $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml logs -f"
echo "   - Restart app: sudo systemctl restart kumpels-app"
echo "   - Stop app: sudo systemctl stop kumpels-app"
echo "   - Update app: cd /opt/kumpels-app && git pull && $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml up -d --build"
echo "   - Check status: sudo systemctl status kumpels-app"
echo "   - View monitoring logs: tail -f /opt/kumpels-app/monitor.log"
echo "   - Check monitoring status: sudo systemctl status kumpels-monitor.timer"
echo "   - Manual monitoring run: /opt/kumpels-app/monitor.sh"
echo ""
echo "🔐 SSL Certificate:"
if [[ "$SSL_MODE" == "letsencrypt" && -n "$SSL_EMAIL" ]]; then
    echo "   - Let's Encrypt certificate configured with automatic renewal"
    echo "   - Certificate renewal logs: /var/log/ssl-renewal.log"
    echo "   - Manual renewal: sudo certbot renew"
else
    echo "   - Self-signed certificate (development only)"
    echo "   - For production with custom domain, use: SSL_MODE=letsencrypt SSL_EMAIL=your@email.com DOMAIN=yourdomain.com ./deploy.sh"
    echo "   - For production with Let's Encrypt: export SSL_MODE=letsencrypt SSL_EMAIL=admin@yourdomain.com DOMAIN=yourdomain.com && ./deploy.sh"
fi
echo ""
echo "🚀 Deployment Options:"
echo "   Development: ./deploy.sh"
echo "   Production:  SSL_MODE=letsencrypt SSL_EMAIL=admin@example.com DOMAIN=example.com ./deploy.sh"
echo ""
echo "🔄 Re-run this script anytime to update or repair the installation!" 