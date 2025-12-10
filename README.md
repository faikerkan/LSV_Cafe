# LSV Cafe Event Management System

🎉 **Production-ready event management system** for LSV Cafe with Docker deployment, PostgreSQL backend, and comprehensive testing.

## 🌟 Features

- 📅 Event calendar with conflict detection
- 🔒 JWT-based authentication
- ⚡ Real-time conflict checking (location & resources)
- 🐳 Docker containerized deployment
- 🧪 Comprehensive test coverage (15+ tests)
- 🔐 Production security (SSL, rate limiting, CORS)
- 💾 Automated database backups
- 🌐 Ubuntu server ready

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js 18+
- Docker & Docker Compose

### Local Development

```bash
# 1. Clone repository
git clone <your-repo-url>
cd lsv-cafe-rezervasyon

# 2. Install dependencies
npm install
cd backend && npm install && cd ..

# 3. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your settings

# 4. Start Docker services
docker-compose up -d

# 5. Initialize database
./scripts/init-db.sh

# 6. Start development servers
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd backend && npm run dev
```

**Access:** http://localhost:5173  
**Default login:** admin / admin123

## 🏭 Production Deployment (Ubuntu)

### Method 1: Custom Ports (Recommended - Avoids conflicts)

```bash
# On Ubuntu server
git clone <your-repo-url>
cd lsv-cafe-rezervasyon

# Configure environment
nano .env.ubuntu
# Set: DB_PASSWORD, JWT_SECRET, FRONTEND_URL

# Deploy with custom ports (8880/8443)
./scripts/deploy-ubuntu.sh
```

**Access:** http://your-server-ip:8880

### Method 2: Standard Ports

```bash
# Configure environment
cp .env.production.example .env.production
nano .env.production

# Deploy
./scripts/deploy.sh
```

**Detailed guides:**
- 🇹🇷 Turkish: [UBUNTU-DEPLOYMENT-TR.md](UBUNTU-DEPLOYMENT-TR.md)
- 🇬🇧 English: [DEPLOYMENT.md](DEPLOYMENT.md)

## 📦 Port Configuration

| Service | Development | Production (Standard) | Production (Custom) |
|---------|-------------|----------------------|---------------------|
| HTTP | 5173 | 80 | 8880 |
| HTTPS | - | 443 | 8443 |
| PostgreSQL | 5433 | 5433 (localhost) | 54320 (localhost) |
| Backend API | 3000 | 3000 (internal) | 3000 (internal) |

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test                  # Run all tests
npm run test:coverage     # With coverage
npm run test:watch        # Watch mode

# Frontend tests
npm test
npm run test:coverage
```

**Test coverage:** 15 tests, 70% minimum threshold

See [TESTING.md](TESTING.md) for details.

## 📁 Project Structure

```
lsv-cafe-rezervasyon/
├── backend/                    # Node.js API
│   ├── src/
│   │   ├── routes/            # API endpoints
│   │   ├── lib/               # Utilities
│   │   └── __tests__/         # Jest tests
│   ├── prisma/                # Database schema
│   └── Dockerfile
├── components/                 # React components
├── services/                   # API services
├── scripts/                    # Deployment scripts
│   ├── deploy-ubuntu.sh       # Ubuntu deployment
│   ├── check-ports.sh         # Port checker
│   ├── init-db.sh            # DB initialization
│   ├── backup-db.sh          # Backup script
│   └── restore-db.sh         # Restore script
├── docker-compose.yml         # Development
├── docker-compose.ubuntu.yml  # Ubuntu (custom ports)
├── docker-compose.prod.yml    # Production (standard)
└── nginx.prod.conf           # Nginx config

Documentation:
├── UBUNTU-DEPLOYMENT-TR.md   # 🇹🇷 Ubuntu guide (Turkish)
├── DEPLOYMENT.md             # 🇬🇧 Deployment guide (English)
├── TESTING.md                # Testing guide
└── BACKEND_SPEC.md           # Backend specification
```

## 🔧 Common Commands

### Development
```bash
npm run dev              # Start frontend dev server
cd backend && npm run dev # Start backend dev server
docker-compose up -d     # Start database
docker-compose logs -f   # View logs
```

### Production (Ubuntu - Custom Ports)
```bash
./scripts/deploy-ubuntu.sh                          # Deploy
docker compose -f docker-compose.ubuntu.yml logs -f # View logs
docker compose -f docker-compose.ubuntu.yml ps      # Status
docker compose -f docker-compose.ubuntu.yml restart # Restart
./scripts/backup-db.sh ubuntu                       # Backup
```

### Production (Standard Ports)
```bash
./scripts/deploy.sh                             # Deploy
docker compose -f docker-compose.prod.yml logs  # View logs
docker compose -f docker-compose.prod.yml ps    # Status
./scripts/backup-db.sh                          # Backup
```

## 🗄️ Database Management

### Backup
```bash
# Create backup
./scripts/backup-db.sh

