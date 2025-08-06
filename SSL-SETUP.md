# SSL Certificate Setup and Management

This document explains how to set up and manage SSL certificates for the Kumpels App using the provided scripts.

## Overview

The SSL setup consists of two main scripts:

- `generate-ssl.sh` - Generates SSL certificates (self-signed or Let's Encrypt)
- `renew-ssl.sh` - Automatically renews Let's Encrypt certificates

## Prerequisites

### Required Software

- **OpenSSL** - For certificate generation and validation
- **Docker & Docker Compose** - For running the application
- **certbot** - For Let's Encrypt certificates (optional, for production)

### Installation

#### macOS

```bash
# Install OpenSSL (if not already installed)
brew install openssl

# Install certbot for Let's Encrypt
brew install certbot
```

#### Ubuntu/Debian

```bash
# Install OpenSSL
sudo apt-get update
sudo apt-get install openssl

# Install certbot for Let's Encrypt
sudo apt-get install certbot
```

#### Using Docker for certbot (alternative)

```bash
# Use certbot via Docker instead of installing locally
docker run --rm -it certbot/certbot certonly --standalone
```

## Quick Start

### 1. Generate Self-Signed Certificate (Development)

For local development or testing:

```bash
# Generate self-signed certificate for localhost
./generate-ssl.sh

# Or specify a custom domain
./generate-ssl.sh localhost self-signed admin@localhost 365
```

### 2. Fix Permission Issues (If Needed)

If you encounter permission issues with Let's Encrypt:

```bash
# Run the permission fix script to diagnose and resolve issues
./fix-ssl-permissions.sh yourdomain.com
```

### 2. Generate Let's Encrypt Certificate (Production)

For production environments with a real domain:

```bash
# Generate Let's Encrypt certificate
./generate-ssl.sh example.com letsencrypt admin@example.com
```

### 3. Start the Application

```bash
# Start all containers with SSL enabled
docker-compose up -d
```

### 4. Access the Application

- **Development**: https://localhost
- **Production**: https://your-domain.com

## Script Usage

### generate-ssl.sh

Generates SSL certificates for your domain.

```bash
./generate-ssl.sh [DOMAIN] [CERT_TYPE] [EMAIL] [DAYS_VALID]
```

#### Parameters

- `DOMAIN` - Domain name for the certificate (default: localhost)
- `CERT_TYPE` - Certificate type: `self-signed` or `letsencrypt` (default: self-signed)
- `EMAIL` - Email address for Let's Encrypt (default: admin@DOMAIN)
- `DAYS_VALID` - Days valid for self-signed certificate (default: 365)

#### Examples

```bash
# Self-signed for localhost (development)
./generate-ssl.sh

# Self-signed for custom domain
./generate-ssl.sh dev.example.com self-signed

# Let's Encrypt for production
./generate-ssl.sh example.com letsencrypt admin@example.com

# Self-signed with custom validity period
./generate-ssl.sh localhost self-signed admin@localhost 30
```

### renew-ssl.sh

Checks and renews Let's Encrypt certificates.

```bash
./renew-ssl.sh [DOMAIN]
```

#### Parameters

- `DOMAIN` - Domain name for the certificate (default: localhost)

#### Examples

```bash
# Check and renew certificate for localhost
./renew-ssl.sh

# Check and renew certificate for specific domain
./renew-ssl.sh example.com
```

### fix-ssl-permissions.sh

Diagnoses and helps resolve SSL certificate permission issues.

```bash
./fix-ssl-permissions.sh [DOMAIN]
```

#### Parameters

- `DOMAIN` - Domain name to check (default: localhost)

#### Examples

```bash
# Check permissions for localhost
./fix-ssl-permissions.sh

# Check permissions for specific domain
./fix-ssl-permissions.sh example.com
```

#### What it does:

1. Checks current user permissions
2. Verifies port 80 availability
3. Stops conflicting services
4. Tests Docker certbot availability
5. Provides alternative solutions

## Certificate Types

### Self-Signed Certificates

**Use Case**: Development, testing, internal applications

**Pros**:

- No external dependencies
- Works offline
- No rate limits
- Immediate generation

**Cons**:

- Browser security warnings
- Not trusted by browsers
- Manual installation required for some clients

**Generation**:

```bash
./generate-ssl.sh localhost self-signed
```

### Let's Encrypt Certificates

**Use Case**: Production environments, public-facing applications

**Pros**:

- Free and trusted by browsers
- Automatic renewal possible
- Industry standard

**Cons**:

- Requires public domain
- Rate limits apply
- Requires internet connectivity for validation

**Generation**:

```bash
./generate-ssl.sh example.com letsencrypt admin@example.com
```

## File Structure

After running the scripts, the following structure will be created:

```
kumpels-appweb/
├── ssl/
│   ├── cert.pem          # SSL certificate
│   └── key.pem           # Private key
├── letsencrypt/          # Let's Encrypt configuration (if used)
├── acme-challenge/       # ACME challenge files (if used)
├── generate-ssl.sh       # Certificate generation script
├── renew-ssl.sh          # Certificate renewal script
└── docker-compose.yml    # Docker configuration
```

## Docker Integration

The SSL certificates are automatically mounted into the NGINX container:

```yaml
# From docker-compose.yml
volumes:
  - ./ssl:/etc/nginx/ssl:ro
```

The NGINX configuration expects certificates at:

- Certificate: `/etc/nginx/ssl/cert.pem`
- Private Key: `/etc/nginx/ssl/key.pem`

## Security Considerations

### File Permissions

- Private keys are automatically set to `600` (owner read/write only)
- Certificates are set to `644` (owner read/write, group/others read)

### Certificate Validation

The scripts automatically validate:

- Certificate and private key match
- Certificate format is correct
- Certificate is not expired

### Production Best Practices

1. **Use Let's Encrypt** for production environments
2. **Set up automatic renewal** using cron jobs
3. **Monitor certificate expiry** dates
4. **Use strong private keys** (2048-bit RSA minimum)
5. **Keep private keys secure** and never commit them to version control

## Automatic Renewal

### Setting up Cron Job

For automatic Let's Encrypt certificate renewal:

```bash
# Edit crontab
crontab -e

# Add this line to run renewal check daily at 2 AM
0 2 * * * cd /path/to/kumpels-appweb && ./renew-ssl.sh example.com
```

### Manual Renewal Check

```bash
# Check if renewal is needed
./renew-ssl.sh example.com
```

## Troubleshooting

### Common Issues

#### 1. Certificate Not Found

```
[ERROR] Certificate not found at ./ssl/cert.pem
```

**Solution**: Run `./generate-ssl.sh` to create the certificate.

#### 2. Certificate and Key Mismatch

```
[ERROR] Certificate and private key do not match!
```

**Solution**: Delete the SSL directory and regenerate:

```bash
rm -rf ssl/
./generate-ssl.sh
```

#### 3. Let's Encrypt Rate Limits

```
[ERROR] Too many requests
```

**Solution**: Wait for rate limit to reset (usually 1 hour) or use staging environment for testing.

#### 4. Domain Not Accessible

```
[WARNING] Domain example.com might not be accessible
```

**Solution**: Ensure DNS is properly configured and domain points to your server.

#### 5. Port 80 Already in Use

```
[ERROR] Port 80 is already in use
```

**Solution**: Stop other web servers or use a different port for certbot.

#### 6. Permission Denied for Port 80 Binding

```
Could not bind TCP port 80 because you don't have the appropriate permissions
```

**Solutions**:

- **Use Docker method** (Recommended): The script will automatically use Docker certbot if available
- **Run with sudo**: `sudo ./generate-ssl.sh example.com letsencrypt admin@example.com`
- **Use self-signed certificate**: `./generate-ssl.sh example.com self-signed`
- **Run the permission fix script**: `./fix-ssl-permissions.sh example.com`

### Debugging Commands

```bash
# Check certificate details
openssl x509 -in ssl/cert.pem -text -noout

# Check certificate expiry
openssl x509 -enddate -noout -in ssl/cert.pem

# Verify certificate and key match
openssl x509 -noout -modulus -in ssl/cert.pem | openssl md5
openssl rsa -noout -modulus -in ssl/key.pem | openssl md5

# Test NGINX configuration
docker-compose exec nginx nginx -t

# Check NGINX logs
docker-compose logs nginx
```

## Environment-Specific Setup

### Development Environment

```bash
# Generate self-signed certificate
./generate-ssl.sh localhost self-signed

# Start containers
docker-compose up -d

# Access at https://localhost (accept security warning)
```

### Staging Environment

```bash
# Generate Let's Encrypt certificate with staging server
./generate-ssl.sh staging.example.com letsencrypt admin@example.com

# Start containers
docker-compose up -d
```

### Production Environment

```bash
# Generate Let's Encrypt certificate
./generate-ssl.sh example.com letsencrypt admin@example.com

# Set up automatic renewal
crontab -e
# Add: 0 2 * * * cd /path/to/kumpels-appweb && ./renew-ssl.sh example.com

# Start containers
docker-compose up -d
```

## Backup and Recovery

### Backup Certificates

```bash
# Create backup
tar -czf ssl-backup-$(date +%Y%m%d).tar.gz ssl/ letsencrypt/

# Restore from backup
tar -xzf ssl-backup-YYYYMMDD.tar.gz
```

### Emergency Recovery

If certificates are lost or corrupted:

```bash
# Remove existing certificates
rm -rf ssl/ letsencrypt/

# Regenerate certificates
./generate-ssl.sh example.com letsencrypt admin@example.com

# Restart containers
docker-compose down && docker-compose up -d
```

## Support

For issues with SSL setup:

1. Check the troubleshooting section above
2. Review NGINX logs: `docker-compose logs nginx`
3. Verify certificate validity: `openssl x509 -in ssl/cert.pem -text -noout`
4. Check Docker container status: `docker-compose ps`
