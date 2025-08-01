# Makefile for Kumpels App Docker Operations

.PHONY: help build up down logs clean ssl dev prod deploy

# Default target
help:
	@echo "Available commands:"
	@echo "  make build    - Build Docker images"
	@echo "  make up       - Start development environment"
	@echo "  make down     - Stop all containers"
	@echo "  make logs     - View container logs"
	@echo "  make clean    - Remove containers and images"
	@echo "  make ssl      - Generate SSL certificates"
	@echo "  make dev      - Start development environment"
	@echo "  make prod     - Start production environment"
	@echo "  make deploy   - Deploy to production"

# Build Docker images
build:
	docker-compose build

# Start development environment
up:
	docker-compose up -d

# Stop all containers
down:
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# Clean up containers and images
clean:
	docker-compose down -v --rmi all
	docker system prune -f

# Generate SSL certificates
ssl:
	./scripts/generate-ssl.sh

# Development environment
dev: ssl
	docker-compose up -d

# Production environment
prod: ssl
	docker-compose -f docker-compose.prod.yml up -d

# Deploy to production
deploy:
	./deploy.sh

# Health check
health:
	@echo "Checking application health..."
	@curl -f http://localhost/health || echo "Health check failed"

# Database operations
db-migrate:
	docker-compose exec app npx prisma migrate deploy

db-generate:
	docker-compose exec app npx prisma generate

db-studio:
	docker-compose exec app npx prisma studio

# Supabase database operations
db-pull:
	docker-compose exec app npx prisma db pull

db-push:
	docker-compose exec app npx prisma db push

db-reset:
	docker-compose exec app npx prisma migrate reset

# Update application
update:
	git pull
	docker-compose -f docker-compose.prod.yml up -d --build

# Show container status
status:
	docker-compose ps

# Show resource usage
resources:
	docker stats --no-stream

# Access application shell
shell:
	docker-compose exec app sh

# Access Supabase database (if needed)
db-shell:
	@echo "To access Supabase database, use the Supabase dashboard or:"
	@echo "psql '$(shell grep DATABASE_URL .env | cut -d '=' -f2)'" 