# GitHub'a Yükleme ve Ubuntu'ya Deploy Etme Rehberi

Bu rehber, projenizi GitHub'a yükleyip oradan Ubuntu sunucunuza nasıl deploy edeceğinizi adım adım anlatır.

## 📤 Adım 1: GitHub'a Yükleme

### 1.1. GitHub Repository Oluşturma

1. **GitHub'a gidin:** https://github.com
2. **Giriş yapın** (hesabınız yoksa oluşturun)
3. **Sağ üst köşeden** "+" butonuna tıklayın
4. **"New repository"** seçin
5. **Repository ayarları:**
   - **Repository name:** `lsv-cafe-rezervasyon`
   - **Description:** "LSV Cafe Event Management System"
   - **Visibility:** Private (güvenlik için) veya Public
   - **EKLEME YAPMAYIN:** README, .gitignore, license (zaten var)
6. **"Create repository"** butonuna tıklayın

### 1.2. Git Yapılandırma (İlk Kez İse)

```bash
# Git kullanıcı bilgilerinizi ayarlayın (ilk kez ise)
git config --global user.name "Adınız Soyadınız"
git config --global user.email "email@example.com"
```

### 1.3. Projeyi GitHub'a Yükleme

Terminal'de proje dizinine gidin ve şu komutları çalıştırın:

```bash
# Proje dizinine gidin
cd /Users/faikerkangursen/Desktop/lsv-cafe-rezervasyon

# Git repository'yi başlatın
git init

# Tüm dosyaları ekleyin (.gitignore otomatik hariç tutar)
git add .

# İlk commit'i yapın
git commit -m "Initial commit: Production-ready LSV Cafe Event Management System"

# GitHub repository'nizi uzak repository olarak ekleyin
# NOT: <kullanici-adi> yerine GitHub kullanıcı adınızı yazın
git remote add origin https://github.com/<kullanici-adi>/lsv-cafe-rezervasyon.git

# Ana branch'i main olarak ayarlayın
git branch -M main

# GitHub'a yükleyin
git push -u origin main
```

**Örnek:**
```bash
git remote add origin https://github.com/faikerkangursen/lsv-cafe-rezervasyon.git
git push -u origin main
```

### 1.4. GitHub Token (Gerekirse)

Eğer şifre sormazsa token gerekebilir:

1. GitHub'da: **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. **"Generate new token"** → **"Generate new token (classic)"**
3. **Scope seçin:** `repo` (tam repository erişimi)
4. Token'ı kopyalayın ve şifre yerine kullanın

---

## 📥 Adım 2: Ubuntu Sunucuya Deploy

### 2.1. Sunucu Hazırlığı

Ubuntu sunucunuza SSH ile bağlanın:

```bash
ssh kullanici@sunucu-ip
```

**Örnek:**
```bash
ssh ubuntu@192.168.1.100
```

### 2.2. Docker Kurulumu (Kurulu Değilse)

```bash
# Sistem güncellemesi
sudo apt update && sudo apt upgrade -y

# Docker kurulumu
curl -fsSL https://get.docker.com | sh

# Docker Compose kurulumu (otomatik gelir ama kontrol edin)
docker compose version

# Kullanıcıyı docker grubuna ekleyin
sudo usermod -aG docker $USER

# Oturumu yenileyin (veya yeniden giriş yapın)
newgrp docker
```

### 2.3. Projeyi GitHub'dan Çekme

```bash
# Çalışma dizinine gidin
cd /opt

# Repository'yi klonlayın
# NOT: <kullanici-adi> yerine kendi kullanıcı adınızı yazın
sudo git clone https://github.com/<kullanici-adi>/lsv-cafe-rezervasyon.git

# Dizine sahip olun
sudo chown -R $USER:$USER lsv-cafe-rezervasyon

# Proje dizinine gidin
cd lsv-cafe-rezervasyon
```

**Örnek:**
```bash
sudo git clone https://github.com/faikerkangursen/lsv-cafe-rezervasyon.git
```

**Private repository ise:**
```bash
# Username ve token/password ile klonlayın
sudo git clone https://<username>:<token>@github.com/<kullanici-adi>/lsv-cafe-rezervasyon.git
```

### 2.4. Portları Kontrol Etme

```bash
# Kullanılabilir portları kontrol edin
./scripts/check-ports.sh
```

### 2.5. Ortam Değişkenlerini Ayarlama

```bash
# .env.ubuntu dosyasını düzenleyin
nano .env.ubuntu
```

**Değiştirmeniz gerekenler:**

