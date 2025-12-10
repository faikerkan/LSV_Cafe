# LSV Cafe Event Management System - Ubuntu Server Deployment Guide

This guide provides step-by-step instructions for deploying the LSV Cafe Event Management System to an Ubuntu server using Docker.

## Prerequisites

- **Ubuntu Server**: 20.04 LTS or newer
- **Root/Sudo Access**: Required for installation
- **Minimum Resources**: 2GB RAM, 20GB storage, 2 CPU cores
- **Domain Name** (Optional): For SSL/TLS configuration
- **Ports**: 80 (HTTP), 443 (HTTPS), 5433 (PostgreSQL - localhost only)

## 1. Server Preparation

### Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### Install Docker and Docker Compose

```bash
# Install required packages
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add current user to docker group (logout/login required after this)
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker compose version
```

### Install Git

```bash
sudo apt install -y git
```

## 2. Clone and Configure Application

### Clone Repository

```bash
cd /opt
sudo git clone <your-repository-url> lsv-cafe
cd lsv-cafe
sudo chown -R $USER:$USER /opt/lsv-cafe
```

### Configure Environment Variables

```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit environment variables
nano .env.production
```

**Required Configuration:**

```bash
# Generate secure JWT secret (use this command)
openssl rand -base64 64

# Example .env.production
DB_USER=lsv_user
DB_PASSWORD=<SECURE_PASSWORD_HERE>  # Change this!
DB_NAME=lsv_cafe_db
JWT_SECRET=<SECURE_JWT_SECRET_HERE>  # Change this!
FRONTEND_URL=https://yourdomain.com  # Your domain or IP
NODE_ENV=production
PORT=3000
BACKUP_RETENTION_DAYS=7
```

## 3. SSL/TLS Setup (Recommended)

### Option A: Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install -y certbot

# Stop any running web server
docker-compose -f docker-compose.prod.yml down

# Generate certificate (replace yourdomain.com)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Create SSL directory
mkdir -p ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
sudo chown -R $USER:$USER ssl/
```

### Option B: Self-Signed Certificate (Development/Testing)

```bash
# Create SSL directory
mkdir -p ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/C=TR/ST=Istanbul/L=Istanbul/O=LSV/CN=localhost"
```

## 4. Build and Deploy

### Build Docker Images

```bash
# Build all services
docker compose -f docker-compose.prod.yml build

# This may take 5-10 minutes
```

### Start Services

```bash
# Start all containers in detached mode
docker compose -f docker-compose.prod.yml up -d

# Check container status
docker compose -f docker-compose.prod.yml ps
```

Expected output:
```
NAME              STATUS    PORTS
lsv_db_prod       Up        127.0.0.1:5433->5432/tcp
lsv_api_prod      Up        
lsv_web_prod      Up        0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

### Initialize Database

```bash
# Run database initialization script
./scripts/init-db.sh
```

This script will:
- Wait for PostgreSQL to be ready
- Run database migrations
- Generate Prisma client
- Seed initial admin user

**Default admin credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **IMPORTANT**: Change the admin password immediately after first login!

## 5. Verify Deployment

### Check Service Health

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check individual service
docker compose -f docker-compose.prod.yml logs api
docker compose -f docker-compose.prod.yml logs web
docker compose -f docker-compose.prod.yml logs db

# Health checks
curl http://localhost/health
curl http://localhost/api/
```

### Test Application

1. Open browser to `http://your-server-ip` (or `https://yourdomain.com`)
2. Login with admin credentials
3. Create a test event
4. Verify event appears in calendar

## 6. Firewall Configuration

```bash
# Allow SSH (if not already allowed)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## 7. Database Backups

### Manual Backup

```bash
# Create backup
./scripts/backup-db.sh
```

Backups are stored in `./backups/` directory.

### Automated Daily Backups

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /opt/lsv-cafe && ./scripts/backup-db.sh >> /var/log/lsv-backup.log 2>&1
```

### Restore from Backup

```bash
# List available backups
ls -lh backups/

# Restore specific backup
./scripts/restore-db.sh backups/lsv_cafe_db_20250110_020000.sql.gz
```

## 8. Monitoring and Maintenance

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100

# Specific service
docker compose -f docker-compose.prod.yml logs -f api
```

### Restart Services

```bash
# Restart all services
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart api
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Run migrations
docker compose -f docker-compose.prod.yml exec api npm run prisma:migrate:deploy
```

### Clean Up Docker Resources

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Complete cleanup (WARNING: removes all unused resources)
docker system prune -a --volumes
```

## 9. Troubleshooting

### Container Won't Start

```bash
# Check container logs
docker compose -f docker-compose.prod.yml logs <service-name>

# Check container status
docker compose -f docker-compose.prod.yml ps

# Restart specific container
docker compose -f docker-compose.prod.yml restart <service-name>
```

### Database Connection Issues

```bash
# Check database is running
docker compose -f docker-compose.prod.yml exec db pg_isready -U lsv_user

# Connect to database
docker compose -f docker-compose.prod.yml exec db psql -U lsv_user -d lsv_cafe_db

# Check tables
\dt
```

### SSL Certificate Renewal

```bash
# Renew Let's Encrypt certificate
sudo certbot renew

# Copy renewed certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
sudo chown -R $USER:$USER ssl/

# Restart nginx
docker compose -f docker-compose.prod.yml restart web
```

### High Memory Usage

```bash
# Check container resource usage
docker stats

# Adjust memory limits in docker-compose.prod.yml if needed
```

## 10. Security Best Practices

- ✅ Change default admin password immediately
- ✅ Use strong, unique passwords for database
- ✅ Keep JWT_SECRET secure and unique
- ✅ Enable firewall (UFW)
- ✅ Regular security updates: `sudo apt update && sudo apt upgrade`
- ✅ Regular backups (automated)
- ✅ Use HTTPS in production
- ✅ Limit SSH access to specific IPs if possible
- ✅ Monitor logs regularly
- ✅ Keep Docker images updated

## 11. Performance Optimization

### Enable Nginx Caching

Already configured in `nginx.prod.conf`:
- Static assets cached for 1 year
- Gzip compression enabled
- Browser caching headers set

### Database Optimization

```bash
# Vacuum database (monthly)
docker compose -f docker-compose.prod.yml exec db psql -U lsv_user -d lsv_cafe_db -c "VACUUM ANALYZE;"

# Check database size
docker compose -f docker-compose.prod.yml exec db psql -U lsv_user -d lsv_cafe_db -c "SELECT pg_size_pretty(pg_database_size('lsv_cafe_db'));"
```

## 12. Production Checklist

Before going live:

- [ ] Changed default admin password
- [ ] Set secure JWT_SECRET
- [ ] Configured SSL/TLS
- [ ] Tested backup and restore
- [ ] Set up automated backups
- [ ] Configured firewall
- [ ] Tested all features
- [ ] Reviewed security headers
- [ ] Set up monitoring
- [ ] Documented custom configurations

## Support and Additional Information

For more information:
- **Testing Guide**: See `TESTING.md`
- **Backend Spec**: See `BACKEND_SPEC.md`
- **API Documentation**: Available at `/api/` endpoint

---

**Deployment Version**: 1.0  
**Last Updated**: 2025-12-10
