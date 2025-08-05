#!/bin/bash

# Kumpels App Restart Script
# Manual restart script for the application

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
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}$message${NC}"
}

# Function to check if we're in the right environment
check_environment() {
    if [ ! -f "$APP_DIR/docker-compose.prod.yml" ]; then
        print_message $RED "ERROR: Application not found in $APP_DIR"
        exit 1
    fi
    
    cd "$APP_DIR"
}

# Function to restart specific service
restart_service() {
    local service_name=$1
    print_message $BLUE "Restarting $service_name service..."
    
    if $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml restart "$service_name"; then
        print_message $GREEN "✓ Successfully restarted $service_name"
        sleep 10  # Wait for service to stabilize
    else
        print_message $RED "✗ Failed to restart $service_name"
        return 1
    fi
}

# Function to restart all services
restart_all() {
    print_message $BLUE "Restarting all services..."
    
    if $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml down; then
        print_message $GREEN "✓ Stopped all services"
    else
        print_message $RED "✗ Failed to stop services"
        return 1
    fi
    
    sleep 5
    
    if $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml up -d; then
        print_message $GREEN "✓ Started all services"
        sleep 30  # Wait for services to start
    else
        print_message $RED "✗ Failed to start services"
        return 1
    fi
}

# Function to restart systemd service
restart_systemd() {
    print_message $BLUE "Restarting systemd service..."
    
    if sudo systemctl restart kumpels-app.service; then
        print_message $GREEN "✓ Successfully restarted kumpels-app.service"
    else
        print_message $RED "✗ Failed to restart kumpels-app.service"
        return 1
    fi
}

# Function to check service status
check_status() {
    print_message $BLUE "Checking service status..."
    
    echo ""
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml ps
    echo ""
    
    # Check HTTP endpoints
    if curl -f -s http://localhost/api/health > /dev/null 2>&1; then
        print_message $GREEN "✓ App health endpoint is responding"
    else
        print_message $RED "✗ App health endpoint is not responding"
    fi
    
    if curl -f -s http://localhost/health > /dev/null 2>&1; then
        print_message $GREEN "✓ Nginx health endpoint is responding"
    else
        print_message $RED "✗ Nginx health endpoint is not responding"
    fi
}

# Function to show logs
show_logs() {
    local service_name=$1
    local lines=${2:-50}
    
    print_message $BLUE "Showing last $lines lines of $service_name logs..."
    echo ""
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml logs --tail="$lines" "$service_name"
}

# Main function
main() {
    print_message $BLUE "=== Kumpels App Restart Script ==="
    echo "Timestamp: $(date)"
    
    check_environment
    
    case "${1:-}" in
        "app")
            restart_service "app"
            ;;
        "nginx")
            restart_service "nginx"
            ;;
        "redis")
            restart_service "redis"
            ;;
        "all")
            restart_all
            ;;
        "systemd")
            restart_systemd
            ;;
        "status")
            check_status
            ;;
        "logs")
            show_logs "${2:-app}" "${3:-50}"
            ;;
        "help"|"--help"|"-h")
            echo "Usage: $0 [COMMAND] [OPTIONS]"
            echo ""
            echo "Commands:"
            echo "  app              Restart app service only"
            echo "  nginx            Restart nginx service only"
            echo "  redis            Restart redis service only"
            echo "  all              Restart all services"
            echo "  systemd          Restart systemd service"
            echo "  status           Check current status"
            echo "  logs [service]   Show logs for service (default: app)"
            echo "  help             Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 app           # Restart app service"
            echo "  $0 all           # Restart all services"
            echo "  $0 status        # Check status"
            echo "  $0 logs nginx    # Show nginx logs"
            echo "  $0 logs app 100  # Show last 100 lines of app logs"
            exit 0
            ;;
        "")
            print_message $YELLOW "No command specified. Use 'help' for usage information."
            exit 1
            ;;
        *)
            print_message $RED "Unknown command: $1"
            print_message $YELLOW "Use 'help' for usage information."
            exit 1
            ;;
    esac
    
    # Always check status after restart
    if [ "$1" != "status" ] && [ "$1" != "logs" ] && [ "$1" != "help" ]; then
        echo ""
        check_status
    fi
    
    print_message $GREEN "=== Restart operation completed ==="
}

# Run main function with all arguments
main "$@" 