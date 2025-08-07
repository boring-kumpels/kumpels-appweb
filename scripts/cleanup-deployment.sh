#!/bin/bash

# Kumpels App Deployment Cleanup Script
# This script helps clean up Docker resources, logs, and temporary files

set -e

echo "🧹 Kumpels App Deployment Cleanup"
echo "=================================="

# Function to display help
show_help() {
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --docker-cleanup    Clean up Docker containers, images, and volumes"
    echo "  --logs-cleanup      Clean up application and system logs"
    echo "  --temp-cleanup      Clean up temporary files and caches"
    echo "  --full-cleanup      Perform all cleanup operations"
    echo "  --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --docker-cleanup     # Clean Docker resources only"
    echo "  $0 --full-cleanup       # Clean everything"
    echo ""
}

# Function to clean Docker resources
cleanup_docker() {
    echo "🐳 Cleaning Docker resources..."
    
    # Stop and remove containers
    if docker-compose -f docker-compose.prod.yml ps -q 2>/dev/null | grep -q .; then
        echo "   Stopping containers..."
        docker-compose -f docker-compose.prod.yml down
    fi
    
    # Remove unused images
    echo "   Removing unused images..."
    docker image prune -f
    
    # Remove unused volumes (except nginx-logs)
    echo "   Removing unused volumes..."
    docker volume prune -f
    
    # Remove unused networks
    echo "   Removing unused networks..."
    docker network prune -f
    
    # Remove build cache
    echo "   Removing build cache..."
    docker builder prune -f
    
    echo "   ✅ Docker cleanup completed"
}

# Function to clean logs
cleanup_logs() {
    echo "📋 Cleaning logs..."
    
    # Clean application logs
    if [ -f "monitor.log" ]; then
        echo "   Truncating monitor.log..."
        > monitor.log
    fi
    
    # Clean SSL renewal logs
    if [ -f "/var/log/ssl-renewal.log" ]; then
        echo "   Truncating SSL renewal logs..."
        sudo truncate -s 0 /var/log/ssl-renewal.log
    fi
    
    # Clean systemd logs older than 7 days
    echo "   Cleaning systemd logs..."
    sudo journalctl --vacuum-time=7d
    
    # Clean nginx logs in Docker volume
    echo "   Cleaning nginx logs..."
    docker run --rm -v kumpels-appweb_nginx-logs:/logs alpine sh -c 'find /logs -name "*.log" -exec truncate -s 0 {} \;' 2>/dev/null || true
    
    echo "   ✅ Logs cleanup completed"
}

# Function to clean temporary files
cleanup_temp() {
    echo "🗂️  Cleaning temporary files..."
    
    # Clean npm cache
    if command -v npm &> /dev/null; then
        echo "   Cleaning npm cache..."
        npm cache clean --force
    fi
    
    # Clean system temp files
    echo "   Cleaning system temp files..."
    sudo find /tmp -name "*kumpels*" -mtime +7 -delete 2>/dev/null || true
    
    # Clean Docker temporary files
    echo "   Cleaning Docker temporary files..."
    sudo rm -rf /var/lib/docker/tmp/* 2>/dev/null || true
    
    # Clean build artifacts that might be left
    if [ -d ".next" ]; then
        echo "   Removing .next build directory..."
        rm -rf .next
    fi
    
    if [ -d "node_modules/.cache" ]; then
        echo "   Removing node_modules cache..."
        rm -rf node_modules/.cache
    fi
    
    echo "   ✅ Temporary files cleanup completed"
}

# Function to show disk usage
show_disk_usage() {
    echo "💾 Disk Usage Summary:"
    echo "   Total disk usage:"
    df -h / | tail -1 | awk '{print "      Used: " $3 " / Available: " $4 " (" $5 " full)"}'
    
    echo "   Docker disk usage:"
    docker system df 2>/dev/null || echo "      Docker not running"
    
    echo "   Application directory size:"
    du -sh /opt/kumpels-app 2>/dev/null || du -sh . 2>/dev/null || echo "      Unable to calculate"
}

# Parse command line arguments
DOCKER_CLEANUP=false
LOGS_CLEANUP=false
TEMP_CLEANUP=false

if [ $# -eq 0 ]; then
    show_help
    exit 0
fi

while [[ $# -gt 0 ]]; do
    case $1 in
        --docker-cleanup)
            DOCKER_CLEANUP=true
            shift
            ;;
        --logs-cleanup)
            LOGS_CLEANUP=true
            shift
            ;;
        --temp-cleanup)
            TEMP_CLEANUP=true
            shift
            ;;
        --full-cleanup)
            DOCKER_CLEANUP=true
            LOGS_CLEANUP=true
            TEMP_CLEANUP=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Show initial disk usage
echo "Initial disk usage:"
show_disk_usage
echo ""

# Perform cleanups based on flags
if [ "$DOCKER_CLEANUP" = true ]; then
    cleanup_docker
    echo ""
fi

if [ "$LOGS_CLEANUP" = true ]; then
    cleanup_logs
    echo ""
fi

if [ "$TEMP_CLEANUP" = true ]; then
    cleanup_temp
    echo ""
fi

# Show final disk usage
echo "Final disk usage:"
show_disk_usage

echo ""
echo "🎉 Cleanup completed!"
echo ""
echo "💡 Tips:"
echo "   - Run this script weekly to keep your deployment clean"
echo "   - Use --full-cleanup for comprehensive maintenance"
echo "   - Monitor disk usage regularly with: df -h"
echo "   - Check Docker resources with: docker system df"