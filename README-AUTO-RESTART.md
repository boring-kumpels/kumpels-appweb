# Kumpels App Auto-Restart & Monitoring System

This document explains the comprehensive auto-restart and monitoring system implemented for the Kumpels App to ensure high availability and automatic recovery from crashes.

## 🚀 Overview

The auto-restart system provides multiple layers of protection to ensure your application stays running:

1. **Docker Container Level**: `restart: unless-stopped` policy
2. **Systemd Service Level**: Automatic restart with 10-second delay
3. **Monitoring Service**: Health checks every 2 minutes
4. **Nginx Auto-Restart**: Systemd override for nginx service

## 🔧 Auto-Restart Features

### 1. Docker Container Auto-Restart

All containers in `docker-compose.prod.yml` are configured with:

```yaml
restart: unless-stopped
```

This ensures containers automatically restart if they crash, unless manually stopped.

### 2. Systemd Service Auto-Restart

The `kumpels-app.service` is configured with:

```ini
Restart=always
RestartSec=10
```

This provides system-level restart protection with a 10-second delay between attempts.

### 3. Nginx Auto-Restart

Nginx service is configured with systemd override:

```ini
Restart=always
RestartSec=10
```

This ensures nginx automatically restarts if it crashes.

## 📊 Monitoring System

### Automatic Monitoring Service

A dedicated monitoring service runs every 2 minutes to check:

- **Container Health**: Docker health checks for all services
- **HTTP Endpoints**: Application and nginx health endpoints
- **System Resources**: Memory, disk, and CPU usage
- **Service Status**: All running containers

### Health Checks

The monitoring system performs multiple types of health checks:

1. **Docker Health Checks**: Built-in container health monitoring
2. **HTTP Health Checks**:
   - App: `http://localhost/api/health`
   - Nginx: `http://localhost/health`
3. **Container Status**: Ensures all containers are running
4. **System Resources**: Monitors memory and disk usage

### Restart Protection

The monitoring system includes restart protection to prevent restart loops:

- **Cooldown Period**: 5-minute cooldown between restarts of the same service
- **Retry Limits**: Maximum 3 restart attempts per service
- **Logging**: All restart attempts are logged with timestamps

## 🛠️ Management Scripts

### 1. Status Check Script (`scripts/check-status.sh`)

Quick status check for all services:

```bash
# Full status check
./scripts/check-status.sh

# Quick status check (containers only)
./scripts/check-status.sh --quick

# Show help
./scripts/check-status.sh --help
```

**Features:**

- Colored output for easy reading
- System resource monitoring
- Container status overview
- HTTP endpoint health checks
- Systemd service status
- Recent monitoring logs

### 2. Monitoring Script (`scripts/monitor-app.sh`)

Standalone monitoring script:

```bash
# Run continuous monitoring
./scripts/monitor-app.sh

# Run once and exit
./scripts/monitor-app.sh --once

# Show current status only
./scripts/monitor-app.sh --status

# Show help
./scripts/monitor-app.sh --help
```

**Features:**

- Continuous monitoring with configurable intervals
- Automatic service restart on failure
- Restart cooldown protection
- System resource monitoring
- Log rotation and cleanup
- Multiple health check methods

### 3. Restart Script (`scripts/restart-app.sh`)

Manual restart script for intervention:

```bash
# Restart specific service
./scripts/restart-app.sh app
./scripts/restart-app.sh nginx
./scripts/restart-app.sh redis

# Restart all services
./scripts/restart-app.sh all

# Restart systemd service
./scripts/restart-app.sh systemd

# Check status
./scripts/restart-app.sh status

# Show logs
./scripts/restart-app.sh logs app
./scripts/restart-app.sh logs nginx 100

# Show help
./scripts/restart-app.sh help
```

**Features:**

- Individual service restart
- Full application restart
- Systemd service restart
- Status checking
- Log viewing
- Colored output

## 📋 Systemd Services

### 1. kumpels-app.service

Main application service:

```ini
[Unit]
Description=Kumpels App Docker Compose
Requires=docker.service
After=docker.service
StartLimitIntervalSec=0

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/kumpels-app
EnvironmentFile=/opt/kumpels-app/.env
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
ExecReload=/usr/local/bin/docker-compose -f docker-compose.prod.yml restart
TimeoutStartSec=0
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 2. kumpels-monitor.service

Monitoring service:

```ini
[Unit]
Description=Kumpels App Monitoring Service
After=kumpels-app.service
Wants=kumpels-app.service

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/kumpels-app
ExecStart=/opt/kumpels-app/monitor.sh
Restart=always
RestartSec=60
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### 3. kumpels-monitor.timer

