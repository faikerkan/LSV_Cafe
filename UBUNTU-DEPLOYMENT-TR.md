# Ubuntu Sunucuya Deployment Rehberi (Türkçe)

Bu rehber, LSV Cafe sistemini Ubuntu sunucunuza özel portlar kullanarak deploy etmenizi sağlar.

## Kullanılan Portlar

Standart portlar yerine çakışma olmaması için özel portlar kullanılıyor:

| Servis | Standart Port | Kullanılan Port | Açıklama |
|--------|---------------|-----------------|----------|
| HTTP | 80 | **8880** | Web erişimi |
| HTTPS | 443 | **8443** | Güvenli web erişimi |
| PostgreSQL | 5432 | **54320** | Veritabanı (sadece localhost) |

## Hızlı Kurulum

### 1. Dosyaları Sunucuya Yükleyin

```bash
# Sunucunuza SSH ile bağlanın
ssh kullanici@sunucu-ip

# Projeyi klonlayın veya yükleyin
cd /opt
sudo git clone <repository-url> lsv-cafe
# veya
scp -r lsv-cafe/ kullanici@sunucu-ip:/opt/

cd /opt/lsv-cafe
sudo chown -R $USER:$USER /opt/lsv-cafe
```

### 2. Ortam Değişkenlerini Ayarlayın

```bash
# .env.ubuntu dosyasını düzenleyin
nano .env.ubuntu
```

**Değiştirmeniz gerekenler:**

```bash
# Güvenli bir veritabanı şifresi
DB_PASSWORD=SifreNizi_Buraya_Yazin

# JWT secret oluşturun (bu komutu çalıştırın ve çıktıyı kopyalayın)
openssl rand -base64 64

# Çıkan değeri buraya yapıştırın
JWT_SECRET=GxR8k2... (yukarıdaki komuttan çıkan değer)

# Sunucu IP'niz veya domain'iniz
FRONTEND_URL=http://sunucu-ip:8880
# Örnek: FRONTEND_URL=http://192.168.1.100:8880
```

### 3. Deploy Edin

```bash
# Deploy scriptini çalıştırın
./scripts/deploy-ubuntu.sh
```

Script otomatik olarak:
- ✅ Docker'ın kurulu olup olmadığını kontrol eder
- ✅ Portların kullanılabilir olup olmadığını kontrol eder
- ✅ Docker imajlarını build eder
- ✅ Servisleri başlatır
- ✅ Veritabanını kurar ve seed eder

### 4. Firewall Ayarları (İsteğe Bağlı)

Dış ağdan erişim için portları açın:

```bash
# Firewall'u yapılandırın
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 8880/tcp  # HTTP
sudo ufw allow 8443/tcp  # HTTPS
sudo ufw enable
sudo ufw status
```

### 5. Erişim

Tarayıcınızda açın:
- **Yerel ağ:** `http://sunucu-ip:8880`
- **Örnek:** `http://192.168.1.100:8880`

**Giriş bilgileri:**
- Kullanıcı adı: `admin`
- Şifre: `admin123`

⚠️ **İlk girişte şifreyi mutlaka değiştirin!**

---

## Detaylı Kullanım

### Servisleri Yönetme

```bash
# Logları görüntüle
docker compose -f docker-compose.ubuntu.yml logs -f

# Sadece API logları
docker compose -f docker-compose.ubuntu.yml logs -f api

# Servisleri durdur
docker compose -f docker-compose.ubuntu.yml down

# Servisleri başlat
docker compose -f docker-compose.ubuntu.yml up -d

# Servisleri yeniden başlat
docker compose -f docker-compose.ubuntu.yml restart

# Servis durumunu kontrol et
docker compose -f docker-compose.ubuntu.yml ps
```

### Veritabanı Yönetimi

#### Yedekleme

```bash
# Manuel yedek al
./scripts/backup-db.sh ubuntu

# Yedekler şurada saklanır: ./backups/
ls -lh backups/
```

#### Otomatik Yedekleme (Günlük)

```bash
# Crontab'ı düzenle
crontab -e

# Her gün saat 03:00'te yedek al
0 3 * * * cd /opt/lsv-cafe && ./scripts/backup-db.sh ubuntu >> /var/log/lsv-backup.log 2>&1
```

#### Yedekten Geri Yükleme

```bash
# Mevcut yedekleri listele
ls -lh backups/

# Belirli bir yedekten geri yükle
./scripts/restore-db.sh backups/lsv_cafe_db_20250110_030000.sql.gz
```

### Güncelleme

