#!/bin/bash

# Kumpels App Monitoring Script
# This script monitors the application and restarts services if needed
# Run this script manually or set it up as a cron job/systemd timer

set -e

# Configuration
LOG_FILE="/opt/kumpels-app/monitor.log"
DOCKER_COMPOSE_CMD="docker-compose"
APP_DIR="/opt/kumpels-app"
HEALTH_CHECK_INTERVAL=120  # 2 minutes
MAX_RESTART_ATTEMPTS=3
RESTART_COOLDOWN=300  # 5 minutes

# Function to log messages with timestamp
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to check if we're in the right directory
check_environment() {
    if [ ! -f "$APP_DIR/docker-compose.prod.yml" ]; then
        log_message "ERROR: docker-compose.prod.yml not found in $APP_DIR"
        exit 1
    fi
    
    cd "$APP_DIR"
}

# Function to check if a service is healthy using Docker health checks
check_service_health() {
    local service_name=$1
    local health_status
    
    if ! command -v jq &> /dev/null; then
        log_message "WARNING: jq not installed, using basic health check"
        # Fallback to basic container status check
        if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$service_name.*Up"; then
            return 0
        else
            return 1
        fi
    fi
    
    health_status=$($DOCKER_COMPOSE_CMD -f docker-compose.prod.yml ps --format json 2>/dev/null | jq -r ".[] | select(.Service==\"$service_name\") | .Health" 2>/dev/null || echo "unknown")
    
    if [ "$health_status" = "healthy" ]; then
        return 0
    else
        return 1
    fi
}

# Function to check application health via HTTP
check_app_http() {
    local max_retries=3
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if curl -f -s --connect-timeout 10 --max-time 30 http://localhost/api/health > /dev/null 2>&1; then
            return 0
        fi
        retry_count=$((retry_count + 1))
        sleep 2
    done
    
    return 1
}

# Function to check nginx health via HTTP
check_nginx_http() {
    local max_retries=3
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if curl -f -s --connect-timeout 10 --max-time 30 http://localhost/health > /dev/null 2>&1; then
            return 0
        fi
        retry_count=$((retry_count + 1))
        sleep 2
    done
    
    return 1
}

# Function to restart a service with cooldown protection
restart_service() {
    local service_name=$1
    local restart_file="/tmp/kumpels_${service_name}_restart_time"
    local current_time=$(date +%s)
    
    # Check if we've restarted this service recently
    if [ -f "$restart_file" ]; then
        local last_restart=$(cat "$restart_file")
        local time_since_restart=$((current_time - last_restart))
        
        if [ $time_since_restart -lt $RESTART_COOLDOWN ]; then
            log_message "WARNING: $service_name was restarted recently, skipping restart"
            return 0
        fi
    fi
    
    log_message "Restarting $service_name service..."
    
    # Record restart time
    echo "$current_time" > "$restart_file"
    
    # Restart the service
    if $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml restart "$service_name" > /dev/null 2>&1; then
        log_message "Successfully restarted $service_name"
        sleep 30  # Wait for service to stabilize
        return 0
    else
        log_message "ERROR: Failed to restart $service_name"
        return 1
    fi
}

# Function to check if containers are running
check_containers_running() {
    local running_containers=$($DOCKER_COMPOSE_CMD -f docker-compose.prod.yml ps -q 2>/dev/null | wc -l)
    
    if [ "$running_containers" -eq 0 ]; then
        log_message "ERROR: No containers are running. Starting all services..."
        if $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml up -d > /dev/null 2>&1; then
            log_message "Successfully started all services"
            sleep 60  # Wait for services to start
            return 0
        else
            log_message "ERROR: Failed to start services"
            return 1
        fi
    fi
    
    return 0
}

# Function to check system resources
check_system_resources() {
    local memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if (( $(echo "$memory_usage > 90" | bc -l) )); then
        log_message "WARNING: High memory usage: ${memory_usage}%"
    fi
    
    if [ "$disk_usage" -gt 90 ]; then
        log_message "WARNING: High disk usage: ${disk_usage}%"
    fi
}

# Function to clean up old logs
cleanup_old_logs() {
    local log_size=$(du -m "$LOG_FILE" 2>/dev/null | cut -f1 || echo "0")
    
    if [ "$log_size" -gt 100 ]; then  # If log file is larger than 100MB
        log_message "Cleaning up old log entries..."
        tail -n 1000 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
    fi
}

# Main monitoring logic
main() {
    log_message "Starting monitoring cycle..."
    
    # Check environment
    check_environment
    
    # Clean up old logs if needed
    cleanup_old_logs
    
    # Check system resources
    check_system_resources
    
    # Check if containers are running
    if ! check_containers_running; then
        log_message "ERROR: Failed to ensure containers are running"
        exit 1
    fi
    
    # Check app service health
    if ! check_service_health "app"; then
        log_message "WARNING: App service is not healthy"
        restart_service "app"
    fi
    
    # Check nginx service health
    if ! check_service_health "nginx"; then
        log_message "WARNING: Nginx service is not healthy"
        restart_service "nginx"
    fi
    
    # Check HTTP health endpoints
    if ! check_app_http; then
        log_message "WARNING: App HTTP health check failed"
        restart_service "app"
    fi
    
    if ! check_nginx_http; then
        log_message "WARNING: Nginx HTTP health check failed"
        restart_service "nginx"
    fi
    
    # Check Redis service health (if present)
    if check_service_health "redis" 2>/dev/null; then
        if ! check_service_health "redis"; then
            log_message "WARNING: Redis service is not healthy"
            restart_service "redis"
        fi
    fi
    
    log_message "Monitoring cycle completed successfully"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --once         Run monitoring once and exit"
        echo "  --continuous   Run monitoring continuously (default)"
        echo "  --status       Show current status only"
        echo ""
        echo "Examples:"
        echo "  $0              # Run continuous monitoring"
        echo "  $0 --once       # Run once and exit"
        echo "  $0 --status     # Show status only"
        exit 0
        ;;
    --once)
        main
        exit 0
        ;;
    --status)
        check_environment
        echo "=== Kumpels App Status ==="
        echo "Containers:"
        $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml ps
        echo ""
        echo "Health Checks:"
        echo "App HTTP: $(check_app_http && echo "OK" || echo "FAILED")"
        echo "Nginx HTTP: $(check_nginx_http && echo "OK" || echo "FAILED")"
        echo "App Service: $(check_service_health "app" && echo "OK" || echo "FAILED")"
        echo "Nginx Service: $(check_service_health "nginx" && echo "OK" || echo "FAILED")"
        exit 0
        ;;
    --continuous|"")
        # Run continuously
        while true; do
            main
            sleep $HEALTH_CHECK_INTERVAL
        done
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac 