from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
import aiosqlite
from app.database import get_db
from app.utils.auth import get_admin_user

router = APIRouter(prefix="/promotions", tags=["Promociones"])


class PromotionCreate(BaseModel):
    name: str
    description: str = ""
    discount_percent: float
    product_id: int | None = None
    category_id: int | None = None
    start_date: str
    end_date: str


class PromotionUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    discount_percent: float | None = None
    product_id: int | None = None
    category_id: int | None = None
    start_date: str | None = None
    end_date: str | None = None
    is_active: bool | None = None


class PromotionResponse(BaseModel):
    id: int
    name: str
    description: str | None
    discount_percent: float
    product_id: int | None
    product_name: str | None
    category_id: int | None
    category_name: str | None
    start_date: str
    end_date: str
    is_active: bool


PROMO_SELECT = """
    SELECT pr.id, pr.name, pr.description, pr.discount_percent,
           pr.product_id, p.name as product_name,
           pr.category_id, c.name as category_name,
           pr.start_date, pr.end_date, pr.is_active
    FROM promotions pr
    LEFT JOIN products p ON pr.product_id = p.id
    LEFT JOIN categories c ON pr.category_id = c.id
"""


def _build_promo(row: aiosqlite.Row) -> PromotionResponse:
    return PromotionResponse(
        id=row['id'], name=row['name'], description=row['description'],
        discount_percent=row['discount_percent'], product_id=row['product_id'],
        product_name=row['product_name'], category_id=row['category_id'],
        category_name=row['category_name'], start_date=row['start_date'],
        end_date=row['end_date'], is_active=bool(row['is_active'])
    )


@router.get("", response_model=List[PromotionResponse])
async def get_active_promotions(db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute(PROMO_SELECT + " WHERE pr.is_active = 1 AND datetime('now') BETWEEN pr.start_date AND pr.end_date ORDER BY pr.created_at DESC")
    rows = await cursor.fetchall()
    return [_build_promo(row) for row in rows]


@router.get("/all", response_model=List[PromotionResponse])
async def get_all_promotions(admin: dict = Depends(get_admin_user), db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute(PROMO_SELECT + " ORDER BY pr.created_at DESC")
    rows = await cursor.fetchall()
    return [_build_promo(row) for row in rows]


@router.get("/{promotion_id}", response_model=PromotionResponse)
async def get_promotion(promotion_id: int, db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute(PROMO_SELECT + " WHERE pr.id = ?", (promotion_id,))
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Promocion no encontrada")
    return _build_promo(row)


@router.post("", response_model=PromotionResponse)
async def create_promotion(promo: PromotionCreate, admin: dict = Depends(get_admin_user), db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute(
        "INSERT INTO promotions (name, description, discount_percent, product_id, category_id, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (promo.name, promo.description, promo.discount_percent, promo.product_id, promo.category_id, promo.start_date, promo.end_date)
    )
    await db.commit()
    cursor = await db.execute(PROMO_SELECT + " WHERE pr.id = ?", (cursor.lastrowid,))
    row = await cursor.fetchone()
    return _build_promo(row)


@router.put("/{promotion_id}", response_model=PromotionResponse)
async def update_promotion(promotion_id: int, promo: PromotionUpdate, admin: dict = Depends(get_admin_user), db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute("SELECT id FROM promotions WHERE id = ?", (promotion_id,))
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Promocion no encontrada")
    updates, values = [], []
    for field in ['name', 'description', 'discount_percent', 'product_id', 'category_id', 'start_date', 'end_date']:
        val = getattr(promo, field)
        if val is not None:
            updates.append(f"{field} = ?")
            values.append(val)
    if promo.is_active is not None:
        updates.append("is_active = ?")
        values.append(1 if promo.is_active else 0)
    if updates:
        values.append(promotion_id)
        await db.execute(f"UPDATE promotions SET {', '.join(updates)} WHERE id = ?", values)
        await db.commit()
    cursor = await db.execute(PROMO_SELECT + " WHERE pr.id = ?", (promotion_id,))
    row = await cursor.fetchone()
    return _build_promo(row)


@router.delete("/{promotion_id}")
async def delete_promotion(promotion_id: int, admin: dict = Depends(get_admin_user), db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute("SELECT id FROM promotions WHERE id = ?", (promotion_id,))
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Promocion no encontrada")
    await db.execute("DELETE FROM promotions WHERE id = ?", (promotion_id,))
    await db.commit()
    return {"message": "Promocion eliminada"}
