#!/bin/bash

# Kumpels App Status Check Script
# Quick script to check the status of all services

set -e

APP_DIR="/opt/kumpels-app"
DOCKER_COMPOSE_CMD="docker-compose"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    
    case $status in
        "OK")
            echo -e "${GREEN}✓ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠ $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}✗ $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ $message${NC}"
            ;;
    esac
}

# Function to check if a service is healthy
check_service_health() {
    local service_name=$1
    
    if ! command -v jq &> /dev/null; then
        # Fallback to basic container status check
        if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$service_name.*Up"; then
            return 0
        else
            return 1
        fi
    fi
    
    local health_status=$($DOCKER_COMPOSE_CMD -f docker-compose.prod.yml ps --format json 2>/dev/null | jq -r ".[] | select(.Service==\"$service_name\") | .Health" 2>/dev/null || echo "unknown")
    
    if [ "$health_status" = "healthy" ]; then
        return 0
    else
        return 1
    fi
}

# Function to check HTTP endpoint
check_http_endpoint() {
    local url=$1
    local description=$2
    
    if curl -f -s --connect-timeout 5 --max-time 10 "$url" > /dev/null 2>&1; then
        print_status "OK" "$description"
        return 0
    else
        print_status "ERROR" "$description"
        return 1
    fi
}

# Function to check system resources
check_system_resources() {
    echo -e "\n${BLUE}=== System Resources ===${NC}"
    
    # Memory usage
    local memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    if (( $(echo "$memory_usage > 90" | bc -l 2>/dev/null || echo "0") )); then
        print_status "WARNING" "Memory usage: ${memory_usage}%"
    else
        print_status "OK" "Memory usage: ${memory_usage}%"
    fi
    
    # Disk usage
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        print_status "WARNING" "Disk usage: ${disk_usage}%"
    else
        print_status "OK" "Disk usage: ${disk_usage}%"
    fi
    
    # Load average
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_cores=$(nproc)
    local load_per_core=$(echo "scale=2; $load_avg / $cpu_cores" | bc 2>/dev/null || echo "0")
    
    if (( $(echo "$load_per_core > 1.0" | bc -l 2>/dev/null || echo "0") )); then
        print_status "WARNING" "Load average: $load_avg (${load_per_core} per core)"
    else
        print_status "OK" "Load average: $load_avg (${load_per_core} per core)"
    fi
}

# Function to check Docker status
check_docker_status() {
    echo -e "\n${BLUE}=== Docker Status ===${NC}"
    
    if ! docker info > /dev/null 2>&1; then
        print_status "ERROR" "Docker daemon is not running"
        return 1
    else
        print_status "OK" "Docker daemon is running"
    fi
    
    if [ ! -f "$APP_DIR/docker-compose.prod.yml" ]; then
        print_status "ERROR" "docker-compose.prod.yml not found"
        return 1
    else
        print_status "OK" "docker-compose.prod.yml found"
    fi
}

# Function to check container status
check_container_status() {
    echo -e "\n${BLUE}=== Container Status ===${NC}"
    
    cd "$APP_DIR"
    
    # Get container status
    local containers=$($DOCKER_COMPOSE_CMD -f docker-compose.prod.yml ps --format json 2>/dev/null | jq -r '.[] | "\(.Service) \(.State) \(.Health // "unknown")"' 2>/dev/null || echo "")
    
    if [ -z "$containers" ]; then
        print_status "ERROR" "No containers found or docker-compose not working"
        return 1
    fi
    
    echo "$containers" | while read -r service state health; do
        if [ "$state" = "running" ]; then
            if [ "$health" = "healthy" ] || [ "$health" = "unknown" ]; then
                print_status "OK" "$service: $state ($health)"
            else
                print_status "WARNING" "$service: $state ($health)"
            fi
        else
            print_status "ERROR" "$service: $state ($health)"
        fi
    done
}

# Function to check service health
check_service_health_status() {
    echo -e "\n${BLUE}=== Service Health ===${NC}"
    
    # Check app service
    if check_service_health "app"; then
        print_status "OK" "App service is healthy"
    else
        print_status "ERROR" "App service is not healthy"
    fi
    
    # Check nginx service
    if check_service_health "nginx"; then
        print_status "OK" "Nginx service is healthy"
    else
        print_status "ERROR" "Nginx service is not healthy"
    fi
    
    # Check redis service (if present)
    if $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml ps | grep -q redis; then
        if check_service_health "redis"; then
            print_status "OK" "Redis service is healthy"
        else
            print_status "ERROR" "Redis service is not healthy"
        fi
    fi
}

# Function to check HTTP endpoints
check_http_endpoints() {
    echo -e "\n${BLUE}=== HTTP Endpoints ===${NC}"
    
    # Check app health endpoint
    check_http_endpoint "http://localhost/api/health" "App health endpoint"
    
    # Check nginx health endpoint
    check_http_endpoint "http://localhost/health" "Nginx health endpoint"
    
    # Check main application
    check_http_endpoint "http://localhost" "Main application"
}

# Function to check systemd services
check_systemd_services() {
    echo -e "\n${BLUE}=== Systemd Services ===${NC}"
    
    # Check kumpels-app service
    if sudo systemctl is-active --quiet kumpels-app.service; then
        print_status "OK" "kumpels-app.service is active"
    else
        print_status "ERROR" "kumpels-app.service is not active"
    fi
    
    # Check kumpels-monitor.timer
    if sudo systemctl is-active --quiet kumpels-monitor.timer; then
        print_status "OK" "kumpels-monitor.timer is active"
    else
        print_status "ERROR" "kumpels-monitor.timer is not active"
    fi
    
    # Check nginx service
    if sudo systemctl is-active --quiet nginx.service; then
        print_status "OK" "nginx.service is active"
    else
        print_status "ERROR" "nginx.service is not active"
    fi
}

# Function to show recent logs
show_recent_logs() {
    echo -e "\n${BLUE}=== Recent Monitoring Logs ===${NC}"
    
    local log_file="/opt/kumpels-app/monitor.log"
    if [ -f "$log_file" ]; then
        echo "Last 10 entries from $log_file:"
        tail -n 10 "$log_file" | while read -r line; do
            echo "  $line"
        done
    else
        print_status "WARNING" "No monitoring log file found"
    fi
}

# Main function
main() {
    echo -e "${BLUE}=== Kumpels App Status Check ===${NC}"
    echo "Timestamp: $(date)"
    echo "Hostname: $(hostname)"
    
    # Check if we're in the right environment
    if [ ! -f "$APP_DIR/docker-compose.prod.yml" ]; then
        print_status "ERROR" "Application not found in $APP_DIR"
        exit 1
    fi
    
    # Run all checks
    check_docker_status
    check_system_resources
    check_container_status
    check_service_health_status
    check_http_endpoints
    check_systemd_services
    show_recent_logs
    
    echo -e "\n${BLUE}=== Status Check Complete ===${NC}"
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --quick        Quick status check (containers only)"
        echo "  --full         Full status check (default)"
        echo ""
        echo "Examples:"
        echo "  $0              # Full status check"
        echo "  $0 --quick      # Quick status check"
        exit 0
        ;;
    --quick)
        echo -e "${BLUE}=== Quick Status Check ===${NC}"
        check_docker_status
        check_container_status
        check_http_endpoints
        ;;
    --full|"")
        main
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac 