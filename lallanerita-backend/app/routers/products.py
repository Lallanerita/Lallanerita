from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import aiosqlite
from app.database import get_db
from app.utils.auth import get_admin_user

router = APIRouter(prefix="/products", tags=["Productos"])


class ProductCreate(BaseModel):
    name: str
    description: str = ""
    price: float
    unit: str = "und"
    category_id: int | None = None
    image_url: str = ""
    image_url_2: str = ""
    stock: float = 0
    min_order: float = 1


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    unit: str | None = None
    category_id: int | None = None
    image_url: str | None = None
    image_url_2: str | None = None
    stock: float | None = None
    min_order: float | None = None
    is_active: bool | None = None


class ProductResponse(BaseModel):
    id: int
    name: str
    description: str | None
    price: float
    unit: str
    category_id: int | None
    category_name: str | None
    image_url: str | None
    image_url_2: str | None
    stock: float
    min_order: float
    is_active: bool
    discount_percent: float | None = None
    final_price: float | None = None


PRODUCT_QUERY = """
    SELECT p.id, p.name, p.description, p.price, p.unit, p.category_id,
           c.name as category_name, p.image_url, p.image_url_2, p.stock, p.min_order, p.is_active,
           (SELECT MAX(pr.discount_percent) FROM promotions pr
            WHERE (pr.product_id = p.id OR pr.category_id = p.category_id)
            AND pr.is_active = 1
            AND datetime('now') BETWEEN pr.start_date AND pr.end_date) as discount_percent
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
"""


def _build_product_response(row: aiosqlite.Row) -> ProductResponse:
    discount = row['discount_percent'] or 0
    final_price = row['price'] * (1 - discount / 100) if discount else row['price']
    return ProductResponse(
        id=row['id'], name=row['name'], description=row['description'],
        price=row['price'], unit=row['unit'], category_id=row['category_id'],
        category_name=row['category_name'], image_url=row['image_url'],
        image_url_2=row['image_url_2'], stock=row['stock'], min_order=row['min_order'],
        is_active=bool(row['is_active']),
        discount_percent=discount if discount else None,
        final_price=round(final_price, 2)
    )


@router.get("", response_model=List[ProductResponse])
async def get_products(
    category_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    active_only: bool = Query(True),
    db: aiosqlite.Connection = Depends(get_db)
):
    query = PRODUCT_QUERY + " WHERE 1=1"
    params: list = []
    if active_only:
        query += " AND p.is_active = 1"
    if category_id:
        query += " AND p.category_id = ?"
        params.append(category_id)
    if search:
        query += " AND (LOWER(p.name) LIKE LOWER(?) OR LOWER(p.description) LIKE LOWER(?))"
        params.extend([f"%{search}%", f"%{search}%"])
    query += " ORDER BY p.name"
    cursor = await db.execute(query, params)
    rows = await cursor.fetchall()
    return [_build_product_response(row) for row in rows]


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute(PRODUCT_QUERY + " WHERE p.id = ?", (product_id,))
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return _build_product_response(row)


@router.post("", response_model=ProductResponse)
async def create_product(product: ProductCreate, admin: dict = Depends(get_admin_user), db: aiosqlite.Connection = Depends(get_db)):
    if product.category_id:
        cursor = await db.execute("SELECT id FROM categories WHERE id = ?", (product.category_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=400, detail="Categoria no encontrada")
    cursor = await db.execute(
        "INSERT INTO products (name, description, price, unit, category_id, image_url, image_url_2, stock, min_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (product.name, product.description, product.price, product.unit, product.category_id, product.image_url, product.image_url_2, product.stock, product.min_order)
    )
    await db.commit()
    cursor = await db.execute(PRODUCT_QUERY + " WHERE p.id = ?", (cursor.lastrowid,))
    row = await cursor.fetchone()
    return _build_product_response(row)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(product_id: int, product: ProductUpdate, admin: dict = Depends(get_admin_user), db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute("SELECT id FROM products WHERE id = ?", (product_id,))
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    updates, values = [], []
    for field in ['name', 'description', 'price', 'unit', 'category_id', 'image_url', 'image_url_2', 'stock', 'min_order']:
        val = getattr(product, field)
        if val is not None:
            updates.append(f"{field} = ?")
            values.append(val)
    if product.is_active is not None:
        updates.append("is_active = ?")
        values.append(1 if product.is_active else 0)
    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        values.append(product_id)
        await db.execute(f"UPDATE products SET {', '.join(updates)} WHERE id = ?", values)
        await db.commit()
    cursor = await db.execute(PRODUCT_QUERY + " WHERE p.id = ?", (product_id,))
    row = await cursor.fetchone()
    return _build_product_response(row)


@router.delete("/{product_id}")
async def delete_product(product_id: int, admin: dict = Depends(get_admin_user), db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute("SELECT id FROM products WHERE id = ?", (product_id,))
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    await db.execute("UPDATE products SET is_active = 0 WHERE id = ?", (product_id,))
    await db.commit()
    return {"message": "Producto desactivado exitosamente"}
