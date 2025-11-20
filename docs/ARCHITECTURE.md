# Yorumator Mimarisi

## Genel Bakış
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL
- **Frontend**: Next.js 14 App Router + TypeScript + Tailwind CSS
- **ML Servisleri**: NLP özetleme ve içerik denetimi için bağımsız servis katmanı
- **Async İşler**: AWS SQS / Azure Service Bus / GCP PubSub uyumlu kuyruklar Celery veya Dramatiq ile
- **Depolama**: Yorum medyası için S3 uyumlu obje depolama, KVKK uyumlu şifreleme

## Dizin Yapısı
```
yorumatorapp/
├── backend/
│   ├── app/
│   │   ├── api/            # FastAPI routerları, bağımlılıklar
│   │   ├── core/           # Ayarlar, güvenlik, logging
│   │   ├── crud/           # Repository katmanı
│   │   ├── db/             # SQLAlchemy oturumu ve Base
│   │   ├── models/         # ORM modelleri
│   │   ├── schemas/        # Pydantic şemaları
│   │   └── services/       # NLP, moderasyon, dış API entegrasyonları
│   ├── pyproject.toml
│   └── README.md
├── frontend/
│   ├── src/app/            # Next.js route group yapısı
│   ├── src/components/
│   └── src/lib/            # API client, util fonksiyonlar
└── docs/
    ├── ARCHITECTURE.md
    ├── DATABASE_SCHEMA.md
    └── INITIAL_DATA_STRATEGY.md
```

## Katmanlı Servis Akışı
1. **API Katmanı**: Auth, ürün, yorum, KVKK endpointleri
2. **Service Katmanı**: NLP özetleme, içerik moderasyonu, medya işleme
3. **DB Katmanı**: PostgreSQL üzerinde ACID garantili işlemler
4. **Queue Worker**: Yorum doğrulama, anahtar kelime indeksleme, 2FA bildirimi
5. **Frontend**: SSR/ISR ile hızlı listeleme + güvenli form işlemleri

### Denormalizasyon ve Cache
- Ürünler tablosu `average_rating` ve `review_count` alanlarını içerir; her onaylı yorum sonrası `refresh_rating_cache` ile güncellenir.
- Mobil istemciler ürün listelerini ve detaylarını bu alanlardan direkt okuyarak ek sorgu yapmadan güncel puanları gösterir.
- Uzun vadede bu hook bir mesaj kuyruğuna bağlanarak cache invalidation veya analitik servislerini tetikleyebilir.

## Güvenlik Önlemleri
- Argon2 tabanlı şifre hashleme (`passlib[argon2]`)
- Opsiyonel TOTP 2FA (PyOTP) ve yedek kodlar
- OAuth 2.0 Password Flow + kısa ömürlü JWT + refresh token
- Rate limiting (örn. Redis tabanlı) + reCAPTCHA v3 entegrasyonu
- İçerik moderasyonu için AI destekli skor + manuel onay kuyruğu
- KVKK/GDPR hakları için veri ihracı ve anonimleştirme endpointleri

## Dağıtım
- Docker Compose ile lokal, Terraform ile bulut altyapısı
- PostgreSQL + Redis + MinIO servisleri
- CI/CD’de OWASP ZAP, Bandit, ESLint, Jest, Pytest
