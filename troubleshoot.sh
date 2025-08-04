#!/bin/bash

# Troubleshooting script for Kumpels App deployment issues

echo "🔍 Kumpels App Troubleshooting Script"
echo "======================================"

# Function to check system resources
check_resources() {
    echo ""
    echo "📊 System Resources:"
    echo "-------------------"
    echo "Memory:"
    free -h
    echo ""
    echo "Disk Space:"
    df -h
    echo ""
    echo "CPU Info:"
    nproc
    echo "CPU Load:"
    uptime
}

# Function to check Docker status
check_docker() {
    echo ""
    echo "🐳 Docker Status:"
    echo "----------------"
    if command -v docker &> /dev/null; then
        echo "Docker version: $(docker --version)"
        echo "Docker Compose version: $(docker-compose --version)"
        echo ""
        echo "Docker daemon status:"
        sudo systemctl status docker --no-pager -l
        echo ""
        echo "Running containers:"
        docker ps -a
        echo ""
        echo "Docker disk usage:"
        docker system df
    else
        echo "❌ Docker not installed"
    fi
}

# Function to check application status
check_app() {
    echo ""
    echo "🚀 Application Status:"
    echo "---------------------"
    
    if [ -d "/opt/kumpels-app" ]; then
        echo "✅ Application directory exists"
        cd /opt/kumpels-app
        
        if [ -f "docker-compose.prod.yml" ]; then
            echo "✅ Docker Compose file found"
            echo ""
            echo "Container status:"
            docker-compose -f docker-compose.prod.yml ps
            echo ""
            echo "Recent logs:"
            docker-compose -f docker-compose.prod.yml logs --tail=20
        else
            echo "❌ Docker Compose file not found"
        fi
        
        if [ -f ".env" ]; then
            echo "✅ Environment file exists"
        else
            echo "❌ Environment file missing"
        fi
    else
        echo "❌ Application directory not found"
    fi
}

# Function to check network connectivity
check_network() {
    echo ""
    echo "🌐 Network Connectivity:"
    echo "----------------------"
    echo "Public IP: $(curl -s ifconfig.me)"
    echo "Local IP: $(hostname -I | awk '{print $1}')"
    echo ""
    echo "Port status:"
    echo "Port 80: $(netstat -tlnp | grep :80 || echo 'Not listening')"
    echo "Port 443: $(netstat -tlnp | grep :443 || echo 'Not listening')"
    echo "Port 3000: $(netstat -tlnp | grep :3000 || echo 'Not listening')"
}

# Function to check firewall status
check_firewall() {
    echo ""
    echo "🔥 Firewall Status:"
    echo "------------------"
    if command -v ufw &> /dev/null; then
        sudo ufw status
    else
        echo "UFW not installed"
    fi
}

# Function to check systemd services
check_services() {
    echo ""
    echo "🔧 Systemd Services:"
    echo "-------------------"
    echo "Docker service:"
    sudo systemctl status docker --no-pager -l
    echo ""
    echo "Kumpels app service:"
    if [ -f "/etc/systemd/system/kumpels-app.service" ]; then
        sudo systemctl status kumpels-app --no-pager -l
    else
        echo "❌ Kumpels app service not found"
    fi
}

# Function to provide fixes
provide_fixes() {
    echo ""
    echo "🔧 Common Fixes:"
    echo "---------------"
    echo ""
    echo "1. If Docker build hangs:"
    echo "   - Add swap space: ./add-swap.sh"
    echo "   - Clean Docker: docker system prune -a -f"
    echo "   - Use optimized build: docker-compose -f docker-compose.optimized.yml build"
    echo ""
    echo "2. If containers won't start:"
    echo "   - Check logs: docker-compose -f docker-compose.prod.yml logs"
    echo "   - Restart Docker: sudo systemctl restart docker"
    echo "   - Check environment variables in .env file"
    echo ""
    echo "3. If application is unreachable:"
    echo "   - Check firewall: sudo ufw status"
    echo "   - Check nginx: docker-compose -f docker-compose.prod.yml logs nginx"
    echo "   - Check app health: curl http://localhost/health"
    echo ""
    echo "4. If memory issues:"
    echo "   - Add swap: ./add-swap.sh"
    echo "   - Increase EC2 instance size"
    echo "   - Use optimized Dockerfile: Dockerfile.optimized"
    echo ""
    echo "5. If build fails:"
    echo "   - Use safe deployment: ./deploy-safe.sh"
    echo "   - Check system resources: free -h && df -h"
    echo "   - Clean and rebuild: docker system prune -a -f"
}

# Function to clean up
cleanup() {
    echo ""
    echo "🧹 Cleanup Options:"
    echo "------------------"
    echo ""
    echo "1. Clean Docker system:"
    echo "   docker system prune -a -f"
    echo ""
    echo "2. Remove all containers:"
    echo "   docker-compose -f docker-compose.prod.yml down -v"
    echo ""
    echo "3. Clean application directory:"
    echo "   sudo rm -rf /opt/kumpels-app/*"
    echo ""
    echo "4. Reset Docker daemon:"
    echo "   sudo systemctl restart docker"
}

# Main execution
case "${1:-all}" in
    "resources")
        check_resources
        ;;
    "docker")
        check_docker
        ;;
    "app")
        check_app
        ;;
    "network")
        check_network
        ;;
    "firewall")
        check_firewall
        ;;
    "services")
        check_services
        ;;
    "fixes")
        provide_fixes
        ;;
    "cleanup")
        cleanup
        ;;
    "all"|*)
        check_resources
        check_docker
        check_app
        check_network
        check_firewall
        check_services
        provide_fixes
        ;;
esac

echo ""
echo "✅ Troubleshooting complete!"
echo ""
echo "💡 For more help, run:"
echo "   ./troubleshoot.sh [resources|docker|app|network|firewall|services|fixes|cleanup]" 