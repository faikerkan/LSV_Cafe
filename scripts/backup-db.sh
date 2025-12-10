#!/bin/bash
# Database Backup Script for LSV Cafe Event Management System
# This script creates PostgreSQL backups with automatic retention

set -e

# Configuration
BACKUP_DIR="./backups"
DB_CONTAINER="lsv_db_prod"
DB_USER="${DB_USER:-lsv_user}"
DB_NAME="${DB_NAME:-lsv_cafe_db}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/lsv_cafe_db_${TIMESTAMP}.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo "🔄 Starting database backup..."
echo "📅 Timestamp: ${TIMESTAMP}"

# Create backup
docker exec -t "${DB_CONTAINER}" pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully: ${BACKUP_FILE}"
    
    # Get backup file size
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "📦 Backup size: ${BACKUP_SIZE}"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Clean up old backups
echo "🗑️  Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "lsv_cafe_db_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

# Count remaining backups
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "lsv_cafe_db_*.sql.gz" -type f | wc -l)
echo "📊 Total backups retained: ${BACKUP_COUNT}"

echo "✅ Backup process complete!"
