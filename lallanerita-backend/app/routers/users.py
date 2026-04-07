from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
import aiosqlite
from app.database import get_db
from app.utils.auth import get_admin_user, get_password_hash

router = APIRouter(prefix="/users", tags=["Usuarios"])


class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    phone: str = ""
    address: str = ""
    role: str = "buyer"


class UserUpdate(BaseModel):
    email: str | None = None
    name: str | None = None
    phone: str | None = None
    address: str | None = None
    role: str | None = None
    is_active: bool | None = None


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    phone: str | None
    address: str | None
    role: str
    is_active: bool
    created_at: str | None


@router.get("", response_model=List[UserResponse])
async def get_users(admin: dict = Depends(get_admin_user), db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute("SELECT id, email, name, phone, address, role, is_active, created_at FROM users ORDER BY created_at DESC")
    rows = await cursor.fetchall()
    return [UserResponse(id=r['id'], email=r['email'], name=r['name'], phone=r['phone'], address=r['address'], role=r['role'], is_active=bool(r['is_active']), created_at=r['created_at']) for r in rows]


@router.post("", response_model=UserResponse)
async def create_user(user: UserCreate, admin: dict = Depends(get_admin_user), db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute("SELECT id FROM users WHERE email = ?", (user.email,))
    if await cursor.fetchone():
        raise HTTPException(status_code=400, detail="Email ya registrado")
    password_hash = get_password_hash(user.password)
    cursor = await db.execute(
        "INSERT INTO users (email, password_hash, name, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)",
        (user.email, password_hash, user.name, user.phone, user.address, user.role)
    )
    await db.commit()
    return UserResponse(id=cursor.lastrowid, email=user.email, name=user.name, phone=user.phone, address=user.address, role=user.role, is_active=True, created_at=None)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user: UserUpdate, admin: dict = Depends(get_admin_user), db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute("SELECT id FROM users WHERE id = ?", (user_id,))
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    updates, values = [], []
    for field in ['email', 'name', 'phone', 'address', 'role']:
        val = getattr(user, field)
        if val is not None:
            updates.append(f"{field} = ?")
            values.append(val)
    if user.is_active is not None:
        updates.append("is_active = ?")
        values.append(1 if user.is_active else 0)
    if updates:
        values.append(user_id)
        await db.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", values)
        await db.commit()
    cursor = await db.execute("SELECT id, email, name, phone, address, role, is_active, created_at FROM users WHERE id = ?", (user_id,))
    row = await cursor.fetchone()
    return UserResponse(id=row['id'], email=row['email'], name=row['name'], phone=row['phone'], address=row['address'], role=row['role'], is_active=bool(row['is_active']), created_at=row['created_at'])


@router.delete("/{user_id}")
async def delete_user(user_id: int, admin: dict = Depends(get_admin_user), db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute("SELECT id FROM users WHERE id = ?", (user_id,))
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    await db.execute("UPDATE users SET is_active = 0 WHERE id = ?", (user_id,))
    await db.commit()
    return {"message": "Usuario desactivado"}
