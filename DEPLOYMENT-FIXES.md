# Kumpels App Deployment Fixes

## Problem Description

Your EC2 instance is hanging during Docker build, specifically during the Next.js build process. This is a common issue with EC2 instances that have limited memory (typically t3.micro or t3.small instances).

## Root Causes

1. **Insufficient Memory**: Next.js builds require significant memory, especially for larger applications
2. **No Build Timeouts**: The original build process has no timeout protection
3. **No Memory Limits**: Docker containers can consume all available system memory
4. **No Error Recovery**: Build failures cause the entire system to hang

## Solutions Provided

### 1. Safe Deployment Script (`deploy-safe.sh`)

This script includes:

- **Resource checking** before deployment
- **Build timeouts** (30 minutes max)
- **Error handling** with automatic cleanup
- **Memory management** with Docker BuildKit
- **Progress monitoring** during builds
- **Automatic retry** with reduced memory if build fails

### 2. Optimized Dockerfile (`Dockerfile.optimized`)

Key improvements:

- **Memory limits** for Node.js build process
- **Build timeouts** for each step
- **Reduced memory fallback** if initial build fails
- **Better caching** with `--no-audit --no-fund` flags
- **Telemetry disabled** for better performance

### 3. Optimized Docker Compose (`docker-compose.optimized.yml`)

Features:

- **Resource limits** for all containers
- **Memory reservations** to prevent OOM kills
- **Better health checks** with longer start periods
- **Service dependencies** to ensure proper startup order

### 4. Swap Space Script (`add-swap.sh`)

Adds virtual memory to prevent OOM issues:

- **Automatic size detection** based on available disk space
- **Persistent configuration** across reboots
- **Optimized swappiness** settings

### 5. Troubleshooting Script (`troubleshoot.sh`)

Comprehensive diagnostic tool:

- **System resource monitoring**
- **Docker status checking**
- **Application health verification**
- **Network connectivity testing**
- **Common fix suggestions**

## Quick Fix Steps

### Step 1: Add Swap Space (Recommended)

```bash
./add-swap.sh
```

### Step 2: Use Safe Deployment

```bash
./deploy-safe.sh
```

### Step 3: If Issues Persist, Use Optimized Build

```bash
# Stop existing containers
docker-compose -f docker-compose.prod.yml down

# Clean Docker system
docker system prune -a -f

# Use optimized configuration
docker-compose -f docker-compose.optimized.yml build --no-cache
docker-compose -f docker-compose.optimized.yml up -d
```

## Troubleshooting

### If Build Still Hangs

1. **Check system resources**:

   ```bash
   ./troubleshoot.sh resources
   ```

2. **Add more swap space**:

   ```bash
   ./add-swap.sh
   ```

3. **Clean Docker completely**:

   ```bash
   docker system prune -a -f
   docker builder prune -f
   ```

4. **Use minimal build**:
   ```bash
   # Edit Dockerfile.optimized to use even less memory
   # Change --max-old-space-size=2048 to --max-old-space-size=512
   ```

### If Application Won't Start

1. **Check container logs**:

   ```bash
   docker-compose -f docker-compose.prod.yml logs
   ```

2. **Verify environment variables**:

   ```bash
   ./troubleshoot.sh app
   ```

3. **Check Docker daemon**:
   ```bash
   sudo systemctl restart docker
   ```

### If Application is Unreachable

1. **Check firewall**:

   ```bash
   ./troubleshoot.sh firewall
   ```

2. **Verify nginx configuration**:

   ```bash
   docker-compose -f docker-compose.prod.yml logs nginx
   ```

3. **Test health endpoint**:
   ```bash
   curl http://localhost/health
   ```

## EC2 Instance Recommendations

### Minimum Requirements

- **Instance Type**: t3.medium (2 vCPU, 4GB RAM)
- **Storage**: 20GB+ available space
- **Network**: Standard bandwidth

### Recommended Configuration

- **Instance Type**: t3.large (2 vCPU, 8GB RAM)
- **Storage**: 50GB+ available space
- **Network**: Enhanced bandwidth

### For Production

- **Instance Type**: t3.xlarge or c5.large
- **Storage**: 100GB+ available space
- **Load Balancer**: Application Load Balancer
- **Auto Scaling**: Based on CPU/memory usage

## Performance Optimization

### Memory Optimization

1. **Add swap space** (2-4GB recommended)
2. **Set Node.js memory limits** in Dockerfile
3. **Use resource limits** in docker-compose
4. **Enable Docker BuildKit** for better caching

### Build Optimization

1. **Use multi-stage builds** (already implemented)
2. **Cache dependencies** separately
3. **Use .dockerignore** to exclude unnecessary files
4. **Build with --no-cache** only when necessary

### Runtime Optimization

1. **Use standalone output** (already configured)
2. **Enable gzip compression** in nginx
3. **Use Redis for caching** (optional)
4. **Monitor resource usage** with htop

## Monitoring and Maintenance

### Regular Checks

```bash
# Check system resources
./troubleshoot.sh resources

# Monitor application health
curl http://localhost/health

# View recent logs
docker-compose -f docker-compose.prod.yml logs --tail=50
```

### Automated Monitoring

```bash
# Set up log rotation
sudo logrotate -f /etc/logrotate.conf

# Monitor disk space
df -h

# Check memory usage
free -h
```

### Backup Strategy

1. **Database backups** (Supabase handles this)
2. **Application code** (Git repository)
3. **Environment configuration** (backup .env file)
4. **SSL certificates** (backup ssl/ directory)

## Emergency Recovery

### If EC2 Instance Becomes Unresponsive

1. **Force reboot** from AWS Console
2. **Check system logs** after reboot:

   ```bash
   sudo journalctl -b -f
   ```

3. **Restart services**:
   ```bash
   sudo systemctl start docker
   cd /opt/kumpels-app
   docker-compose -f docker-compose.prod.yml up -d
   ```

### If Application Data is Lost

1. **Restore from Git**:

   ```bash
   cd /opt/kumpels-app
   git fetch origin
   git reset --hard origin/main
   ```

2. **Recreate environment**:

   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Rebuild application**:
   ```bash
   ./deploy-safe.sh
   ```

## Support

If you continue to experience issues:

1. **Run full diagnostics**:

   ```bash
   ./troubleshoot.sh all
   ```

2. **Check AWS CloudWatch** logs for system-level issues

3. **Review Docker logs** for application-specific errors

4. **Consider upgrading** EC2 instance size if resource constraints persist

## Files Created

- `deploy-safe.sh` - Safe deployment script with error handling
- `Dockerfile.optimized` - Memory-optimized Dockerfile
- `docker-compose.optimized.yml` - Resource-limited compose file
- `add-swap.sh` - Swap space configuration script
- `troubleshoot.sh` - Comprehensive troubleshooting tool
- `DEPLOYMENT-FIXES.md` - This documentation

All scripts are executable and ready to use immediately.
