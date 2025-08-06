#!/bin/bash

# SSL Certificate Generation Script for Kumpels App
# Supports both self-signed certificates and Let's Encrypt

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SSL_DIR="./ssl"
DOMAIN="${1:-localhost}"
CERT_TYPE="${2:-self-signed}"
EMAIL="${3:-admin@${DOMAIN}}"
DAYS_VALID="${4:-365}"

# Let's Encrypt configuration
LETSENCRYPT_DIR="./letsencrypt"
ACME_CHALLENGE_DIR="./acme-challenge"

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

# Function to create directories
create_directories() {
    print_status "Creating SSL directories..."
    mkdir -p "$SSL_DIR"
    mkdir -p "$LETSENCRYPT_DIR"
    mkdir -p "$ACME_CHALLENGE_DIR"
    print_success "Directories created successfully"
}

# Function to generate self-signed certificate
generate_self_signed() {
    print_status "Generating self-signed SSL certificate for domain: $DOMAIN"
    
    # Create OpenSSL configuration
    cat > "$SSL_DIR/openssl.conf" << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req
x509_extensions = v3_req

[dn]
C = US
ST = State
L = City
O = Organization
OU = Organizational Unit
CN = $DOMAIN
emailAddress = $EMAIL

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = *.$DOMAIN
DNS.3 = localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

    # Generate private key
    print_status "Generating private key..."
    openssl genrsa -out "$SSL_DIR/key.pem" 2048
    
    # Generate certificate signing request
    print_status "Generating certificate signing request..."
    openssl req -new -key "$SSL_DIR/key.pem" -out "$SSL_DIR/cert.csr" -config "$SSL_DIR/openssl.conf"
    
    # Generate self-signed certificate
    print_status "Generating self-signed certificate..."
    openssl x509 -req -in "$SSL_DIR/cert.csr" -signkey "$SSL_DIR/key.pem" -out "$SSL_DIR/cert.pem" -days "$DAYS_VALID" -extensions v3_req -extfile "$SSL_DIR/openssl.conf"
    
    # Set proper permissions
    chmod 600 "$SSL_DIR/key.pem"
    chmod 644 "$SSL_DIR/cert.pem"
    
    # Clean up
    rm -f "$SSL_DIR/cert.csr" "$SSL_DIR/openssl.conf"
    
    print_success "Self-signed certificate generated successfully"
    print_status "Certificate valid for $DAYS_VALID days"
}

# Function to generate Let's Encrypt certificate
generate_letsencrypt() {
    print_status "Generating Let's Encrypt certificate for domain: $DOMAIN"
    
    # Check if certbot is available (either installed or via Docker)
    if ! command_exists certbot && ! command_exists docker; then
        print_error "Neither certbot nor docker is installed. Please install one of them:"
        print_status "Ubuntu/Debian: sudo apt-get install certbot"
        print_status "macOS: brew install certbot"
        print_status "Or install Docker and use the Docker method"
        exit 1
    fi
    
    # Check if domain is accessible
    print_status "Checking domain accessibility..."
    if ! nslookup "$DOMAIN" >/dev/null 2>&1; then
        print_warning "Domain $DOMAIN might not be accessible. Make sure DNS is configured correctly."
    fi
    
    # Check if port 80 is available
    print_status "Checking if port 80 is available..."
    if lsof -i :80 >/dev/null 2>&1; then
        print_warning "Port 80 is already in use. Stopping nginx container to free the port..."
        docker-compose stop nginx 2>/dev/null || true
        sleep 2
    fi
    
    # Generate certificate using certbot
    print_status "Running certbot to obtain certificate..."
    
    if command_exists certbot; then
        # Use local certbot installation
        print_status "Using local certbot installation..."
        
        # Check if running as root or with sudo
        if [[ $EUID -eq 0 ]]; then
            # Running as root, proceed normally
            certbot certonly \
                --standalone \
                --email "$EMAIL" \
                --agree-tos \
                --no-eff-email \
                --domains "$DOMAIN" \
                --cert-path "$SSL_DIR/cert.pem" \
                --key-path "$SSL_DIR/key.pem" \
                --config-dir "$LETSENCRYPT_DIR" \
                --work-dir "$LETSENCRYPT_DIR" \
                --logs-dir "$LETSENCRYPT_DIR"
        else
            # Not running as root, try with sudo
            print_status "Attempting to run certbot with sudo..."
            sudo certbot certonly \
                --standalone \
                --email "$EMAIL" \
                --agree-tos \
                --no-eff-email \
                --domains "$DOMAIN" \
                --cert-path "$(pwd)/$SSL_DIR/cert.pem" \
                --key-path "$(pwd)/$SSL_DIR/key.pem" \
                --config-dir "$(pwd)/$LETSENCRYPT_DIR" \
                --work-dir "$(pwd)/$LETSENCRYPT_DIR" \
                --logs-dir "$(pwd)/$LETSENCRYPT_DIR"
        fi
    elif command_exists docker; then
        # Use Docker certbot
        print_status "Using Docker certbot..."
        
        # Create necessary directories with proper permissions
        mkdir -p "$SSL_DIR" "$LETSENCRYPT_DIR" "$ACME_CHALLENGE_DIR"
        chmod 755 "$SSL_DIR" "$LETSENCRYPT_DIR" "$ACME_CHALLENGE_DIR"
        
        # Run certbot in Docker
        docker run --rm \
            -v "$(pwd)/$SSL_DIR:/etc/letsencrypt/live/$DOMAIN" \
            -v "$(pwd)/$LETSENCRYPT_DIR:/etc/letsencrypt" \
            -v "$(pwd)/$ACME_CHALLENGE_DIR:/var/www/html" \
            -p 80:80 \
            -p 443:443 \
            certbot/certbot certonly \
            --standalone \
            --email "$EMAIL" \
            --agree-tos \
            --no-eff-email \
            --domains "$DOMAIN"
        
        # Copy certificates to the expected locations
        if [[ -f "$LETSENCRYPT_DIR/live/$DOMAIN/fullchain.pem" ]]; then
            cp "$LETSENCRYPT_DIR/live/$DOMAIN/fullchain.pem" "$SSL_DIR/cert.pem"
            cp "$LETSENCRYPT_DIR/live/$DOMAIN/privkey.pem" "$SSL_DIR/key.pem"
            chmod 644 "$SSL_DIR/cert.pem"
            chmod 600 "$SSL_DIR/key.pem"
        else
            print_error "Certificate files not found after Docker certbot run"
            exit 1
        fi
    else
        print_error "No certbot installation found and Docker is not available"
        exit 1
    fi
    
    # Restart nginx if it was stopped
    if docker-compose ps nginx 2>/dev/null | grep -q "Up"; then
        print_status "Restarting nginx container..."
        docker-compose up -d nginx
    fi
    
    print_success "Let's Encrypt certificate generated successfully"
}