Timer for periodic monitoring:

```ini
[Unit]
Description=Run Kumpels App monitoring every 2 minutes
Requires=kumpels-monitor.service

[Timer]
Unit=kumpels-monitor.service
OnCalendar=*:0/2
Persistent=true

[Install]
WantedBy=timers.target
```

## 📝 Logging

### Monitoring Logs

Location: `/opt/kumpels-app/monitor.log`

Log rotation is configured to:

- Rotate daily
- Keep 7 days of logs
- Compress old logs
- Limit file size to prevent disk issues

### Systemd Logs

View logs using journalctl:

```bash
# View kumpels-app service logs
sudo journalctl -u kumpels-app.service -f

# View monitoring service logs
sudo journalctl -u kumpels-monitor.service -f

# View timer logs
sudo journalctl -u kumpels-monitor.timer -f
```

## 🔍 Troubleshooting

### Common Issues

1. **Service Not Starting**

   ```bash
   # Check service status
   sudo systemctl status kumpels-app.service

   # Check logs
   sudo journalctl -u kumpels-app.service -n 50

   # Manual restart
   ./scripts/restart-app.sh systemd
   ```

2. **Monitoring Not Working**

   ```bash
   # Check monitoring timer
   sudo systemctl status kumpels-monitor.timer

   # Run monitoring manually
   ./scripts/monitor-app.sh --once

   # Check monitoring logs
   tail -f /opt/kumpels-app/monitor.log
   ```

3. **Container Health Issues**

   ```bash
   # Check container status
   ./scripts/check-status.sh --quick

   # View container logs
   ./scripts/restart-app.sh logs app

   # Restart specific service
   ./scripts/restart-app.sh app
   ```

### Manual Recovery

If automatic recovery fails:

1. **Check all services**:

   ```bash
   ./scripts/check-status.sh
   ```

2. **Restart all services**:

   ```bash
   ./scripts/restart-app.sh all
   ```

3. **Check system resources**:

   ```bash
   htop
   df -h
   free -h
   ```

4. **View recent logs**:
   ```bash
   tail -f /opt/kumpels-app/monitor.log
   sudo journalctl -u kumpels-app.service -f
   ```

## 🚀 Deployment

The auto-restart system is automatically configured when you run the deployment script:

```bash
./deploy.sh
```

This will:

- Install monitoring tools (htop, jq)
- Create monitoring scripts
- Configure systemd services
- Set up log rotation
- Enable automatic restart policies

## 📊 Monitoring Dashboard

For a quick overview of your system status:

```bash
# Quick status check
./scripts/check-status.sh --quick

# Full system overview
./scripts/check-status.sh
```

The status check provides:

- ✅ Green: Healthy services
- ⚠️ Yellow: Warnings (high resource usage)
- ❌ Red: Failed services
- ℹ️ Blue: Information

## 🔄 Maintenance

### Regular Maintenance Tasks

1. **Check monitoring logs weekly**:

   ```bash
   tail -n 100 /opt/kumpels-app/monitor.log
   ```

2. **Verify systemd services monthly**:

   ```bash
   sudo systemctl status kumpels-app.service
   sudo systemctl status kumpels-monitor.timer
   ```

3. **Review system resources**:
   ```bash
   ./scripts/check-status.sh
   ```

### Updating the System

To update the monitoring system:

1. Pull latest changes
2. Re-run deployment script
3. Restart monitoring services:
   ```bash
   sudo systemctl restart kumpels-monitor.timer
   ```

## 🛡️ Security Considerations

- Monitoring scripts run with user permissions
- Systemd services use proper isolation
- Log files are rotated to prevent disk issues
- Restart cooldowns prevent resource exhaustion
- Health checks use safe HTTP endpoints

## 📞 Support

If you encounter issues with the auto-restart system:

1. Check the troubleshooting section above
2. Review monitoring logs: `/opt/kumpels-app/monitor.log`
3. Use status check script: `./scripts/check-status.sh`
4. Check systemd logs: `sudo journalctl -u kumpels-app.service`

The system is designed to be self-healing, but manual intervention may be needed for complex issues.
