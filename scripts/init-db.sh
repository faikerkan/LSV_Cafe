#!/bin/bash
# Database Initialization Script for LSV Cafe Event Management System
# This script initializes the database, runs migrations, and seeds initial data

set -e  # Exit on error

echo "🚀 Starting database initialization..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker-compose exec -T db pg_isready -U ${DB_USER:-lsv_user}; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Run Prisma migrations
echo "📦 Running database migrations..."
docker-compose exec -T api npm run prisma:migrate:deploy

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
docker-compose exec -T api npm run prisma:generate

# Seed initial data
echo "🌱 Seeding initial data..."
docker-compose exec -T api npm run seed

echo "✅ Database initialization complete!"
echo ""
echo "📝 Default admin credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "⚠️  IMPORTANT: Change the default admin password in production!"
