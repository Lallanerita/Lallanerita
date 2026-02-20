from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import aiosqlite
from app.database import get_db
from app.utils.auth import get_current_admin

router = APIRouter(prefix="/banners", tags=["banners"])


class BannerCreate(BaseModel):
    image_url: str
    alt: Optional[str] = None
    display_order: Optional[int] = 0
    is_active: Optional[bool] = True


class BannerUpdate(BaseModel):
    image_url: Optional[str] = None
    alt: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


@router.get("")
async def get_banners(active_only: bool = True, db: aiosqlite.Connection = Depends(get_db)):
    if active_only:
        cursor = await db.execute("SELECT * FROM banners WHERE is_active = 1 ORDER BY display_order ASC")
    else:
        cursor = await db.execute("SELECT * FROM banners ORDER BY display_order ASC")
    rows = await cursor.fetchall()
    return [dict(r) for r in rows]


@router.post("")
async def create_banner(data: BannerCreate, db: aiosqlite.Connection = Depends(get_db), _=Depends(get_current_admin)):
    cursor = await db.execute(
        "INSERT INTO banners (image_url, alt, display_order, is_active) VALUES (?, ?, ?, ?)",
        (data.image_url, data.alt, data.display_order, 1 if data.is_active else 0)
    )
    await db.commit()
    banner_id = cursor.lastrowid
    cursor = await db.execute("SELECT * FROM banners WHERE id = ?", (banner_id,))
    row = await cursor.fetchone()
    return dict(row)


@router.put("/{banner_id}")
async def update_banner(banner_id: int, data: BannerUpdate, db: aiosqlite.Connection = Depends(get_db), _=Depends(get_current_admin)):
    cursor = await db.execute("SELECT * FROM banners WHERE id = ?", (banner_id,))
    existing = await cursor.fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Banner no encontrado")

    fields = []
    values = []
    if data.image_url is not None:
        fields.append("image_url = ?")
        values.append(data.image_url)
    if data.alt is not None:
        fields.append("alt = ?")
        values.append(data.alt)
    if data.display_order is not None:
        fields.append("display_order = ?")
        values.append(data.display_order)
    if data.is_active is not None:
        fields.append("is_active = ?")
        values.append(1 if data.is_active else 0)

    if fields:
        values.append(banner_id)
        await db.execute(f"UPDATE banners SET {', '.join(fields)} WHERE id = ?", values)
        await db.commit()

    cursor = await db.execute("SELECT * FROM banners WHERE id = ?", (banner_id,))
    row = await cursor.fetchone()
    return dict(row)


@router.delete("/{banner_id}")
async def delete_banner(banner_id: int, db: aiosqlite.Connection = Depends(get_db), _=Depends(get_current_admin)):
    await db.execute("DELETE FROM banners WHERE id = ?", (banner_id,))
    await db.commit()
    return {"detail": "Banner eliminado"}
