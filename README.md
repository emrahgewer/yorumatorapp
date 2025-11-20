# Yorumator – Elektronik Ürün Karar Destek Platformu

Bu depo, Yorumator uygulamasının uçtan uca mimarisini, backend ve frontend iskelet kodlarını ve KVKK/GDPR uyumlu temel fonksiyonlarını içerir.

## İçerik
- `backend/`: FastAPI tabanlı servis, PostgreSQL ve SQLAlchemy ile
- `frontend/`: Next.js 14 + TypeScript istemcisi
- `docs/`: Mimari, şema ve veri stratejisi dokümanları

## Çalıştırma (Özet)
1. `.env.example` dosyalarını kopyalayıp ortam değişkenlerini doldurun
2. Backend için:
   ```bash
   cd backend
   uv venv && uv pip sync requirements.txt # veya `pip install -r ...`
   uvicorn app.main:app --reload
   ```
3. Frontend için:
   ```bash
   cd frontend
   pnpm install
   pnpm dev
   ```

Ayrıntılı talimatlar ilgili dizinlerdeki README dosyalarında yer alır.
