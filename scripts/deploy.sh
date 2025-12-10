#!/bin/bash
# Quick Deploy Script for LSV Cafe Event Management System
# This script handles the complete deployment process

set -e  # Exit on error

echo "🚀 LSV Cafe Event Management System - Quick Deploy"
echo "=================================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please do not run this script as root"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Run: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# Check if Docker Compose is installed
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "⚠️  .env.production not found"
    echo "📝 Creating from template..."
    cp .env.production.example .env.production
    echo ""
    echo "❌ Please edit .env.production and set secure passwords:"
    echo "   - DB_PASSWORD"
    echo "   - JWT_SECRET (generate with: openssl rand -base64 64)"
    echo "   - FRONTEND_URL"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "✅ Environment configuration found"
echo ""

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Ask for confirmation
echo "📋 Deployment Summary:"
echo "   Database: ${DB_NAME}"
echo "   Frontend URL: ${FRONTEND_URL}"
echo "   Node Environment: ${NODE_ENV}"
echo ""
read -p "Continue with deployment? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

echo ""
echo "🔨 Building Docker images..."
docker compose -f docker-compose.prod.yml build

echo ""
echo "🚀 Starting services..."
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if containers are running
if ! docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "❌ Some containers failed to start"
    echo "Run 'docker compose -f docker-compose.prod.yml logs' for details"
    exit 1
fi

echo "✅ All containers are running"
echo ""

# Initialize database
echo "🗄️  Initializing database..."
if [ -x "./scripts/init-db.sh" ]; then
    ./scripts/init-db.sh
else
    echo "⚠️  Database initialization script not found or not executable"
    echo "Please run: chmod +x scripts/init-db.sh && ./scripts/init-db.sh"
fi

echo ""
echo "=================================================="
echo "✅ Deployment Complete!"
echo "=================================================="
echo ""
echo "📝 Default Admin Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo "   ⚠️  CHANGE THE PASSWORD IMMEDIATELY!"
echo ""
echo "🌐 Access your application at:"
echo "   ${FRONTEND_URL}"
echo ""
echo "📊 Useful commands:"
echo "   View logs:    docker compose -f docker-compose.prod.yml logs -f"
echo "   Stop:         docker compose -f docker-compose.prod.yml down"
echo "   Restart:      docker compose -f docker-compose.prod.yml restart"
echo "   Backup DB:    ./scripts/backup-db.sh"
echo ""
echo "📚 Documentation:"
echo "   Deployment: DEPLOYMENT.md"
echo "   Testing:    TESTING.md"
echo ""
