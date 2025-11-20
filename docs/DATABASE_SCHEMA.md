# Veritabanı Şeması

## ER Diyagramı (Metinsel)
```
Users (id PK) 1---* Reviews
Users (id PK) 1---* MediaAssets
Users (id PK) 1---* Sessions
Users (id PK) 1---* UserConsents

Categories (id PK, parent_id FK->Categories)
Categories 1---* Products

Products (id PK) 1---* Reviews
Products (id PK) 1---* MediaAssets

Reviews (id PK)
Reviews 1---* ReviewVotes
Reviews 1---* ReviewAspects

ExternalSources (id PK) 1---* ImportJobs
```

## Tablo Tanımları (Özet)
### users
- `id` UUID PK
- `email` unique index
- `password_hash` Argon2
- `is_active`, `is_superuser`, `two_factor_enabled`
- `two_factor_secret`, `backup_codes`
- `created_at`, `updated_at`, `deleted_at`

### categories
- `id` UUID PK
- `name`, `slug`, `parent_id`
- `attributes` JSONB (örn. TV için ekran boyutu)

### products
- `id` UUID PK
- `category_id` FK
- `brand`, `model`, `sku`, `price`, `specs` JSONB
- `is_verified`, `import_source`
- `average_rating` NUMERIC(3,2) (denormalize edilmiş ortalama)
- `review_count` INT (toplam onaylı yorum sayısı)

### reviews
- `id` UUID PK
- `product_id`, `user_id`
- `rating` (1-5), `title`, `body`
- `pros` TEXT[], `cons` TEXT[]
- `status` (pending/approved/rejected)
- `ai_flags` JSONB (toxicity, spam skoru)

### review_aspects
- `id` UUID PK
- `review_id`
- `aspect` (örn. Battery, Display)
- `sentiment_score` (-1 ile 1 arası)
- `confidence`

### media_assets
- `id` UUID PK
- `owner_id`, `product_id`, `review_id`
- `type` (image/video)
- `storage_key`, `checksum`, `width`, `height`

### review_votes
- `id` UUID PK
- `review_id`, `user_id`
- `vote` (-1/1)
- benzersiz indeks (`review_id`, `user_id`)

### user_consents
- KVKK/GDPR için `user_id`, `purpose`, `granted_at`, `revoked_at`

### import_jobs
- Dış veri kaynakları için `source`, `status`, `payload`, `error`

## İndeksleme Stratejisi
- `GIN` indeksleri: `products.specs`, `reviews.ai_flags`, `reviews.pros/cons`
- `tsvector` alanı: yorum metninde anahtar kelime araması
- Zaman serisi sorguları için `created_at` indeksleri

## Yetkilendirme & Silme
- Soft delete sütunu `deleted_at`
- GDPR talebi geldiğinde ilişkili tüm tablolarda cascading soft delete
