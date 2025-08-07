#!/bin/bash

# Enhanced SSL certificate generation script
# Supports both self-signed (development) and Let's Encrypt (production)

set -e

SSL_DIR="./ssl"
MODE=${1:-"self-signed"}  # self-signed or letsencrypt
DOMAIN=${2:-"localhost"}
EMAIL=${3:-""}

echo "🔐 SSL Certificate Generation Script"
echo "Mode: $MODE"
echo "Domain: $DOMAIN"

# Create SSL directory if it doesn't exist
mkdir -p "$SSL_DIR"

generate_self_signed() {
    local domain=$1
    echo "📝 Generating self-signed SSL certificate for $domain..."
    
    # Generate private key
    openssl genrsa -out "$SSL_DIR/key.pem" 2048
    
    # Generate certificate signing request with SAN extension
    openssl req -new -key "$SSL_DIR/key.pem" -out "$SSL_DIR/cert.csr" \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$domain" \
        -config <(
            echo '[req]'
            echo 'default_bits = 2048'
            echo 'prompt = no'
            echo 'distinguished_name = req_distinguished_name'
            echo 'req_extensions = v3_req'
            echo ''
            echo '[req_distinguished_name]'
            echo "CN = $domain"
            echo ''
            echo '[v3_req]'
            echo 'basicConstraints = CA:FALSE'
            echo 'keyUsage = nonRepudiation, digitalSignature, keyEncipherment'
            echo 'subjectAltName = @alt_names'
            echo ''
            echo '[alt_names]'
            echo "DNS.1 = $domain"
            echo 'DNS.2 = localhost'
            echo 'IP.1 = 127.0.0.1'
        )
    
    # Generate self-signed certificate with SAN extension
    openssl x509 -req -in "$SSL_DIR/cert.csr" -signkey "$SSL_DIR/key.pem" \
        -out "$SSL_DIR/cert.pem" -days 365 \
        -extensions v3_req \
        -extfile <(
            echo '[v3_req]'
            echo 'basicConstraints = CA:FALSE'
            echo 'keyUsage = nonRepudiation, digitalSignature, keyEncipherment'
            echo 'subjectAltName = @alt_names'
            echo ''
            echo '[alt_names]'
            echo "DNS.1 = $domain"
            echo 'DNS.2 = localhost'
            echo 'IP.1 = 127.0.0.1'
        )
    
    # Clean up CSR
    rm "$SSL_DIR/cert.csr"
    
    # Set proper permissions
    chmod 600 "$SSL_DIR/key.pem"
    chmod 644 "$SSL_DIR/cert.pem"
    
    echo "✅ Self-signed certificate generated successfully!"
    echo "   Certificate: $SSL_DIR/cert.pem"
    echo "   Private key: $SSL_DIR/key.pem"
    echo ""
    echo "⚠️  Note: This is a self-signed certificate."
    echo "   - Browsers will show security warnings"
    echo "   - Users need to accept the certificate manually"
    echo "   - Consider creating a custom CA for multiple services"
}

install_certbot() {
    echo "📦 Installing Certbot..."
    
    # Check if running on Ubuntu/Debian
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
    elif command -v yum &> /dev/null; then
        # RHEL/CentOS
        sudo yum install -y certbot python3-certbot-nginx
    elif command -v dnf &> /dev/null; then
        # Fedora
        sudo dnf install -y certbot python3-certbot-nginx
    else
        echo "❌ Unsupported package manager. Please install certbot manually."
        exit 1
    fi
    
    echo "✅ Certbot installed successfully!"
}

