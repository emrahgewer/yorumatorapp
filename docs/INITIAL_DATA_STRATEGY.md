# Başlangıç Verisi Stratejisi

## Temel İlkeler
- Yorum verisinin ana kaynağı platform kullanıcılarıdır
- İlk dolum yalnızca telif içermeyen ürün meta verileri ve resmi API anlaşmalarıyla yapılır
- Web scraping sadece ürün teknik özellikleri gibi kamuya açık bilgiler için, robots.txt ve KVKK/GDPR uyumuna dikkat edilerek uygulanır

## Adımlar
1. **Ortaklık/API Tarama**
   - Hepsiburada, Trendyol, Amazon TR ürün katalog API girişimleri
   - Teknoloji yayınlarından RSS/JSON feed entegrasyonu
2. **İçerik Uyum Kontrolü**
   - Her entegrasyon için SLA + KVKK/GDPR maddeleri
   - Mülkiyet belirsizliği olan veri setleri otomatik olarak reddedilir
3. **Import Pipeline**
   - `ExternalSources` ve `ImportJobs` tabloları üzerinden takip
   - CSV/JSON şablonları `docs/import_templates/` altında tutulur
   - Her kayıt `is_verified=false` ile girilir, yönetici paneli onayı gerekir
4. **Kalite ve Güvenlik**
   - Duplicate tespiti için fingerprinting (brand+model+spec hash)
   - AI destekli tutarlılık kontrolü (örn. fiyat aralığı, kategori uyumu)
5. **Şeffaflık**
   - Kullanıcılara “Bu ürün üçüncü taraf API’sinden getirildi” etiketi
   - Veri sağlayıcı sözleşmeleri saklanır, kullanıcıya açıklanır

## Verinin Export/Import Formatı
- JSON Lines: `product`, `reviews`, `media`, `source` alanları
- CSV: Ürün kataloğu için zorunlu sütunlar (brand, model, category, specs_json)
- Şemalar backend’deki Pydantic modelleriyle eşleşir
