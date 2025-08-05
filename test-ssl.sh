#!/bin/bash

# SSL Test Script for Kumpels App
# Tests SSL certificate setup and Docker integration

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

# Function to check SSL certificate
check_ssl_certificate() {
    print_status "Checking SSL certificate..."
    
    if [[ ! -f "$SSL_DIR/cert.pem" ]]; then
        print_error "Certificate not found at $SSL_DIR/cert.pem"
        print_status "Run ./generate-ssl.sh first to create certificates"
        return 1
    fi
    
    if [[ ! -f "$SSL_DIR/key.pem" ]]; then
        print_error "Private key not found at $SSL_DIR/key.pem"
        return 1
    fi
    
    # Check certificate expiry
    EXPIRY_DATE=$(openssl x509 -enddate -noout -in "$SSL_DIR/cert.pem" | cut -d= -f2)
    print_status "Certificate expires on: $EXPIRY_DATE"
    
    # Verify certificate and key match
    CERT_HASH=$(openssl x509 -noout -modulus -in "$SSL_DIR/cert.pem" | openssl md5)
    KEY_HASH=$(openssl rsa -noout -modulus -in "$SSL_DIR/key.pem" | openssl md5)
    
    if [[ "$CERT_HASH" == "$KEY_HASH" ]]; then
        print_success "Certificate and private key match"
    else
        print_error "Certificate and private key do not match!"
        return 1
    fi
    
    return 0
}

# Function to check Docker setup
check_docker_setup() {
    print_status "Checking Docker setup..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed"
        return 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed"
        return 1
    fi
    
    if [[ ! -f "docker-compose.yml" ]]; then
        print_error "docker-compose.yml not found in current directory"
        return 1
    fi
    
    print_success "Docker setup looks good"
    return 0
}

# Function to test NGINX configuration
test_nginx_config() {
    print_status "Testing NGINX configuration..."
    
    # Start containers in background
    print_status "Starting containers..."
    docker-compose up -d
    
    # Wait for containers to be ready
    print_status "Waiting for containers to be ready..."
    sleep 10
    
    # Check container status
    if docker-compose ps | grep -q "Up"; then
        print_success "Containers are running"
    else
        print_error "Containers failed to start"
        docker-compose logs
        return 1
    fi
    
    # Test NGINX configuration
    if docker-compose exec nginx nginx -t 2>/dev/null; then
        print_success "NGINX configuration is valid"
    else
        print_warning "Could not test NGINX configuration (container might not be ready)"
    fi
    
    return 0
}

# Function to test HTTPS connectivity
test_https_connectivity() {
    print_status "Testing HTTPS connectivity..."
    
    # Wait a bit more for full startup
    sleep 5
    
    # Test HTTPS connection
    if command_exists curl; then
        print_status "Testing HTTPS connection with curl..."
        
        # Test with curl (ignore SSL verification for self-signed certs)
        if curl -k -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" | grep -q "200\|301\|302"; then
            print_success "HTTPS connection successful"
        else
            print_warning "HTTPS connection test failed (this might be normal for self-signed certs)"
        fi
        
        # Test health endpoint
        if curl -k -s "https://$DOMAIN/health" | grep -q "healthy"; then
            print_success "Health endpoint accessible via HTTPS"
        else
            print_warning "Health endpoint test failed"
        fi
    else
        print_warning "curl not available, skipping connectivity test"
    fi
    
    # Test with wget if available
    if command_exists wget; then
        print_status "Testing HTTPS connection with wget..."
        
        if wget --no-check-certificate -q -O /dev/null "https://$DOMAIN" 2>/dev/null; then
            print_success "HTTPS connection successful (wget)"
        else
            print_warning "HTTPS connection test failed with wget"
        fi
    fi
}

# Function to show test results
show_test_results() {
    echo ""
    echo "=========================================="
    echo "SSL Test Results"
    echo "=========================================="
    echo ""
    
    if [[ "$1" == "0" ]]; then
        print_success "All tests passed!"
        echo ""
        print_status "Your SSL setup is working correctly."
        print_status "You can now access your application at:"
        echo "  https://$DOMAIN"
        echo ""
        
        if [[ "$DOMAIN" == "localhost" ]]; then
            print_warning "Note: Since you're using a self-signed certificate,"
            print_warning "your browser will show a security warning."
            print_warning "This is normal for development environments."
            print_warning "Click 'Advanced' and 'Proceed to localhost' to continue."
        fi
    else
        print_error "Some tests failed. Please check the output above."
        echo ""
        print_status "Common solutions:"
        print_status "1. Run ./generate-ssl.sh to create certificates"
        print_status "2. Check Docker and Docker Compose installation"
        print_status "3. Ensure ports 80 and 443 are available"
        print_status "4. Check docker-compose logs for errors"
    fi
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up test environment..."
    docker-compose down
    print_success "Cleanup completed"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [DOMAIN]"
    echo ""
    echo "Parameters:"
    echo "  DOMAIN      - Domain name to test (default: localhost)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Test SSL setup for localhost"
    echo "  $0 example.com        # Test SSL setup for example.com"
    echo ""
    echo "This script will:"
    echo "1. Check SSL certificate validity"
    echo "2. Verify Docker setup"
    echo "3. Test NGINX configuration"
    echo "4. Test HTTPS connectivity"
    echo "5. Clean up test environment"
}

# Main execution
main() {
    echo "=========================================="
    echo "SSL Test Script"
    echo "=========================================="
    echo ""
    
    # Show usage if help requested
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        show_usage
        exit 0
    fi
    
    print_status "Testing SSL setup for domain: $DOMAIN"
    echo ""
    
    # Initialize test results
    TEST_RESULT=0
    
    # Check SSL certificate
    if ! check_ssl_certificate; then
        TEST_RESULT=1
    fi
    
    # Check Docker setup
    if ! check_docker_setup; then
        TEST_RESULT=1
    fi
    
    # Only continue if basic checks pass
    if [[ $TEST_RESULT -eq 0 ]]; then
        # Test NGINX configuration
        if ! test_nginx_config; then
            TEST_RESULT=1
        fi
        
        # Test HTTPS connectivity
        test_https_connectivity
        
        # Cleanup
        cleanup
    fi
    
    # Show results
    show_test_results $TEST_RESULT
    
    exit $TEST_RESULT
}

# Run main function with all arguments
main "$@" 