```bash
# Yeni kodu çek
cd /opt/lsv-cafe
git pull origin main

# Yeniden build et ve başlat
docker compose -f docker-compose.ubuntu.yml down
docker compose -f docker-compose.ubuntu.yml build
docker compose -f docker-compose.ubuntu.yml up -d

# Migrationları çalıştır
docker compose -f docker-compose.ubuntu.yml exec api npm run prisma:migrate:deploy
```

---

## Port Çakışması Çözümü

Eğer portlar hala çakışıyorsa:

### 1. Kullanılan Portları Kontrol Edin

```bash
# 8880 portunu kim kullanıyor?
sudo netstat -tulpn | grep 8880
# veya
sudo ss -tulpn | grep 8880
```

### 2. Farklı Portlar Kullanın

`.env.ubuntu` dosyasını düzenleyin:

```bash
nano .env.ubuntu
```

Portları değiştirin:

```bash
HTTP_PORT=9980    # Örnek alternatif
HTTPS_PORT=9943   # Örnek alternatif
DB_PORT=55432     # Örnek alternatif
```

`docker-compose.ubuntu.yml` dosyasını güncelleyin (port mapping'leri):

```yaml
services:
  db:
    ports:
      - "127.0.0.1:55432:5432"  # DB_PORT'u kullandınız port
  
  web:
    ports:
      - "9980:80"   # HTTP_PORT'u kullandığınız port
      - "9943:443"  # HTTPS_PORT'u kullandığınız port
```

Tekrar deploy edin:

```bash
./scripts/deploy-ubuntu.sh
```

---

## Sorun Giderme

### Container'lar Başlamıyor

```bash
# Logları kontrol edin
docker compose -f docker-compose.ubuntu.yml logs

# Belirli bir servisin logları
docker compose -f docker-compose.ubuntu.yml logs api
docker compose -f docker-compose.ubuntu.yml logs db
docker compose -f docker-compose.ubuntu.yml logs web
```

### Veritabanına Bağlanamıyor

```bash
# Veritabanı hazır mı?
docker compose -f docker-compose.ubuntu.yml exec db pg_isready -U lsv_user

# Manuel bağlantı testi
docker compose -f docker-compose.ubuntu.yml exec db psql -U lsv_user -d lsv_cafe_db
```

### Uygulamaya Erişilemiyor

```bash
# Firewall kontrol
sudo ufw status

# Container'lar çalışıyor mu?
docker compose -f docker-compose.ubuntu.yml ps

# Port mapping kontrolü
docker ps | grep lsv
```

### Disk Alanı Temizliği

```bash
# Kullanılmayan Docker imajlarını temizle
docker image prune -a

# Kullanılmayan volume'ları temizle
docker volume prune

# Tüm kullanılmayan kaynakları temizle (DİKKAT: Yedek alın!)
docker system prune -a --volumes
```

---

## Performans İyileştirme

### Nginx Cache Temizleme

```bash
docker compose -f docker-compose.ubuntu.yml exec web rm -rf /var/cache/nginx/*
docker compose -f docker-compose.ubuntu.yml restart web
```

### Veritabanı Optimizasyonu

```bash
# VACUUM çalıştır (ayda bir)
docker compose -f docker-compose.ubuntu.yml exec db psql -U lsv_user -d lsv_cafe_db -c "VACUUM ANALYZE;"
```

### Kaynak Kullanımını İzleme

```bash
# Container istatistikleri
docker stats

# Disk kullanımı
docker system df
```

---

## Güvenlik Notları

✅ **Yapılması gerekenler:**
- Admin şifresini hemen değiştirin
- `.env.ubuntu` dosyasını güvenli tutun (chmod 600)
- Düzenli yedek alın
- Sistemi güncel tutun
- Güçlü şifreler kullanın
- Firewall'u aktif edin

❌ **Yapılmaması gerekenler:**
- `.env.ubuntu` dosyasını paylaşmayın
- Default şifre ile production'da çalışmayın
- Yedeksiz güncelleme yapmayın
- Root kullanıcısı ile çalıştırmayın

---

## Destek

Sorun yaşarsanız:
1. Logları kontrol edin: `docker compose -f docker-compose.ubuntu.yml logs`
2. Container durumunu kontrol edin: `docker compose -f docker-compose.ubuntu.yml ps`
3. Port kullanımını kontrol edin: `sudo netstat -tulpn`

**Daha fazla bilgi:**
- İngilizce detaylı rehber: `DEPLOYMENT.md`
- Test rehberi: `TESTING.md`
- Backend detayları: `BACKEND_SPEC.md`
