from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import aiosqlite
from app.database import get_db
from app.utils.auth import get_admin_user

router = APIRouter(prefix="/services", tags=["services"])


class ServiceCreate(BaseModel):
    title: str
    description: Optional[str] = None
    icon: Optional[str] = "Store"
    display_order: Optional[int] = 0
    is_active: Optional[bool] = True


class ServiceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


@router.get("")
async def get_services(active_only: bool = True, db: aiosqlite.Connection = Depends(get_db)):
    if active_only:
        cursor = await db.execute("SELECT * FROM services WHERE is_active = 1 ORDER BY display_order ASC")
    else:
        cursor = await db.execute("SELECT * FROM services ORDER BY display_order ASC")
    rows = await cursor.fetchall()
    return [dict(r) for r in rows]


@router.post("")
async def create_service(data: ServiceCreate, db: aiosqlite.Connection = Depends(get_db), _=Depends(get_admin_user)):
    cursor = await db.execute(
        "INSERT INTO services (title, description, icon, display_order, is_active) VALUES (?, ?, ?, ?, ?)",
        (data.title, data.description, data.icon, data.display_order, 1 if data.is_active else 0)
    )
    await db.commit()
    sid = cursor.lastrowid
    cursor = await db.execute("SELECT * FROM services WHERE id = ?", (sid,))
    row = await cursor.fetchone()
    return dict(row)


@router.put("/{service_id}")
async def update_service(service_id: int, data: ServiceUpdate, db: aiosqlite.Connection = Depends(get_db), _=Depends(get_admin_user)):
    cursor = await db.execute("SELECT * FROM services WHERE id = ?", (service_id,))
    existing = await cursor.fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    fields = []
    values = []
    if data.title is not None:
        fields.append("title = ?")
        values.append(data.title)
    if data.description is not None:
        fields.append("description = ?")
        values.append(data.description)
    if data.icon is not None:
        fields.append("icon = ?")
        values.append(data.icon)
    if data.display_order is not None:
        fields.append("display_order = ?")
        values.append(data.display_order)
    if data.is_active is not None:
        fields.append("is_active = ?")
        values.append(1 if data.is_active else 0)

    if fields:
        values.append(service_id)
        await db.execute(f"UPDATE services SET {', '.join(fields)} WHERE id = ?", values)
        await db.commit()

    cursor = await db.execute("SELECT * FROM services WHERE id = ?", (service_id,))
    row = await cursor.fetchone()
    return dict(row)


@router.delete("/{service_id}")
async def delete_service(service_id: int, db: aiosqlite.Connection = Depends(get_db), _=Depends(get_admin_user)):
    await db.execute("DELETE FROM services WHERE id = ?", (service_id,))
    await db.commit()
    return {"detail": "Servicio eliminado"}
