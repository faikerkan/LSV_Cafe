# LSV Cafe Backend API

LSV Cafe Etkinlik Yönetim Sistemi için RESTful API.

## Kurulum ve Çalıştırma

### Gereksinimler
*   Node.js v18+
*   PostgreSQL
*   Docker (Opsiyonel)

### Yerel Geliştirme

1.  Bağımlılıkları yükleyin:
    ```bash
    cd backend
    npm install
    ```

2.  `.env` dosyası oluşturun:
    ```
    DATABASE_URL="postgresql://user:password@localhost:5432/lsv_cafe_db"
    JWT_SECRET="gizli_anahtar"
    ```

3.  Veritabanını hazırlayın:
    ```bash
    npx prisma db push
    npm run seed
    ```

4.  Sunucuyu başlatın:
    ```bash
    npm run dev
    ```

### Docker ile Çalıştırma (Ubuntu Sunucu)

Ana dizinde:
```bash
docker-compose up -d --build
```
Bu komut veritabanını, API'yi ve Frontend'i başlatır.

## API Dokümantasyonu

### Auth
*   **POST** `/api/auth/login` - Giriş yap.
    *   Body: `{ "password": "admin123" }` (Varsayılan admin şifresi)

### Events
*   **GET** `/api/events` - Tüm etkinlikleri listele.
*   **POST** `/api/events` - Yeni etkinlik oluştur (Çakışma kontrolü yapılır).
*   **PUT** `/api/events/:id` - Etkinlik güncelle.
*   **DELETE** `/api/events/:id` - Etkinlik sil.

## Veritabanı Şeması

`Events` ve `Users` olmak üzere iki ana tablo vardır. Şema detayları `prisma/schema.prisma` dosyasındadır.