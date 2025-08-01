# Docker Deployment Guide for Kumpels App

This guide covers how to dockerize and deploy the Kumpels App on an EC2 instance with Nginx web server.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx (80/443)│────│  Next.js App    │────│  PostgreSQL DB  │
│   (Web Server)  │    │   (Port 3000)   │    │   (External)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         └──────────────│   Redis Cache   │
                        │   (Port 6379)   │
                        └─────────────────┘
```

## 📋 Prerequisites

- Docker and Docker Compose installed
- Supabase project with PostgreSQL database
- Domain name (for production SSL)
- EC2 instance with Ubuntu 20.04+ (for production)

## 🚀 Quick Start (Local Development)

### 1. Clone and Setup

```bash
git clone <your-repo>
cd kumpels-appweb
```

### 2. Environment Configuration

```bash
# Copy example environment file
cp env.example .env

# Edit with your actual values
nano .env
```

Required environment variables:

**Supabase Database:**

- `DATABASE_URL`: Supabase PostgreSQL connection string
- `DIRECT_URL`: Direct Supabase PostgreSQL connection (for Prisma)

**NextAuth Authentication:**

- `NEXTAUTH_URL`: Your application URL (e.g., https://your-domain.com)
- `NEXTAUTH_SECRET`: Strong secret key (at least 32 characters)

**Supabase Configuration:**

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for admin operations)

**Email Service:**

- `RESEND_API_KEY`: Resend email service API key

### 3. Generate SSL Certificate (Development)

```bash
./scripts/generate-ssl.sh
```

### 4. Start the Application

```bash
# Start all services (with Supabase database)
docker-compose up -d

# Or start production configuration
docker-compose -f docker-compose.prod.yml up -d
```

### 5. Access the Application

- **HTTP**: http://localhost
- **HTTPS**: https://localhost (self-signed certificate)
- **Health Check**: http://localhost/health

## 🌐 Production Deployment on EC2

### 1. EC2 Instance Setup

Launch an EC2 instance with:

- **OS**: Ubuntu 20.04 LTS or newer
- **Type**: t3.medium or larger (recommended)
- **Storage**: 20GB+ EBS volume
- **Security Groups**: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

### 2. Automated Deployment

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Clone your repository
git clone <your-repo>
cd kumpels-appweb

# Run the deployment script
./deploy.sh
```

### 3. Manual Deployment Steps

If you prefer manual setup:

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Setup application
mkdir -p /opt/kumpels-app
cp -r . /opt/kumpels-app/
cd /opt/kumpels-app

# Configure environment with Supabase
cp env.example .env
nano .env  # Add your Supabase credentials

# Generate SSL certificate
./scripts/generate-ssl.sh

# Start application
docker-compose -f docker-compose.prod.yml up -d
```

### 4. SSL Certificate for Production

For production, replace the self-signed certificate:

```bash
# Using Let's Encrypt (recommended)
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Copy certificates to application
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /opt/kumpels-app/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /opt/kumpels-app/ssl/key.pem
sudo chown $USER:$USER /opt/kumpels-app/ssl/*

# Restart application
docker-compose -f docker-compose.prod.yml restart nginx
```

## 🔧 Configuration Files

### Docker Compose Files

- `docker-compose.yml`: Full stack with Supabase database
- `docker-compose.prod.yml`: Production setup with Supabase

### Nginx Configuration

- `nginx/nginx.conf`: Main Nginx configuration
- `nginx/conf.d/default.conf`: HTTPS server configuration
- `nginx/conf.d/http-only.conf`: HTTP-only configuration

### SSL Certificates

- `ssl/cert.pem`: SSL certificate
- `ssl/key.pem`: Private key

## 📊 Monitoring and Maintenance

### Health Checks

```bash
# Check application health
curl http://your-domain.com/health

# Check Docker containers
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Systemd Service

The deployment script creates a systemd service for auto-start:

```bash
# Service management
sudo systemctl status kumpels-app
sudo systemctl restart kumpels-app
sudo systemctl stop kumpels-app
```

### Updates

```bash
# Update application
cd /opt/kumpels-app
git pull
docker-compose -f docker-compose.prod.yml up -d --build

# Update SSL certificate (Let's Encrypt)
sudo certbot renew
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /opt/kumpels-app/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /opt/kumpels-app/ssl/key.pem
docker-compose -f docker-compose.prod.yml restart nginx
```

## 🔒 Security Considerations

### Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable
```

### Environment Variables

- Never commit `.env` files to version control
- Use strong, unique secrets for production
- Rotate secrets regularly
- Use AWS Secrets Manager or similar for production

### SSL/TLS

- Use Let's Encrypt for free SSL certificates
- Configure automatic renewal
- Use strong cipher suites
- Enable HSTS headers

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**

   ```bash
   sudo netstat -tulpn | grep :80
   sudo systemctl stop nginx  # Stop system nginx
   ```

2. **Database connection issues**

   ```bash
   # Check database connectivity
   docker-compose -f docker-compose.prod.yml exec app npx prisma db push

   # Verify Supabase connection
   docker-compose -f docker-compose.prod.yml exec app npx prisma db pull
   ```

3. **SSL certificate issues**

   ```bash
   # Check certificate validity
   openssl x509 -in ssl/cert.pem -text -noout
   ```

4. **Container won't start**
   ```bash
   # Check logs
   docker-compose -f docker-compose.prod.yml logs app
   ```

### Performance Optimization

1. **Enable Nginx caching**

   - Static files are already cached
   - Consider adding Redis for session storage

2. **Database optimization**

   - Supabase provides built-in connection pooling
   - Optimize Prisma queries
   - Use Supabase's read replicas for heavy read loads

3. **Monitoring**
   - Set up log aggregation
   - Monitor resource usage
   - Set up alerts for downtime

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Documentation](https://www.prisma.io/docs/)

## 🤝 Support

For issues specific to this deployment:

1. Check the troubleshooting section
2. Review Docker and Nginx logs
3. Verify environment configuration
4. Test Supabase database connectivity
