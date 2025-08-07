# Enhanced Deployment Guide

This guide covers the enhanced DevOps setup for the Kumpels App with improved SSL certificate management, cleaned up dependencies, and optimized deployment process.

## 🚀 Quick Deployment

### Development Deployment
```bash
./deploy.sh
```

### Production Deployment with Let's Encrypt SSL
```bash
SSL_MODE=letsencrypt SSL_EMAIL=admin@yourdomain.com DOMAIN=yourdomain.com ./deploy.sh
```

## 🔧 What's New

### ✅ Enhancements Made
1. **Removed Redis dependency** - Cleaned up unnecessary Redis containers and volumes from all Docker Compose files
2. **Enhanced SSL certificate generation** - Supports both self-signed (development) and Let's Encrypt (production)
3. **Improved Nginx security** - Enhanced SSL configuration with modern ciphers and security headers
4. **Optimized Docker setup** - Better .dockerignore, removed unused services
5. **Automated SSL renewal** - Let's Encrypt certificates auto-renew with proper logging
6. **Enhanced monitoring** - Cleaned up monitoring to focus on essential services only

### 🔐 SSL Certificate Options

#### Self-Signed (Development)
- Automatically generated for localhost
- Suitable for development and testing
- Browsers will show security warnings

#### Let's Encrypt (Production)
- Free, automated, and renewable certificates
- Trusted by all major browsers
- Automatic renewal every 90 days

## 📋 Deployment Modes

### 1. Development Mode (Default)
```bash
./deploy.sh
```
- Uses self-signed SSL certificate
- Suitable for local development and testing

### 2. Production Mode with Custom Domain
```bash
SSL_MODE=letsencrypt SSL_EMAIL=admin@example.com DOMAIN=example.com ./deploy.sh
```
- Generates Let's Encrypt SSL certificate
- Sets up automatic renewal
- Configures production-ready security headers

## 🛠️ Management Scripts

### SSL Certificate Management
```bash
# Generate self-signed certificate
./scripts/generate-ssl.sh self-signed yourdomain.com

# Generate Let's Encrypt certificate
./scripts/generate-ssl.sh letsencrypt yourdomain.com admin@yourdomain.com
```

### Deployment Cleanup
```bash
# Clean Docker resources
./scripts/cleanup-deployment.sh --docker-cleanup

# Clean logs
./scripts/cleanup-deployment.sh --logs-cleanup

# Full cleanup
./scripts/cleanup-deployment.sh --full-cleanup
```

### Application Monitoring
```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f

# Check service status
sudo systemctl status kumpels-app

# Manual monitoring check
/opt/kumpels-app/monitor.sh
```

## 🔒 Security Features

### SSL/TLS Security
- TLS 1.2 and 1.3 support
- Modern cipher suites
- OCSP stapling for Let's Encrypt certificates
- Perfect Forward Secrecy

### HTTP Security Headers
- Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

### Rate Limiting
- API endpoints: 10 requests/second
- Authentication endpoints: 1 request/second

## 📊 Monitoring & Maintenance

### Automatic Services
- **Application restart**: Containers restart automatically on failure
- **SSL renewal**: Let's Encrypt certificates renew automatically
- **Health monitoring**: Services monitored every 2 minutes
- **Log rotation**: Logs rotated daily, kept for 7 days

### Manual Maintenance
- Run cleanup script weekly: `./scripts/cleanup-deployment.sh --full-cleanup`
- Monitor disk usage: `df -h`
- Check Docker resources: `docker system df`

## 🌐 Network Configuration

### Ports
- **80**: HTTP (redirects to HTTPS)
- **443**: HTTPS (main application)
- **3000**: Next.js app (internal only)

### Firewall
- SSH (22), HTTP (80), and HTTPS (443) ports allowed
- UFW firewall automatically configured

## 📁 File Structure

```
/opt/kumpels-app/
├── ssl/                    # SSL certificates
├── nginx/                  # Nginx configuration
├── scripts/               # Deployment and management scripts
├── monitor.log            # Application monitoring logs
└── docker-compose.prod.yml # Production Docker setup
```

## 🔄 SSL Certificate Renewal

### Automatic Renewal (Let's Encrypt)
- Runs twice daily (2 AM and 2 PM)
- Logs to `/var/log/ssl-renewal.log`
- Automatically restarts services with new certificates

### Manual Renewal
```bash
# Check certificate status
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# Test renewal process
sudo certbot renew --dry-run
```

## 🚨 Troubleshooting

### Common Issues

1. **SSL certificate generation fails**
   ```bash
   # Check if ports 80/443 are available
   sudo netstat -tlnp | grep :80
   sudo netstat -tlnp | grep :443
   ```

2. **Docker permission errors**
   ```bash
   # Add user to docker group
   sudo usermod -aG docker $USER
   # Logout and login again
   ```

3. **Let's Encrypt rate limits**
   - Let's Encrypt has rate limits (5 certificates per domain per week)
   - Use staging environment for testing: `--staging` flag

### Logs and Debugging
```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs -f app

# Nginx logs
docker-compose -f docker-compose.prod.yml logs -f nginx

# System logs
sudo journalctl -u kumpels-app -f

# SSL renewal logs
tail -f /var/log/ssl-renewal.log
```

## 🎯 Performance Optimizations

### Docker Optimizations
- Multi-stage build process
- Optimized .dockerignore file
- Resource limits configured
- Health checks for all services

### Nginx Optimizations
- Gzip compression enabled
- Static file caching
- Connection keep-alive
- HTTP/2 support

### Security Optimizations
- Non-root user in containers
- Read-only volumes where possible
- Security headers configured
- Rate limiting enabled

---

## 📞 Support

For issues or questions about the deployment:
1. Check the logs using the commands above
2. Run the cleanup script if experiencing resource issues
3. Verify SSL certificate status for HTTPS issues
4. Check systemd service status for auto-restart issues