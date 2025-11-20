"""Seed database with sample users, products, and reviews."""
from __future__ import annotations

from contextlib import suppress

from app.core.security import get_password_hash
from app.crud import product as product_crud
from app.db.session import SessionLocal
from app.models.category import Category
from app.models.product import Product
from app.models.review import Review, ReviewStatusEnum
from app.models.user import User


def run() -> None:
    session = SessionLocal()
    try:
        # Mevcut verileri temizle (isteğe bağlı - yorum satırını kaldırarak aktif edebilirsiniz)
        # session.query(Review).delete()
        # session.query(Product).delete()
        # session.query(Category).delete()
        # session.query(User).filter(User.email.like("%@example.com")).delete()
        # session.commit()
        
        # Mevcut kategorileri kontrol et
        existing_categories = {cat.slug: cat for cat in session.query(Category).all()}
        
        # Users - mevcut değilse oluştur
        ayse = session.query(User).filter(User.email == "ayse@example.com").first()
        if not ayse:
            ayse = User(
                email="ayse@example.com",
                password_hash=get_password_hash("Test1234!"),
                full_name="Ayşe Demir",
                is_active=True,
            )
            session.add(ayse)
        
        mert = session.query(User).filter(User.email == "mert@example.com").first()
        if not mert:
            mert = User(
                email="mert@example.com",
                password_hash=get_password_hash("Test1234!"),
                full_name="Mert Kaya",
                is_active=True,
            )
            session.add(mert)
        
        session.flush()

        # Categories - mevcut değilse oluştur
        def get_or_create_category(name, slug, attributes):
            if slug in existing_categories:
                return existing_categories[slug]
            category = Category(name=name, slug=slug, attributes=attributes)
            session.add(category)
            existing_categories[slug] = category
            return category
        
        tv_category = get_or_create_category("Televizyon", "tv", {"panel_types": ["OLED", "QLED"]})
        laptop_category = get_or_create_category("Laptop", "laptop", {"cpu_brands": ["Intel", "AMD"]})
        buzdolabi_category = get_or_create_category("Buzdolabı", "buzdolabi", {"types": ["No-Frost", "Frost"]})
        robot_supurge_category = get_or_create_category("Robot Süpürge", "robot-supurge", {"features": ["Wi-Fi", "Mapping"]})
        camasir_makinesi_category = get_or_create_category("Çamaşır Makinesi", "camasir-makinesi", {"capacity": ["7kg", "9kg", "10kg"]})
        firin_category = get_or_create_category("Fırın", "firin", {"types": ["Elektrikli", "Gazlı"]})
        bulaşik_makinesi_category = get_or_create_category("Bulaşık Makinesi", "bulasik-makinesi", {"capacity": ["12 kişilik", "14 kişilik"]})
        klima_category = get_or_create_category("Klima", "klima", {"types": ["Split", "Mobil"]})
        telefon_category = get_or_create_category("Akıllı Telefon", "telefon", {"os": ["Android", "iOS"]})
        tablet_category = get_or_create_category("Tablet", "tablet", {"os": ["Android", "iOS", "Windows"]})
        
        session.flush()

        # Products - Televizyon
        neo_qled = Product(
            category=tv_category,
            brand="Samsung",
            model="Neo QLED 65",
            price=47999.90,
            specs={"panel": "QLED", "resolution": "4K", "inch": "65"},
            is_verified=True,
        )
        oled_tv = Product(
            category=tv_category,
            brand="LG",
            model="OLED evo C4",
            price=52999.00,
            specs={"panel": "OLED", "refresh_rate": "120Hz", "inch": "55"},
            is_verified=True,
        )
        sony_tv = Product(
            category=tv_category,
            brand="Sony",
            model="BRAVIA XR A95L",
            price=59999.00,
            specs={"panel": "OLED", "resolution": "4K", "inch": "65"},
            is_verified=True,
        )
        
        # Products - Laptop
        macbook = Product(
            category=laptop_category,
            brand="Apple",
            model="MacBook Air M4",
            price=64999.00,
            specs={"chip": "M4", "ram": "16GB", "storage": "512GB", "screen": "13.6 inch"},
            is_verified=True,
        )
        dell_laptop = Product(
            category=laptop_category,
            brand="Dell",
            model="XPS 15",
            price=54999.00,
            specs={"cpu": "Intel i7", "ram": "16GB", "storage": "1TB", "screen": "15.6 inch"},
            is_verified=True,
        )
        lenovo_laptop = Product(
            category=laptop_category,
            brand="Lenovo",
            model="ThinkPad X1 Carbon",
            price=49999.00,
            specs={"cpu": "Intel i7", "ram": "16GB", "storage": "512GB", "screen": "14 inch"},
            is_verified=True,
        )
        
        # Products - Buzdolabı
        samsung_buzdolabi = Product(
            category=buzdolabi_category,
            brand="Samsung",
            model="RF50A9670SG",
            price=34999.00,
            specs={"capacity": "500L", "type": "No-Frost", "energy_class": "A+++"},
            is_verified=True,
        )
        bosch_buzdolabi = Product(
            category=buzdolabi_category,
            brand="Bosch",
            model="KGN56VIE0N",
            price=27999.00,
            specs={"capacity": "560L", "type": "No-Frost", "energy_class": "A++"},
            is_verified=True,
        )
        arcelik_buzdolabi = Product(
            category=buzdolabi_category,
            brand="Arçelik",
            model="9153 NFI",
            price=22999.00,
            specs={"capacity": "515L", "type": "No-Frost", "energy_class": "A+++"},
            is_verified=True,
        )
        
        # Products - Robot Süpürge
        roomba_robot = Product(
            category=robot_supurge_category,
            brand="iRobot",
            model="Roomba j7+",
            price=24999.00,
            specs={"navigation": "Smart Mapping", "battery": "90 dk", "self_empty": True},
            is_verified=True,
        )
        xiaomi_robot = Product(
            category=robot_supurge_category,
            brand="Xiaomi",
            model="Mi Robot Vacuum Mop 2",
            price=8999.00,
            specs={"navigation": "LIDAR", "battery": "150 dk", "mopping": True},
            is_verified=True,
        )
        ecovacs_robot = Product(
            category=robot_supurge_category,
            brand="Ecovacs",
            model="Deebot X1 Omni",
            price=19999.00,
            specs={"navigation": "AI Vision", "battery": "120 dk", "self_empty": True},
            is_verified=True,
        )
        
        # Products - Çamaşır Makinesi
        bosch_camasir = Product(
            category=camasir_makinesi_category,
            brand="Bosch",
            model="WGA142X0TR",
            price=18999.00,
            specs={"capacity": "9kg", "energy_class": "A+++", "rpm": "1400"},
            is_verified=True,
        )
        arcelik_camasir = Product(
            category=camasir_makinesi_category,
            brand="Arçelik",
            model="9103 YM A+++",
            price=14999.00,
            specs={"capacity": "9kg", "energy_class": "A+++", "rpm": "1200"},
            is_verified=True,
        )
        siemens_camasir = Product(
            category=camasir_makinesi_category,
            brand="Siemens",
            model="WM14T4XTR",
            price=21999.00,
            specs={"capacity": "10kg", "energy_class": "A+++", "rpm": "1400"},
            is_verified=True,
        )
        
        # Products - Fırın
        siemens_firin = Product(
            category=firin_category,
            brand="Siemens",
            model="HB675GBS1",
            price=15999.00,
            specs={"type": "Elektrikli", "capacity": "71L", "functions": ["Piroliz", "Buhar"]},
            is_verified=True,
        )
        bosch_firin = Product(
            category=firin_category,
            brand="Bosch",
            model="HBA534BS0",
            price=12999.00,
            specs={"type": "Elektrikli", "capacity": "66L", "functions": ["Piroliz"]},
            is_verified=True,
        )
        
        # Products - Bulaşık Makinesi
        bosch_bulasik = Product(
            category=bulaşik_makinesi_category,
            brand="Bosch",
            model="SMS4HKI32TR",
            price=16999.00,
            specs={"capacity": "12 kişilik", "energy_class": "A+++", "programs": 6},
            is_verified=True,
        )
        siemens_bulasik = Product(
            category=bulaşik_makinesi_category,
            brand="Siemens",
            model="SN678D16TR",
            price=18999.00,
            specs={"capacity": "14 kişilik", "energy_class": "A+++", "programs": 7},
            is_verified=True,
        )
        
        # Products - Klima
        daikin_klima = Product(
            category=klima_category,
            brand="Daikin",
            model="Sensira FTXM35R",
            price=21999.00,
            specs={"type": "Split", "capacity": "3.5kW", "energy_class": "A+++"},
            is_verified=True,
        )
        mitsubishi_klima = Product(
            category=klima_category,
            brand="Mitsubishi Electric",
            model="MSZ-AP35VG",
            price=24999.00,
            specs={"type": "Split", "capacity": "3.5kW", "energy_class": "A+++"},
            is_verified=True,
        )
        
        # Products - Telefon
        iphone = Product(
            category=telefon_category,
            brand="Apple",
            model="iPhone 15 Pro",
            price=54999.00,
            specs={"storage": "256GB", "ram": "8GB", "camera": "48MP", "screen": "6.1 inch"},
            is_verified=True,
        )
        samsung_phone = Product(
            category=telefon_category,
            brand="Samsung",
            model="Galaxy S24 Ultra",
            price=49999.00,
            specs={"storage": "256GB", "ram": "12GB", "camera": "200MP", "screen": "6.8 inch"},
            is_verified=True,
        )
        xiaomi_phone = Product(
            category=telefon_category,
            brand="Xiaomi",
            model="14 Pro",
            price=29999.00,
            specs={"storage": "256GB", "ram": "12GB", "camera": "50MP", "screen": "6.73 inch"},
            is_verified=True,
        )
        
        # Products - Tablet
        ipad = Product(
            category=tablet_category,
            brand="Apple",
            model="iPad Air M2",
            price=24999.00,
            specs={"storage": "256GB", "screen": "11 inch", "chip": "M2"},
            is_verified=True,
        )
        samsung_tablet = Product(
            category=tablet_category,
            brand="Samsung",
            model="Galaxy Tab S9",
            price=19999.00,
            specs={"storage": "128GB", "screen": "11 inch", "s_pen": True},
            is_verified=True,
        )
        
        session.add_all([
            neo_qled, oled_tv, sony_tv,
            macbook, dell_laptop, lenovo_laptop,
            samsung_buzdolabi, bosch_buzdolabi, arcelik_buzdolabi,
            roomba_robot, xiaomi_robot, ecovacs_robot,
            bosch_camasir, arcelik_camasir, siemens_camasir,
            siemens_firin, bosch_firin,
            bosch_bulasik, siemens_bulasik,
            daikin_klima, mitsubishi_klima,
            iphone, samsung_phone, xiaomi_phone,
            ipad, samsung_tablet
        ])
        session.flush()

        # Reviews (approved)
        reviews = [
            Review(
                product=neo_qled,
                author=ayse,
                rating=5,
                title="Göz kamaştırıcı parlaklık",
                body="HDR performansı harika, karanlık sahnelerde bile detaylar net.",
                pros=["Parlaklık", "HDR"],
                cons=["Fiyat"],
                status=ReviewStatusEnum.approved,
            ),
            Review(
                product=neo_qled,
                author=mert,
                rating=4,
                title="Ses daha iyi olabilirdi",
                body="Görüntü mükemmel ama hoparlörler için soundbar şart.",
                pros=["Görüntü kalitesi"],
                cons=["Hoparlör"],
                status=ReviewStatusEnum.approved,
            ),
            Review(
                product=macbook,
                author=ayse,
                rating=5,
                title="Pil ömrü inanılmaz",
                body="12 saatten fazla çalışma süresi alıyorum, taşıması çok hafif.",
                pros=["Pil", "Hafiflik"],
                cons=["Port sınırlaması"],
                status=ReviewStatusEnum.approved,
            ),
        ]
        session.add_all(reviews)
        session.commit()

        # Tüm ürünler için rating cache'i güncelle
        all_products = session.query(Product).all()
        for product in all_products:
            with suppress(Exception):
                product_crud.refresh_rating_cache(session, str(product.id))

        print("Seed data inserted successfully.")
    finally:
        session.close()


if __name__ == "__main__":
    run()
