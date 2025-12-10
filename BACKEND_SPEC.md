# LSV Cafe Event Management System - Backend Spesifikasyonu

Bu doküman, LSV Cafe Rezervasyon Sistemi'nin frontend prototipinden (React/LocalStorage) gerçek bir sunucu mimarisine (Node.js/PostgreSQL) taşınması için gereken teknik gereksinimleri, veritabanı şemasını ve dağıtım adımlarını içerir.

## 1. Teknoloji Yığını (Önerilen)

Ubuntu sunucusu üzerinde performanslı, ölçeklenebilir ve bakımı kolay bir yapı için aşağıdaki teknoloji yığını önerilmektedir:

*   **Dil:** TypeScript (Frontend ile tip paylaşımı için)
*   **Runtime:** Node.js (v18+)
*   **Framework:** Express.js veya NestJS
*   **Veritabanı:** PostgreSQL (İlişkisel veriler ve tarih sorguları için en iyisi)
*   **ORM:** Prisma veya TypeORM
*   **Auth:** JWT (JSON Web Tokens)
*   **Containerization:** Docker & Docker Compose (Kolay kurulum için)

---

## 2. Veritabanı Tasarımı (PostgreSQL Şeması)

### Tablo: Users (Kullanıcılar)
Yönetici ve yetkili personel girişi için.

| Sütun | Tip | Açıklama |
|---|---|---|
| `id` | UUID (PK) | Benzersiz Kimlik |
| `username` | VARCHAR(50) | Kullanıcı Adı (Unique) |
| `password_hash` | VARCHAR(255) | Bcrypt ile hashlenmiş şifre |
| `role` | VARCHAR(20) | 'ADMIN' veya 'USER' |
| `created_at` | TIMESTAMP | Kayıt tarihi |

### Tablo: Events (Etkinlikler)
Tüm rezervasyon verilerini tutar.

| Sütun | Tip | Açıklama |
|---|---|---|
| `id` | UUID (PK) | Benzersiz Kimlik |
| `title` | VARCHAR(150) | Etkinlik Başlığı |
| `department` | VARCHAR(50) | Departman Adı (Enum) |
| `description` | TEXT | Açıklama |
| `start_date` | TIMESTAMP | Başlangıç Zamanı (ISO 8601) |
| `end_date` | TIMESTAMP | Bitiş Zamanı (ISO 8601) |
| `status` | VARCHAR(20) | PENDING, APPROVED, REJECTED, COMPLETED |
| `location` | VARCHAR(100) | Mekan Adı (Örn: LSV Cafe) |
| `attendees` | INTEGER | Beklenen Kişi Sayısı |
| `contact_person` | VARCHAR(100) | İlgili Kişi Adı |
| `requirements` | TEXT | Özel İstekler (Opsiyonel) |
| `resources` | TEXT[] | Seçilen Kaynaklar Array'i (Projeksiyon vb.) |
| `actual_attendees`| INTEGER | Gerçekleşen Kişi (Raporlama için) |
| `outcome_notes` | TEXT | Sonuç Notları (Raporlama için) |
| `created_at` | TIMESTAMP | Oluşturulma Tarihi |
| `updated_at` | TIMESTAMP | Son Güncelleme |

---

## 3. API Uç Noktaları (Endpoints)

Tüm istekler JSON formatında yapılmalı ve başarılı yanıtlarda `200/201`, hatalarda `400/401/403/500` HTTP kodları dönülmelidir.

### Auth
*   `POST /api/auth/login`
    *   **Body:** `{ "password": "..." }` (veya username/password)
    *   **Response:** `{ "success": true, "token": "eyJ..." }`

### Events
*   `GET /api/events`
    *   **Query Params:** `?startDate=2023-01-01&endDate=2023-01-31`
    *   **Response:** `CafeEvent[]`
*   `GET /api/events/:id`
    *   **Response:** Tekil `CafeEvent` detayı.
*   `POST /api/events`
    *   **Header:** `Authorization: Bearer <TOKEN>` (Sadece yetkililer ise, halka açıksa tokensız)
    *   **Body:** `CafeEvent` (id hariç)
    *   **Logic:** Kaydetmeden önce **Çakışma Kontrolü (Conflict Check)** yapılmalıdır.
