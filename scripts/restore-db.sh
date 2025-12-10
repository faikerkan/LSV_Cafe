#!/bin/bash
# Database Restore Script for LSV Cafe Event Management System
# Usage: ./restore-db.sh <backup_file>

set -e

if [ -z "$1" ]; then
    echo "❌ Error: No backup file specified"
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 ./backups/lsv_cafe_db_20250110_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"
DB_CONTAINER="lsv_db_prod"
DB_USER="${DB_USER:-lsv_user}"
DB_NAME="${DB_NAME:-lsv_cafe_db}"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "❌ Error: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

echo "⚠️  WARNING: This will replace all data in the database!"
echo "📁 Backup file: ${BACKUP_FILE}"
echo "🗄️  Database: ${DB_NAME}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

echo "🔄 Starting database restore..."

# Drop and recreate database
docker exec -t "${DB_CONTAINER}" psql -U "${DB_USER}" -c "DROP DATABASE IF EXISTS ${DB_NAME};"
docker exec -t "${DB_CONTAINER}" psql -U "${DB_USER}" -c "CREATE DATABASE ${DB_NAME};"

# Restore from backup
gunzip -c "${BACKUP_FILE}" | docker exec -i "${DB_CONTAINER}" psql -U "${DB_USER}" "${DB_NAME}"

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully!"
else
    echo "❌ Restore failed!"
    exit 1
fi

echo "🔧 Running migrations to ensure schema is up to date..."
docker-compose exec -T api npm run prisma:migrate:deploy

echo "✅ Restore process complete!"
