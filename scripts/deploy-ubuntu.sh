#!/bin/bash
# Ubuntu Server Deployment Script with Custom Ports
# This script deploys the application using non-standard ports to avoid conflicts

set -e

echo "🚀 LSV Cafe - Ubuntu Server Deployment (Custom Ports)"
echo "======================================================"
echo ""
echo "📋 Port Configuration:"
echo "   HTTP:       8880 (instead of 80)"
echo "   HTTPS:      8443 (instead of 443)"
echo "   PostgreSQL: 54320 (localhost only)"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please do not run this script as root"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "Run: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check environment file
if [ ! -f .env.ubuntu ]; then
    echo "⚠️  .env.ubuntu not found, creating from template..."
    cat > .env.ubuntu << 'EOF'
DB_USER=lsv_user
DB_PASSWORD=CHANGE_THIS_PASSWORD
DB_NAME=lsv_cafe_db
JWT_SECRET=CHANGE_THIS_JWT_SECRET
NODE_ENV=production
FRONTEND_URL=http://localhost:8880
HTTP_PORT=8880
HTTPS_PORT=8443
DB_PORT=54320
BACKUP_RETENTION_DAYS=7
EOF
    echo ""
    echo "❌ Please edit .env.ubuntu and set secure passwords:"
    echo "   nano .env.ubuntu"
    echo ""
    echo "Required changes:"
    echo "   1. Set DB_PASSWORD to a secure password"
    echo "   2. Set JWT_SECRET (generate with: openssl rand -base64 64)"
    echo "   3. Set FRONTEND_URL to your server IP:8880 or domain:8880"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Load environment
export $(cat .env.ubuntu | grep -v '^#' | xargs)

# Show current configuration
echo "📋 Deployment Configuration:"
echo "   Database: ${DB_NAME}"
echo "   Frontend URL: ${FRONTEND_URL}"
echo "   HTTP Port: ${HTTP_PORT:-8880}"
echo "   HTTPS Port: ${HTTPS_PORT:-8443}"
echo ""

# Check if ports are available
echo "🔍 Checking if ports are available..."

check_port() {
    local port=$1
    if netstat -tuln 2>/dev/null | grep -q ":${port} " || ss -tuln 2>/dev/null | grep -q ":${port} "; then
        echo "❌ Port ${port} is already in use!"
        echo "   Run: sudo netstat -tulpn | grep ${port}"
        echo "   or:  sudo ss -tulpn | grep ${port}"
        return 1
    else
        echo "✅ Port ${port} is available"
        return 0
    fi
}

PORT_CONFLICT=0
check_port ${HTTP_PORT:-8880} || PORT_CONFLICT=1
check_port ${HTTPS_PORT:-8443} || PORT_CONFLICT=1
check_port ${DB_PORT:-54320} || PORT_CONFLICT=1

if [ $PORT_CONFLICT -eq 1 ]; then
    echo ""
    echo "❌ Some ports are already in use. Please stop the conflicting services or"
    echo "   edit .env.ubuntu to use different ports, then run this script again."
    exit 1
fi

echo ""
read -p "Continue with deployment? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

# Stop any existing containers
echo ""
echo "🛑 Stopping any existing containers..."
docker compose -f docker-compose.ubuntu.yml down 2>/dev/null || true

# Build images
echo ""
echo "🔨 Building Docker images (this may take several minutes)..."
docker compose -f docker-compose.ubuntu.yml build

# Start services
echo ""
echo "🚀 Starting services..."
docker compose -f docker-compose.ubuntu.yml up -d

# Wait for services
echo ""
echo "⏳ Waiting for services to start..."
sleep 15

# Check service health
echo ""
echo "🏥 Checking service health..."
if docker compose -f docker-compose.ubuntu.yml ps | grep -q "unhealthy"; then
    echo "⚠️  Some services are unhealthy. Checking logs..."
    docker compose -f docker-compose.ubuntu.yml ps
    echo ""
    echo "Run this to see detailed logs:"
    echo "  docker compose -f docker-compose.ubuntu.yml logs"
else
    echo "✅ All services are healthy"
fi

# Initialize database
echo ""
echo "🗄️  Initializing database..."
sleep 5

# Wait for database
until docker compose -f docker-compose.ubuntu.yml exec -T db pg_isready -U ${DB_USER} 2>/dev/null; do
    echo "⏳ Waiting for database..."
    sleep 2
done

echo "✅ Database is ready"

# Run migrations
echo "📦 Running migrations..."
docker compose -f docker-compose.ubuntu.yml exec -T api npm run prisma:migrate:deploy || {
    echo "⚠️  Migrations failed, trying db push..."
    docker compose -f docker-compose.ubuntu.yml exec -T api npm run prisma:push
}

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
docker compose -f docker-compose.ubuntu.yml exec -T api npm run prisma:generate

# Seed database
echo "🌱 Seeding initial data..."
docker compose -f docker-compose.ubuntu.yml exec -T api npm run seed || {
    echo "⚠️  Seeding failed (may already be seeded)"
}

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "======================================================"
echo "✅ Deployment Complete!"
echo "======================================================"
echo ""
echo "🌐 Access your application at:"
echo "   Local:     http://localhost:${HTTP_PORT:-8880}"
echo "   Network:   http://${SERVER_IP}:${HTTP_PORT:-8880}"
if [ -n "${FRONTEND_URL}" ]; then
    echo "   Configured: ${FRONTEND_URL}"
fi
echo ""
echo "📝 Default Admin Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo "   ⚠️  CHANGE IMMEDIATELY AFTER FIRST LOGIN!"
echo ""
echo "🔧 Useful Commands:"
echo "   View logs:     docker compose -f docker-compose.ubuntu.yml logs -f"
echo "   Stop:          docker compose -f docker-compose.ubuntu.yml down"
echo "   Restart:       docker compose -f docker-compose.ubuntu.yml restart"
echo "   Backup DB:     ./scripts/backup-db.sh ubuntu"
echo "   Container status: docker compose -f docker-compose.ubuntu.yml ps"
echo ""
echo "🔥 Firewall Note:"
echo "   If you want to access from external network, open the firewall:"
echo "   sudo ufw allow ${HTTP_PORT:-8880}/tcp"
echo "   sudo ufw allow ${HTTPS_PORT:-8443}/tcp"
echo ""