*   `PUT /api/events/:id`
    *   **Header:** `Authorization: Bearer <TOKEN>` (Admin only)
    *   **Body:** Güncellenecek alanlar.
*   `DELETE /api/events/:id`
    *   **Header:** `Authorization: Bearer <TOKEN>` (Admin only)

---

## 4. Kritik İş Mantığı (Business Logic)

### A. Çakışma Kontrolü (Conflict Detection)
Bir etkinlik kaydedilirken (`POST` veya `PUT`), veritabanında şu koşulları sağlayan başka bir etkinlik var mı kontrol edilmelidir:

1.  **Zaman Çakışması:**
    *   `(YeniBaslangic < MevcutBitis) AND (YeniBitis > MevcutBaslangic)`
2.  **Mekan veya Kaynak Çakışması:**
    *   `(Mekanlar Ayni) OR (KesisimKumesi(YeniKaynaklar, MevcutKaynaklar, ['Projeksiyon', 'Ses Sistemi']) > 0)`
3.  **Durum Kontrolü:**
    *   Sadece `APPROVED` veya `PENDING` olan etkinlikler çakışma yaratır. `REJECTED` olanlar görmezden gelinmelidir.

### B. Race Condition Önleme (Concurrency)
İki kullanıcı aynı milisaniyede aynı saate rezervasyon yapmaya çalışırsa ne olur?
*   Backend tarafında **Database Transaction** kullanılmalıdır.
*   Transaction seviyesi `SERIALIZABLE` olarak ayarlanmalı veya tablo satırları kilitlenmelidir.

---

## 5. Test Senaryoları (QA)

Backend geliştirildikten sonra aşağıdaki senaryolar test edilmelidir:

| Senaryo ID | Açıklama | Beklenen Sonuç |
|---|---|---|
| **TS-01** | Boş tarihe etkinlik ekleme | `201 Created` döner, veritabanına kayıt düşer. |
| **TS-02** | Dolu tarihe/saate etkinlik ekleme | `409 Conflict` döner, hata mesajı: "Mekan dolu". |
| **TS-03** | Geçmiş tarihe etkinlik ekleme | `400 Bad Request` (İsteğe bağlı kural). |
| **TS-04** | Admin girişi yapmadan silme denemesi | `401 Unauthorized` döner. |
| **TS-05** | Yanlış şifre ile giriş | `401 Unauthorized` döner. |
| **TS-06** | "Projeksiyon" kullanılan saate 2. projeksiyon talebi | `409 Conflict` döner (Eğer kaynak stoğu 1 ise). |
| **TS-07** | Listeleme API'si performans testi | 1000+ etkinlik varken yanıt süresi < 200ms olmalı. |

---

## 6. Ubuntu Sunucu Kurulum Adımları (Deployment)

Projeyi kendi sunucunuzda ayağa kaldırmak için:

### Adım 1: Ortam Hazırlığı
```bash
sudo apt update
sudo apt install docker.io docker-compose -y
```

### Adım 2: Docker Compose Dosyası
Sunucuda bir `docker-compose.yml` oluşturun:

```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: lsv_user
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: lsv_cafe_db
    volumes:
      - pgdata:/var/lib/postgresql/data

  api:
    build: ./backend  # Backend kodunuzun olduğu klasör
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://lsv_user:secure_password@db:5432/lsv_cafe_db
      JWT_SECRET: super_secret_key
    depends_on:
      - db

  web:
    build: ./frontend # Frontend (React) kodunuz
    ports:
      - "80:80"
    depends_on:
      - api

volumes:
  pgdata:
```

### Adım 3: Çalıştırma
```bash
docker-compose up -d --build
```

### Adım 4: Frontend Yapılandırması
Frontend kodundaki (`services/api.ts`) dosyasında `USE_MOCK_BACKEND = false` yapın ve `API_BASE_URL`'i sunucunuzun IP adresi veya domaini olarak güncelleyin.
