# Yorumator Backend

## Kurulum ve Çalıştırma
1. Ortam değişkenlerini hazırlayın:
   ```bash
   cp .env.example .env
   # .env içinde PostgreSQL kullanıcı/şifre/DB bilgilerini güncelleyin
   ```
2. Sanal ortamı oluşturup bağımlılıkları kurun:
   ```bash
   uv venv && source .venv/Scripts/activate    # Windows için .venv\\Scripts\\activate
   pip install -r requirements.txt             # veya `uv pip install ".[dev]"`
   ```
3. Alembic ile veritabanı şemasını oluşturun:
   ```bash
   alembic upgrade head
   ```
4. Örnek veri yüklemek için seed script'ini çalıştırın:
   ```bash
   python -m scripts.seed_data
   ```
5. Geliştirme sunucusunu başlatın:
   ```bash
   uvicorn app.main:app --reload
   ```

## Öne Çıkanlar
- FastAPI + SQLAlchemy 2.0 + PostgreSQL
- JWT + Opsiyonel TOTP 2FA
- KVKK/GDPR veri erişim ve silme endpointleri
- NLP tabanlı yorum özetleme ve moderasyon servisleri için hooklar

## Komutlar
- `alembic upgrade head`: Şemayı en son migrasyona taşır
- `python -m scripts.seed_data`: Örnek kullanıcı, ürün ve yorum verisi yükler
- `pytest`: Backend testleri (varsa)
- `ruff check app`: Statik analiz

## Servis Haritası
- `/api/v1/auth/*`: OAuth2 password, refresh, 2FA
- `/api/v1/products/*`: Ürün katalog yönetimi
- `/api/v1/reviews/*`: Yorum gönderme ve moderasyon
- `/api/v1/gdpr/*`: Veri indirme/silme talepleri

## API Keşfi ve Geliştirici Notları
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Ham OpenAPI JSON: `http://localhost:8000/openapi.json`

### Örnek İstekler
**JWT gerektirmeyen çağrı (ürün yorumları)**
```bash
curl "http://localhost:8000/api/v1/products/{product_id}/reviews?limit=5"
```

**JWT gerektiren çağrı (yeni yorum oluşturma)**
```bash
ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
curl -X POST http://localhost:8000/api/v1/reviews/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "product_id": "product-uuid",
        "rating": 5,
        "title": "Harika cihaz",
        "body": "Ekran ve pil ömrü superb",
        "pros": ["Pil", "Ekran"],
        "cons": ["Fiyat"]
      }'
```
Token, `/api/v1/auth/login` endpoint'ine kullanıcı kimlik bilgileri gönderilerek alınır ve tüm korumalı çağrılarda `Authorization: Bearer <token>` başlığı ile gönderilir.
