#!/bin/bash

# Advanced Self-Signed SSL Certificate Generator for Production
# This script creates production-ready self-signed certificates with proper extensions

set -e

SSL_DIR="./ssl"
DOMAIN=${1:-"localhost"}
IP_ADDRESS=${2:-""}
ORGANIZATION=${3:-"Kumpels App"}
VALIDITY_DAYS=${4:-"3650"}  # 10 years default

echo "🔐 Production Self-Signed SSL Certificate Generator"
echo "=================================================="
echo "Domain: $DOMAIN"
echo "Organization: $ORGANIZATION"
echo "Validity: $VALIDITY_DAYS days"
if [[ -n "$IP_ADDRESS" ]]; then
    echo "IP Address: $IP_ADDRESS"
fi
echo ""

# Create SSL directory if it doesn't exist
mkdir -p "$SSL_DIR"

# Generate configuration file
cat > "$SSL_DIR/cert.conf" <<EOF
[req]
default_bits = 4096
prompt = no
distinguished_name = req_distinguished_name
req_extensions = v3_req

[req_distinguished_name]
C=US
ST=State
L=City
O=$ORGANIZATION
OU=IT Department
CN=$DOMAIN

[v3_req]
keyUsage = critical, digitalSignature, keyEncipherment, keyAgreement
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @alt_names
basicConstraints = CA:FALSE
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = localhost
IP.1 = 127.0.0.1
EOF

# Add IP address if provided
if [[ -n "$IP_ADDRESS" ]]; then
    echo "IP.2 = $IP_ADDRESS" >> "$SSL_DIR/cert.conf"
fi

# Add www subdomain if it's a domain (not IP)
if [[ "$DOMAIN" != *"."* || "$DOMAIN" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
    # It's likely an IP or hostname, don't add www
    :
else
    echo "DNS.3 = www.$DOMAIN" >> "$SSL_DIR/cert.conf"
fi

echo "📝 Generating 4096-bit RSA private key..."
openssl genrsa -out "$SSL_DIR/key.pem" 4096

echo "📋 Generating certificate signing request..."
openssl req -new -key "$SSL_DIR/key.pem" -out "$SSL_DIR/cert.csr" -config "$SSL_DIR/cert.conf"

echo "🔖 Generating self-signed certificate..."
openssl x509 -req -in "$SSL_DIR/cert.csr" -signkey "$SSL_DIR/key.pem" \
    -out "$SSL_DIR/cert.pem" -days "$VALIDITY_DAYS" \
    -extensions v3_req -extfile "$SSL_DIR/cert.conf"

# Clean up temporary files
rm "$SSL_DIR/cert.csr" "$SSL_DIR/cert.conf"

# Set proper permissions
chmod 600 "$SSL_DIR/key.pem"
chmod 644 "$SSL_DIR/cert.pem"

echo ""
echo "✅ Production-grade self-signed certificate generated!"
echo "   Certificate: $SSL_DIR/cert.pem"
echo "   Private key: $SSL_DIR/key.pem"
echo "   Key strength: 4096-bit RSA"
echo "   Validity: $VALIDITY_DAYS days"
echo ""

# Display certificate information
echo "📋 Certificate Details:"
openssl x509 -in "$SSL_DIR/cert.pem" -text -noout | grep -A 10 "Subject Alternative Name"
echo ""
openssl x509 -in "$SSL_DIR/cert.pem" -noout -dates
echo ""

echo "🔒 Security Notes:"
echo "   ✅ Uses 4096-bit RSA key (stronger than standard 2048-bit)"
echo "   ✅ Includes Subject Alternative Names (SAN)"
echo "   ✅ Proper certificate extensions for TLS"
echo "   ✅ Valid for both server and client authentication"
echo ""
echo "⚠️  Browser Warnings:"
echo "   - Users will see 'Not Secure' or similar warnings"
echo "   - Users need to click 'Advanced' → 'Proceed to site'"
echo "   - Consider distributing the certificate to client devices"
echo ""
echo "🎯 For Enterprise Use:"
echo "   - Consider creating a custom Certificate Authority (CA)"
echo "   - Distribute the CA certificate to all client devices"
echo "   - This eliminates browser warnings for internal users"
echo ""
echo "📁 To install certificate on client devices:"
echo "   - Windows: Double-click cert.pem → Install → Trusted Root CA"
echo "   - macOS: Double-click cert.pem → Add to Keychain → Always Trust"
echo "   - Linux: Copy to /usr/local/share/ca-certificates/ → update-ca-certificates"