generate_letsencrypt() {
    local domain=$1
    local email=$2
    
    if [[ -z "$email" ]]; then
        echo "❌ Email is required for Let's Encrypt certificates."
        echo "Usage: $0 letsencrypt <domain> <email>"
        exit 1
    fi
    
    echo "🌐 Generating Let's Encrypt SSL certificate for $domain..."
    
    # Check if certbot is installed
    if ! command -v certbot &> /dev/null; then
        echo "Certbot not found. Installing..."
        install_certbot
    fi
    
    # Stop nginx temporarily for standalone authentication
    echo "⏸️  Temporarily stopping nginx for certificate generation..."
    if systemctl is-active --quiet nginx; then
        sudo systemctl stop nginx
        NGINX_WAS_RUNNING=true
    else
        NGINX_WAS_RUNNING=false
    fi
    
    # Generate certificate using standalone mode
    echo "📋 Requesting certificate from Let's Encrypt..."
    sudo certbot certonly \
        --standalone \
        --agree-tos \
        --no-eff-email \
        --email "$email" \
        -d "$domain" \
        --non-interactive
    
    # Copy certificates to our SSL directory
    echo "📁 Copying certificates to SSL directory..."
    sudo cp "/etc/letsencrypt/live/$domain/fullchain.pem" "$SSL_DIR/cert.pem"
    sudo cp "/etc/letsencrypt/live/$domain/privkey.pem" "$SSL_DIR/key.pem"
    
    # Set proper permissions
    sudo chown $USER:$USER "$SSL_DIR/cert.pem" "$SSL_DIR/key.pem"
    chmod 644 "$SSL_DIR/cert.pem"
    chmod 600 "$SSL_DIR/key.pem"
    
    # Restart nginx if it was running
    if [ "$NGINX_WAS_RUNNING" = true ]; then
        echo "🔄 Restarting nginx..."
        sudo systemctl start nginx
    fi
    
    echo "✅ Let's Encrypt certificate generated successfully!"
    echo "   Certificate: $SSL_DIR/cert.pem"
    echo "   Private key: $SSL_DIR/key.pem"
    echo ""
    echo "📋 Certificate will expire in 90 days."
    echo "   Set up automatic renewal with: sudo crontab -e"
    echo "   Add this line: 0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'"
}

setup_auto_renewal() {
    local domain=$1
    echo "🔄 Setting up automatic certificate renewal..."
    
    # Create renewal script
    sudo tee /opt/kumpels-app/scripts/renew-ssl.sh > /dev/null <<EOF
#!/bin/bash
# Auto-renewal script for Let's Encrypt certificates

SSL_DIR="/opt/kumpels-app/ssl"
DOMAIN="$domain"

echo "\$(date): Starting certificate renewal check..." >> /var/log/ssl-renewal.log

# Renew certificate
if /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'; then
    echo "\$(date): Certificate renewal successful" >> /var/log/ssl-renewal.log
    
    # Copy renewed certificates
    cp "/etc/letsencrypt/live/\$DOMAIN/fullchain.pem" "\$SSL_DIR/cert.pem"
    cp "/etc/letsencrypt/live/\$DOMAIN/privkey.pem" "\$SSL_DIR/key.pem"
    
    # Restart docker containers to use new certificates
    cd /opt/kumpels-app
    docker-compose -f docker-compose.prod.yml restart nginx
    
    echo "\$(date): Certificates updated and services restarted" >> /var/log/ssl-renewal.log
else
    echo "\$(date): Certificate renewal failed" >> /var/log/ssl-renewal.log
fi
EOF

    sudo chmod +x /opt/kumpels-app/scripts/renew-ssl.sh
    
    # Add to crontab (run twice daily)
    (crontab -l 2>/dev/null; echo "0 2,14 * * * /opt/kumpels-app/scripts/renew-ssl.sh") | crontab -
    
    echo "✅ Auto-renewal set up successfully!"
    echo "   Renewal script: /opt/kumpels-app/scripts/renew-ssl.sh"
    echo "   Renewal schedule: Twice daily at 2 AM and 2 PM"
    echo "   Logs: /var/log/ssl-renewal.log"
}

# Main logic
case "$MODE" in
    "self-signed")
        generate_self_signed "$DOMAIN"
        ;;
    "letsencrypt")
        generate_letsencrypt "$DOMAIN" "$EMAIL"
        setup_auto_renewal "$DOMAIN"
        ;;
    *)
        echo "❌ Invalid mode. Use 'self-signed' or 'letsencrypt'"
        echo ""
        echo "Usage:"
        echo "  $0 self-signed [domain]                    # Generate self-signed certificate"
        echo "  $0 letsencrypt <domain> <email>           # Generate Let's Encrypt certificate"
        echo ""
        echo "Examples:"
        echo "  $0 self-signed                             # Self-signed for localhost"
        echo "  $0 self-signed myapp.local                 # Self-signed for custom domain"
        echo "  $0 letsencrypt example.com admin@example.com  # Let's Encrypt for production"
        exit 1
        ;;
esac

echo ""
echo "🎉 SSL certificate setup completed!"
echo "   You can now start your application with HTTPS support."