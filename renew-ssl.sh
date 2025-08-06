#!/bin/bash

# SSL Certificate Renewal Script for Kumpels App
# Automatically renews Let's Encrypt certificates and restarts containers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SSL_DIR="./ssl"
LETSENCRYPT_DIR="./letsencrypt"
DOMAIN="${1:-localhost}"

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

# Function to check if certificate needs renewal
check_certificate_expiry() {
    if [[ ! -f "$SSL_DIR/cert.pem" ]]; then
        print_error "Certificate not found at $SSL_DIR/cert.pem"
        return 1
    fi
    
    # Get certificate expiry date
    EXPIRY_DATE=$(openssl x509 -enddate -noout -in "$SSL_DIR/cert.pem" | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$EXPIRY_DATE" +%s 2>/dev/null)
    CURRENT_EPOCH=$(date +%s)
    DAYS_UNTIL_EXPIRY=$(( (EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))
    
    print_status "Certificate expires on: $EXPIRY_DATE"
    print_status "Days until expiry: $DAYS_UNTIL_EXPIRY"
    
    # Renew if less than 30 days until expiry
    if [[ $DAYS_UNTIL_EXPIRY -lt 30 ]]; then
        print_warning "Certificate expires in less than 30 days. Renewal recommended."
        return 0
    else
        print_success "Certificate is still valid for $DAYS_UNTIL_EXPIRY days"
        return 1
    fi
}

# Function to renew Let's Encrypt certificate
renew_letsencrypt() {
    print_status "Renewing Let's Encrypt certificate for domain: $DOMAIN"
    
    # Check if certbot is available (either installed or via Docker)
    if ! command_exists certbot && ! command_exists docker; then
        print_error "Neither certbot nor docker is installed. Please install one of them."
        exit 1
    fi
    
    # Stop nginx container to free port 80 for certbot
    print_status "Stopping nginx container for certificate renewal..."
    docker-compose stop nginx
    
    # Wait a moment for port to be freed
    sleep 2
    
    # Renew certificate
    print_status "Running certbot to renew certificate..."
    
    if command_exists certbot; then
        # Use local certbot installation
        print_status "Using local certbot installation..."
        
        # Check if running as root or with sudo
        if [[ $EUID -eq 0 ]]; then
            # Running as root, proceed normally
            certbot renew \
                --standalone \
                --cert-path "$SSL_DIR/cert.pem" \
                --key-path "$SSL_DIR/key.pem" \
                --config-dir "$LETSENCRYPT_DIR" \
                --work-dir "$LETSENCRYPT_DIR" \
                --logs-dir "$LETSENCRYPT_DIR" \
                --force-renewal
        else
            # Not running as root, try with sudo
            print_status "Attempting to run certbot with sudo..."
            sudo certbot renew \
                --standalone \
                --cert-path "$(pwd)/$SSL_DIR/cert.pem" \
                --key-path "$(pwd)/$SSL_DIR/key.pem" \
                --config-dir "$(pwd)/$LETSENCRYPT_DIR" \
                --work-dir "$(pwd)/$LETSENCRYPT_DIR" \
                --logs-dir "$(pwd)/$LETSENCRYPT_DIR" \
                --force-renewal
        fi
    elif command_exists docker; then
        # Use Docker certbot
        print_status "Using Docker certbot..."
        
        # Run certbot in Docker for renewal
        docker run --rm \
            -v "$(pwd)/$SSL_DIR:/etc/letsencrypt/live/$DOMAIN" \
            -v "$(pwd)/$LETSENCRYPT_DIR:/etc/letsencrypt" \
            -v "$(pwd)/$ACME_CHALLENGE_DIR:/var/www/html" \
            -p 80:80 \
            -p 443:443 \
            certbot/certbot renew \
            --standalone \
            --force-renewal
        
        # Copy renewed certificates to the expected locations
        if [[ -f "$LETSENCRYPT_DIR/live/$DOMAIN/fullchain.pem" ]]; then
            cp "$LETSENCRYPT_DIR/live/$DOMAIN/fullchain.pem" "$SSL_DIR/cert.pem"
            cp "$LETSENCRYPT_DIR/live/$DOMAIN/privkey.pem" "$SSL_DIR/key.pem"
            chmod 644 "$SSL_DIR/cert.pem"
            chmod 600 "$SSL_DIR/key.pem"
        else
            print_error "Renewed certificate files not found after Docker certbot run"
            exit 1
        fi
    else
        print_error "No certbot installation found and Docker is not available"
        exit 1
    fi
    
    # Restart nginx container
    print_status "Restarting nginx container..."
    docker-compose up -d nginx
    
    print_success "Certificate renewal completed"
}

# Function to restart all containers
restart_containers() {
    print_status "Restarting all containers to apply new certificates..."
    
    # Restart all containers
    docker-compose down
    docker-compose up -d
    
    print_success "All containers restarted successfully"
}

# Function to validate renewed certificate
validate_renewed_certificate() {
    print_status "Validating renewed certificate..."
    
    if [[ -f "$SSL_DIR/cert.pem" && -f "$SSL_DIR/key.pem" ]]; then
        # Check certificate details
        print_status "Renewed certificate details:"
        openssl x509 -in "$SSL_DIR/cert.pem" -text -noout | grep -E "(Subject:|Not Before|Not After|DNS:)"
        
        # Verify certificate and key match
        CERT_HASH=$(openssl x509 -noout -modulus -in "$SSL_DIR/cert.pem" | openssl md5)
        KEY_HASH=$(openssl rsa -noout -modulus -in "$SSL_DIR/key.pem" | openssl md5)
        
        if [[ "$CERT_HASH" == "$KEY_HASH" ]]; then
            print_success "Renewed certificate and private key match"
        else
            print_error "Renewed certificate and private key do not match!"
            exit 1
        fi
    else
        print_error "Renewed certificate files not found!"
        exit 1
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [DOMAIN]"
    echo ""
    echo "Parameters:"
    echo "  DOMAIN      - Domain name for the certificate (default: localhost)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Check and renew certificate for localhost"
    echo "  $0 example.com        # Check and renew certificate for example.com"
    echo ""
    echo "This script will:"
    echo "1. Check if the certificate needs renewal (expires within 30 days)"
    echo "2. Renew the Let's Encrypt certificate if needed"
    echo "3. Restart Docker containers to apply the new certificate"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists openssl; then
        print_error "OpenSSL is not installed. Please install it first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "docker-compose is not installed. Please install it first."
        exit 1
    fi
    
    if [[ ! -f "docker-compose.yml" ]]; then
        print_error "docker-compose.yml not found in current directory"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Main execution
main() {
    echo "=========================================="
    echo "SSL Certificate Renewal Script"
    echo "=========================================="
    echo ""
    
    # Show usage if help requested
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        show_usage
        exit 0
    fi
    
    print_status "Domain: $DOMAIN"
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Check if certificate needs renewal
    if check_certificate_expiry; then
        print_status "Certificate renewal is needed"
        
        # Ask for confirmation
        read -p "Do you want to renew the certificate? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # Renew certificate
            renew_letsencrypt
            
            # Validate renewed certificate
            validate_renewed_certificate
            
            # Restart containers
            restart_containers
            
            echo ""
            print_success "Certificate renewal completed successfully!"
            print_status "Your application is now running with the renewed certificate"
        else
            print_status "Certificate renewal cancelled"
        fi
    else
        print_status "Certificate renewal is not needed at this time"
    fi
}

# Run main function with all arguments
main "$@" 