# Function to validate certificate
validate_certificate() {
    print_status "Validating certificate..."
    
    if [[ -f "$SSL_DIR/cert.pem" && -f "$SSL_DIR/key.pem" ]]; then
        # Check certificate details
        print_status "Certificate details:"
        openssl x509 -in "$SSL_DIR/cert.pem" -text -noout | grep -E "(Subject:|Not Before|Not After|DNS:)"
        
        # Verify certificate and key match
        CERT_HASH=$(openssl x509 -noout -modulus -in "$SSL_DIR/cert.pem" | openssl md5)
        KEY_HASH=$(openssl rsa -noout -modulus -in "$SSL_DIR/key.pem" | openssl md5)
        
        if [[ "$CERT_HASH" == "$KEY_HASH" ]]; then
            print_success "Certificate and private key match"
        else
            print_error "Certificate and private key do not match!"
            exit 1
        fi
    else
        print_error "Certificate files not found!"
        exit 1
    fi
}

# Function to update Docker Compose
update_docker_compose() {
    print_status "Updating Docker Compose configuration..."
    
    # Check if docker-compose.yml exists
    if [[ ! -f "docker-compose.yml" ]]; then
        print_error "docker-compose.yml not found in current directory"
        exit 1
    fi
    
    # Create backup
    cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)
    
    print_success "Docker Compose backup created"
    print_status "SSL certificates are ready to use with your Docker setup"
    print_status "The certificates are mounted at /etc/nginx/ssl/ in the nginx container"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [DOMAIN] [CERT_TYPE] [EMAIL] [DAYS_VALID]"
    echo ""
    echo "Parameters:"
    echo "  DOMAIN      - Domain name for the certificate (default: localhost)"
    echo "  CERT_TYPE   - Certificate type: self-signed or letsencrypt (default: self-signed)"
    echo "  EMAIL       - Email address for Let's Encrypt (default: admin@DOMAIN)"
    echo "  DAYS_VALID  - Days valid for self-signed certificate (default: 365)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Self-signed for localhost"
    echo "  $0 example.com self-signed            # Self-signed for example.com"
    echo "  $0 example.com letsencrypt admin@example.com  # Let's Encrypt for example.com"
    echo "  $0 localhost self-signed admin@localhost 30   # Self-signed valid for 30 days"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists openssl; then
        print_error "OpenSSL is not installed. Please install it first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Main execution
main() {
    echo "=========================================="
    echo "SSL Certificate Generation Script"
    echo "=========================================="
    echo ""
    
    # Show usage if help requested
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        show_usage
        exit 0
    fi
    
    print_status "Domain: $DOMAIN"
    print_status "Certificate Type: $CERT_TYPE"
    print_status "Email: $EMAIL"
    print_status "Days Valid: $DAYS_VALID"
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Create directories
    create_directories
    
    # Generate certificate based on type
    case "$CERT_TYPE" in
        "self-signed")
            generate_self_signed
            ;;
        "letsencrypt")
            generate_letsencrypt
            ;;
        *)
            print_error "Invalid certificate type: $CERT_TYPE"
            print_status "Valid types: self-signed, letsencrypt"
            exit 1
            ;;
    esac
    
    # Validate certificate
    validate_certificate
    
    # Update Docker Compose
    update_docker_compose
    
    echo ""
    print_success "SSL certificate generation completed successfully!"
    echo ""
    print_status "Next steps:"
    print_status "1. Restart your Docker containers: docker-compose down && docker-compose up -d"
    print_status "2. Access your application via HTTPS: https://$DOMAIN"
    echo ""
    
    if [[ "$CERT_TYPE" == "self-signed" ]]; then
        print_warning "Note: Self-signed certificates will show browser warnings."
        print_warning "This is normal for development environments."
    fi
}

# Run main function with all arguments
main "$@" 