# Automated daily backups (cron)
0 3 * * * cd /path/to/app && ./scripts/backup-db.sh >> /var/log/lsv-backup.log 2>&1
```

### Restore
```bash
./scripts/restore-db.sh backups/lsv_cafe_db_20250110_030000.sql.gz
```

## 🔐 Security Features

- ✅ JWT authentication with bcrypt password hashing
- ✅ Rate limiting (100 requests / 15 minutes)
- ✅ Helmet security headers
- ✅ CORS protection
- ✅ SQL injection prevention (Prisma ORM)
- ✅ XSS protection
- ✅ HTTPS/SSL support
- ✅ Environment variable protection

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Events
- `GET /api/events` - List all events
- `POST /api/events` - Create event (with conflict check)
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

## 🛠️ Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite
- Lucide React icons

**Backend:**
- Node.js + Express
- PostgreSQL + Prisma ORM
- JWT authentication
- Helmet + Rate limiting

**Infrastructure:**
- Docker + Docker Compose
- Nginx reverse proxy
- Let's Encrypt SSL

## 📊 Monitoring

```bash
# Container resources
docker stats

# Logs
docker compose -f docker-compose.ubuntu.yml logs -f

# Database size
docker compose -f docker-compose.ubuntu.yml exec db \
  psql -U lsv_user -d lsv_cafe_db -c \
  "SELECT pg_size_pretty(pg_database_size('lsv_cafe_db'));"
```

## 🔍 Troubleshooting

### Port conflicts
```bash
# Check available ports
./scripts/check-ports.sh

# Find what's using a port
sudo netstat -tulpn | grep 8880
```

### Container issues
```bash
# View logs
docker compose -f docker-compose.ubuntu.yml logs api

# Restart service
docker compose -f docker-compose.ubuntu.yml restart api

# Rebuild
docker compose -f docker-compose.ubuntu.yml build --no-cache
```

### Database connection
```bash
# Check DB health
docker compose -f docker-compose.ubuntu.yml exec db pg_isready -U lsv_user

# Connect to DB
docker compose -f docker-compose.ubuntu.yml exec db \
  psql -U lsv_user -d lsv_cafe_db
```

See full troubleshooting guides in:
- [UBUNTU-DEPLOYMENT-TR.md](UBUNTU-DEPLOYMENT-TR.md) (Turkish)
- [DEPLOYMENT.md](DEPLOYMENT.md) (English)

## 📝 Environment Variables

### Required for Production

```bash
# Database
DB_USER=lsv_user
DB_PASSWORD=<strong-password>
DB_NAME=lsv_cafe_db

# Security
JWT_SECRET=<generate-with-openssl-rand-base64-64>

# Server
NODE_ENV=production
FRONTEND_URL=http://your-domain-or-ip:8880

# Ports (for Ubuntu deployment)
HTTP_PORT=8880
HTTPS_PORT=8443
DB_PORT=54320
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Write tests for new features
4. Ensure all tests pass: `npm test`
5. Commit changes: `git commit -am 'Add feature'`
6. Push to branch: `git push origin feature-name`
7. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation:** See guides in root directory
- **Issues:** Use GitHub Issues
- **Email:** [Your support email]

## ✅ Production Checklist

Before deploying:

- [ ] Change default admin password (admin/admin123)
- [ ] Set strong DB_PASSWORD
- [ ] Generate secure JWT_SECRET
- [ ] Configure SSL/TLS certificates
- [ ] Set up automated backups
- [ ] Configure firewall
- [ ] Test all features
- [ ] Review security headers
- [ ] Set up monitoring/logging

---

**Version:** 1.0.0  
**Last Updated:** 2025-12-10  
**Status:** ✅ Production Ready

Made with ❤️ for LSV Cafe
