#!/bin/bash

# SSL Permission Fix Script for Kumpels App
# Helps resolve permission issues with Let's Encrypt certificate generation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="${1:-localhost}"
SSL_DIR="./ssl"
LETSENCRYPT_DIR="./letsencrypt"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check current user and permissions
check_permissions() {
    print_status "Checking current user and permissions..."
    
    echo "Current user: $(whoami)"
    echo "User ID: $(id -u)"
    echo "Groups: $(groups)"
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        print_success "Running as root - should have necessary permissions"
        return 0
    else
        print_warning "Not running as root - may need sudo for port 80 binding"
        return 1
    fi
}

# Function to check port 80 status
check_port_80() {
    print_status "Checking port 80 status..."
    
    if lsof -i :80 >/dev/null 2>&1; then
        print_warning "Port 80 is currently in use:"
        lsof -i :80
        return 1
    else
        print_success "Port 80 is available"
        return 0
    fi
}

# Function to stop conflicting services
stop_conflicting_services() {
    print_status "Stopping potentially conflicting services..."
    
    # Stop nginx container if running
    if docker-compose ps nginx 2>/dev/null | grep -q "Up"; then
        print_status "Stopping nginx container..."
        docker-compose stop nginx
        sleep 2
    fi
    
    # Stop other common web servers
    for service in apache2 nginx lighttpd; do
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            print_status "Stopping $service service..."
            sudo systemctl stop "$service" 2>/dev/null || true
        fi
    done
    
    # Kill any processes using port 80
    if lsof -i :80 >/dev/null 2>&1; then
        print_warning "Port 80 is still in use. Attempting to kill processes..."
        sudo lsof -ti :80 | xargs sudo kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Function to provide alternative solutions
show_alternatives() {
    echo ""
    echo "=========================================="
    echo "Alternative Solutions for SSL Certificate"
    echo "=========================================="
    echo ""
    
    print_status "Since you're having permission issues with Let's Encrypt, here are alternatives:"
    echo ""
    
    echo "1. Use Docker method (Recommended):"
    echo "   ./generate-ssl.sh $DOMAIN letsencrypt admin@$DOMAIN"
    echo "   (This will automatically use Docker certbot)"
    echo ""
    
    echo "2. Use self-signed certificate for development:"
    echo "   ./generate-ssl.sh $DOMAIN self-signed"
    echo ""
    
    echo "3. Run with sudo (if you have sudo access):"
    echo "   sudo ./generate-ssl.sh $DOMAIN letsencrypt admin@$DOMAIN"
    echo ""
    
    echo "4. Install certbot with proper permissions:"
    echo "   sudo apt-get update"
    echo "   sudo apt-get install certbot"
    echo "   sudo ./generate-ssl.sh $DOMAIN letsencrypt admin@$DOMAIN"
    echo ""
    
    echo "5. Use webroot method instead of standalone:"
    echo "   (Requires web server configuration)"
    echo ""
}

# Function to test Docker certbot
test_docker_certbot() {
    print_status "Testing Docker certbot availability..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed"
        return 1
    fi
    
    # Test if certbot image can be pulled
    print_status "Pulling certbot Docker image..."
    if docker pull certbot/certbot >/dev/null 2>&1; then
        print_success "Docker certbot is available"
        return 0
    else
        print_error "Failed to pull certbot Docker image"
        return 1
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [DOMAIN]"
    echo ""
    echo "Parameters:"
    echo "  DOMAIN      - Domain name to check (default: localhost)"
    echo ""
    echo "This script will:"
    echo "1. Check current user permissions"
    echo "2. Check port 80 availability"
    echo "3. Stop conflicting services"
    echo "4. Provide alternative solutions"
    echo "5. Test Docker certbot availability"
}

# Main execution
main() {
    echo "=========================================="
    echo "SSL Permission Fix Script"
    echo "=========================================="
    echo ""
    
    # Show usage if help requested
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        show_usage
        exit 0
    fi
    
    print_status "Domain: $DOMAIN"
    echo ""
    
    # Check permissions
    check_permissions
    
    # Check port 80
    check_port_80
    
    # Stop conflicting services
    stop_conflicting_services
    
    # Test Docker certbot
    if test_docker_certbot; then
        print_success "Docker certbot is available - you can use the Docker method"
    else
        print_warning "Docker certbot is not available"
    fi
    
    # Show alternatives
    show_alternatives
    
    echo ""
    print_status "Recommended next steps:"
    echo "1. Try: ./generate-ssl.sh $DOMAIN letsencrypt admin@$DOMAIN"
    echo "2. If that fails, use: ./generate-ssl.sh $DOMAIN self-signed"
    echo "3. For production, ensure proper DNS configuration and try again"
}

# Run main function with all arguments
main "$@" 