```bash
# 1. Güvenli veritabanı şifresi
DB_PASSWORD=GuvenliSifreNiz123!

# 2. JWT Secret oluşturun
# Bu komutu çalıştırın:
openssl rand -base64 64

# Çıktıyı kopyalayıp buraya yapıştırın:
JWT_SECRET=kRp8v2... (yukarıdaki komuttan gelen değer)

# 3. Sunucu IP'nizi veya domain'inizi yazın
FRONTEND_URL=http://192.168.1.100:8880
# veya domain kullanıyorsanız:
# FRONTEND_URL=http://yourdomain.com:8880
```

**Kaydetmek için:** `Ctrl+X` → `Y` → `Enter`

### 2.6. Deployment

```bash
# Deploy scriptini çalıştırın
./scripts/deploy-ubuntu.sh
```

Script otomatik olarak:
- ✅ Port çakışmalarını kontrol eder
- ✅ Docker imajlarını build eder
- ✅ Servisleri başlatır
- ✅ Veritabanını kurar
- ✅ İlk admin kullanıcısını oluşturur

### 2.7. Firewall Yapılandırma

Dış ağdan erişim için:

```bash
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 8880/tcp    # HTTP
sudo ufw allow 8443/tcp    # HTTPS
sudo ufw enable
sudo ufw status
```

### 2.8. Erişim Testi

Tarayıcınızda açın:
```
http://sunucu-ip:8880
```

**Örnek:**
```
http://192.168.1.100:8880
```

**Giriş bilgileri:**
- Kullanıcı: `admin`
- Şifre: `admin123`

⚠️ **İlk girişte MUTLAKA şifreyi değiştirin!**

---

## 🔄 Güncelleme (GitHub'dan Yeni Kod Çekme)

Projeyi güncelledikten sonra sunucuya yansıtmak için:

### Yerel bilgisayarda:

```bash
# Değişiklikleri commit edin
git add .
git commit -m "Güncelleme açıklaması"
git push origin main
```

### Ubuntu sunucuda:

```bash
cd /opt/lsv-cafe-rezervasyon

# Yeni kodu çekin
git pull origin main

# Servisleri yeniden başlatın
docker compose -f docker-compose.ubuntu.yml down
docker compose -f docker-compose.ubuntu.yml build
docker compose -f docker-compose.ubuntu.yml up -d

# Migration varsa çalıştırın
docker compose -f docker-compose.ubuntu.yml exec api npm run prisma:migrate:deploy
```

---

## 📋 Kontrol Komutları

### Servis Durumu
```bash
docker compose -f docker-compose.ubuntu.yml ps
```

### Logları Görüntüleme
```bash
# Tüm servisler
docker compose -f docker-compose.ubuntu.yml logs -f

# Sadece API
docker compose -f docker-compose.ubuntu.yml logs -f api
```

### Yeniden Başlatma
```bash
docker compose -f docker-compose.ubuntu.yml restart
```

### Durdurma
```bash
docker compose -f docker-compose.ubuntu.yml down
```

---

## 🆘 Sorun Giderme

### GitHub'a yüklenirken sorun
```bash
# Uzak repository kontrolü
git remote -v

# Eğer yanlışsa, düzeltin:
git remote remove origin
git remote add origin https://github.com/<kullanici-adi>/lsv-cafe-rezervasyon.git
```

### Sunucuda clone hatası
```bash
# SSH key kullanıyorsanız
ssh-keygen -t ed25519 -C "email@example.com"
# Public key'i GitHub'a ekleyin: Settings → SSH keys

# veya HTTPS ile token kullanın
```

### Port çakışması
```bash
# Portları kontrol edin
./scripts/check-ports.sh

# Farklı portlar kullanın (.env.ubuntu'da)
HTTP_PORT=9980
HTTPS_PORT=9943
```

### Container başlamıyor
```bash
# Detaylı log
docker compose -f docker-compose.ubuntu.yml logs api

# Yeniden build
docker compose -f docker-compose.ubuntu.yml build --no-cache
```

---

## ✅ Özet Komutlar

**GitHub'a ilk yükleme:**
```bash
cd /Users/faikerkangursen/Desktop/lsv-cafe-rezervasyon
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<kullanici-adi>/lsv-cafe-rezervasyon.git
git branch -M main
git push -u origin main
```

**Ubuntu'da kurulum:**
```bash
ssh kullanici@sunucu-ip
cd /opt
sudo git clone https://github.com/<kullanici-adi>/lsv-cafe-rezervasyon.git
cd lsv-cafe-rezervasyon
sudo chown -R $USER:$USER .
nano .env.ubuntu  # Ayarları yapın
./scripts/deploy-ubuntu.sh
```

**Erişim:**
```
http://sunucu-ip:8880
admin / admin123
```

---

**Başarılar! 🎉**

Detaylı bilgi için:
- [UBUNTU-DEPLOYMENT-TR.md](UBUNTU-DEPLOYMENT-TR.md) - Deployment detayları
- [README.md](README.md) - Genel bakış
