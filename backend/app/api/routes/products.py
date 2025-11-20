from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.crud import product as product_crud
from app.schemas.product import ProductCreate, ProductDetail, ProductRead, ProductSummary

router = APIRouter()


@router.get("/", response_model=list[ProductSummary])
def list_products(
    db: Session = Depends(deps.get_db_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    brand: str | None = Query(None, description="Marka filtrelemesi"),
    category_id: str | None = Query(None, description="Kategori ID filtresi"),
    search: str | None = Query(None, description="Arama terimi (marka veya model)"),
    sort_by: str | None = Query(
        None, 
        description="Sıralama kriteri: price_asc (fiyat artan), price_desc (fiyat azalan), rating_desc (puan azalan)"
    ),
    min_rating: float | None = Query(None, ge=0.0, le=5.0, description="Minimum ortalama puan filtresi"),
):
    import logging
    logger = logging.getLogger(__name__)
    if search:
        logger.info(f"Search query received: {search}")
    if sort_by:
        logger.info(f"Sort by: {sort_by}")
    if min_rating is not None:
        logger.info(f"Min rating filter: {min_rating}")
    
    products = product_crud.get_multi(
        db,
        skip=skip,
        limit=limit,
        brand=brand,
        category_id=category_id,
        search=search,
        sort_by=sort_by,
        min_rating=min_rating,
    )
    
    if search:
        logger.info(f"Search results: {len(products)} products found")
    return [ProductSummary.model_validate(prod) for prod in products]


@router.get("/{product_id}", response_model=ProductDetail)
def get_product(product_id: str, db: Session = Depends(deps.get_db_session)):
    product = product_crud.get(db, product_id=product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductDetail.model_validate(product)


@router.get("/brands/", response_model=list[str])
def list_brands(db: Session = Depends(deps.get_db_session)):
    """
    Veritabanındaki tüm ürünlerin tekilleştirilmiş markalarını listeler.
    Markalar alfabetik olarak sıralanır.
    """
    brands = product_crud.get_distinct_brands(db)
    return brands


@router.post("/", response_model=ProductRead, status_code=201)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(deps.get_db_session),
    current_user=Depends(deps.get_current_user),
):
    """
    Yeni ürün oluştur. Sadece giriş yapmış kullanıcılar bu endpoint'i kullanabilir.
    
    Gerekli alanlar:
    - category_id: Kategori UUID'si (string formatında)
    - brand: Ürün markası
    - model: Ürün modeli
    
    Opsiyonel alanlar:
    - sku: Ürün SKU kodu
    - price: Ürün fiyatı
    - currency: Para birimi (varsayılan: TRY)
    - specs: Teknik özellikler (JSON objesi)
    """
    try:
        product = product_crud.create(db, product_in=payload)
        return ProductRead.model_validate(product)
    except ValueError as e:
        error_message = str(e)
        if "not found" in error_message.lower():
            raise HTTPException(status_code=404, detail=error_message)
        raise HTTPException(status_code=400, detail=error_message)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error creating product: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ürün oluşturulurken bir hata oluştu: {str(e)}")
