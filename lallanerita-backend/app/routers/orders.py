from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import aiosqlite
from app.database import get_db
from app.utils.auth import get_current_user, get_admin_user

router = APIRouter(prefix="/orders", tags=["Pedidos"])


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: float


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    notes: str = ""


class AdminOrderCreate(BaseModel):
    user_id: int
    items: List[OrderItemCreate]
    notes: str = ""


class GuestOrderCreate(BaseModel):
    guest_name: str
    guest_phone: str
    guest_address: str
    payment_method: str
    items: List[OrderItemCreate]
    notes: str = ""


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: float
    price: float
    discount: float
    subtotal: float


class OrderResponse(BaseModel):
    id: int
    user_id: int | None
    user_name: str
    user_phone: str | None
    guest_name: str | None = None
    guest_phone: str | None = None
    guest_address: str | None = None
    payment_method: str | None = None
    status: str
    total: float
    notes: str | None
    items: List[OrderItemResponse]
    created_at: str


class OrderStatusUpdate(BaseModel):
    status: str


async def _get_order_items(db: aiosqlite.Connection, order_id: int) -> List[OrderItemResponse]:
    cursor = await db.execute("""
        SELECT oi.id, oi.product_id, p.name as product_name, oi.quantity, oi.price, oi.discount
        FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?
    """, (order_id,))
    items = await cursor.fetchall()
    return [OrderItemResponse(
        id=item['id'], product_id=item['product_id'], product_name=item['product_name'],
        quantity=item['quantity'], price=item['price'], discount=item['discount'],
        subtotal=round(item['quantity'] * item['price'] * (1 - item['discount'] / 100), 2)
    ) for item in items]


async def _build_order_response(db: aiosqlite.Connection, order: aiosqlite.Row) -> OrderResponse:
    items = await _get_order_items(db, order['id'])
    user_name = order['user_name'] if order['user_name'] else order['guest_name'] or 'Invitado'
    user_phone = order['user_phone'] if order['user_phone'] else order['guest_phone']
    return OrderResponse(
        id=order['id'], user_id=order['user_id'], user_name=user_name, user_phone=user_phone,
        guest_name=order['guest_name'], guest_phone=order['guest_phone'],
        guest_address=order['guest_address'], payment_method=order['payment_method'],
        status=order['status'], total=order['total'], notes=order['notes'],
        created_at=order['created_at'], items=items
    )


ORDER_SELECT = """
    SELECT o.id, o.user_id, u.name as user_name, u.phone as user_phone,
           o.guest_name, o.guest_phone, o.guest_address, o.payment_method,
           o.status, o.total, o.notes, o.created_at
    FROM orders o LEFT JOIN users u ON o.user_id = u.id
"""


async def _process_order_items(db: aiosqlite.Connection, items: List[OrderItemCreate]):
    total = 0.0
    items_data = []
    for item in items:
        cursor = await db.execute("""
            SELECT p.id, p.name, p.price, p.stock, p.min_order, p.is_active,
                   (SELECT MAX(pr.discount_percent) FROM promotions pr
                    WHERE (pr.product_id = p.id OR pr.category_id = p.category_id)
                    AND pr.is_active = 1 AND datetime('now') BETWEEN pr.start_date AND pr.end_date) as discount_percent
            FROM products p WHERE p.id = ?
        """, (item.product_id,))
        product = await cursor.fetchone()
        if not product:
            raise HTTPException(status_code=400, detail=f"Producto {item.product_id} no encontrado")
        if not product['is_active']:
            raise HTTPException(status_code=400, detail=f"Producto {product['name']} no esta disponible")
        if item.quantity < product['min_order']:
            raise HTTPException(status_code=400, detail=f"Cantidad minima para {product['name']} es {product['min_order']}")
        discount = product['discount_percent'] or 0
        subtotal = item.quantity * product['price'] * (1 - discount / 100)
        total += subtotal
        items_data.append({'product_id': item.product_id, 'product_name': product['name'], 'quantity': item.quantity, 'price': product['price'], 'discount': discount})
    return total, items_data


async def _insert_order_items(db: aiosqlite.Connection, order_id: int, items_data: list) -> List[OrderItemResponse]:
    result = []
    for item_data in items_data:
        cursor = await db.execute(
            "INSERT INTO order_items (order_id, product_id, quantity, price, discount) VALUES (?, ?, ?, ?, ?)",
            (order_id, item_data['product_id'], item_data['quantity'], item_data['price'], item_data['discount'])
        )
        await db.commit()
        result.append(OrderItemResponse(
            id=cursor.lastrowid, product_id=item_data['product_id'], product_name=item_data['product_name'],
            quantity=item_data['quantity'], price=item_data['price'], discount=item_data['discount'],
            subtotal=round(item_data['quantity'] * item_data['price'] * (1 - item_data['discount'] / 100), 2)
        ))
    return result


@router.get("", response_model=List[OrderResponse])
async def get_orders(status_filter: Optional[str] = Query(None), current_user: dict = Depends(get_current_user), db: aiosqlite.Connection = Depends(get_db)):
    if current_user['role'] == 'admin':
        query = ORDER_SELECT + " WHERE 1=1"
        params: list = []
    else:
        query = ORDER_SELECT + " WHERE o.user_id = ?"
        params = [current_user['id']]
    if status_filter:
        query += " AND o.status = ?"
        params.append(status_filter)
    query += " ORDER BY o.created_at DESC"
    cursor = await db.execute(query, params)
    orders = await cursor.fetchall()
    return [await _build_order_response(db, order) for order in orders]


@router.post("", response_model=OrderResponse)
async def create_order(order: OrderCreate, current_user: dict = Depends(get_current_user), db: aiosqlite.Connection = Depends(get_db)):
    if not order.items:
        raise HTTPException(status_code=400, detail="El pedido debe tener al menos un producto")
    total, items_data = await _process_order_items(db, order.items)
    cursor = await db.execute("INSERT INTO orders (user_id, total, notes) VALUES (?, ?, ?)", (current_user['id'], round(total, 2), order.notes))
    await db.commit()
    order_id = cursor.lastrowid
    order_items = await _insert_order_items(db, order_id, items_data)
    cursor = await db.execute("SELECT created_at FROM orders WHERE id = ?", (order_id,))
    order_row = await cursor.fetchone()
    return OrderResponse(
        id=order_id, user_id=current_user['id'], user_name=current_user['name'], user_phone=current_user['phone'],
        status='pending', total=round(total, 2), notes=order.notes, created_at=order_row['created_at'], items=order_items
    )


@router.post("/guest", response_model=OrderResponse)
async def guest_create_order(order: GuestOrderCreate, db: aiosqlite.Connection = Depends(get_db)):
    if not order.items:
        raise HTTPException(status_code=400, detail="El pedido debe tener al menos un producto")
    total, items_data = await _process_order_items(db, order.items)
    cursor = await db.execute(
        "INSERT INTO orders (guest_name, guest_phone, guest_address, payment_method, total, notes) VALUES (?, ?, ?, ?, ?, ?)",
        (order.guest_name, order.guest_phone, order.guest_address, order.payment_method, round(total, 2), order.notes)
    )
    await db.commit()
    order_id = cursor.lastrowid
    order_items = await _insert_order_items(db, order_id, items_data)
    cursor = await db.execute("SELECT created_at FROM orders WHERE id = ?", (order_id,))
    order_row = await cursor.fetchone()
    return OrderResponse(
        id=order_id, user_id=None, user_name=order.guest_name, user_phone=order.guest_phone,
        guest_name=order.guest_name, guest_phone=order.guest_phone, guest_address=order.guest_address,
        payment_method=order.payment_method, status='pending', total=round(total, 2),
        notes=order.notes, created_at=order_row['created_at'], items=order_items
    )


@router.post("/admin", response_model=OrderResponse)
async def admin_create_order(order: AdminOrderCreate, admin: dict = Depends(get_admin_user), db: aiosqlite.Connection = Depends(get_db)):
    if not order.items:
        raise HTTPException(status_code=400, detail="El pedido debe tener al menos un producto")
    cursor = await db.execute("SELECT id, name, phone FROM users WHERE id = ?", (order.user_id,))
    user = await cursor.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    total, items_data = await _process_order_items(db, order.items)
    cursor = await db.execute("INSERT INTO orders (user_id, total, notes) VALUES (?, ?, ?)", (order.user_id, round(total, 2), order.notes))
    await db.commit()
    order_id = cursor.lastrowid
    order_items = await _insert_order_items(db, order_id, items_data)
    cursor = await db.execute("SELECT created_at FROM orders WHERE id = ?", (order_id,))
    order_row = await cursor.fetchone()
    return OrderResponse(
        id=order_id, user_id=order.user_id, user_name=user['name'], user_phone=user['phone'],
        status='pending', total=round(total, 2), notes=order.notes, created_at=order_row['created_at'], items=order_items
    )


@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(order_id: int, status_update: OrderStatusUpdate, admin: dict = Depends(get_admin_user), db: aiosqlite.Connection = Depends(get_db)):
    valid_statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']
    if status_update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Estado invalido. Validos: {', '.join(valid_statuses)}")
    cursor = await db.execute("SELECT id, status FROM orders WHERE id = ?", (order_id,))
    order_check = await cursor.fetchone()
    if not order_check:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    previous_status = order_check['status']
    if status_update.status == 'confirmed' and previous_status != 'confirmed':
        cursor = await db.execute("SELECT oi.product_id, oi.quantity, p.stock, p.name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?", (order_id,))
        items = await cursor.fetchall()
        for item in items:
            if item['stock'] - item['quantity'] < 0:
                raise HTTPException(status_code=400, detail=f"Stock insuficiente para {item['name']}")
        for item in items:
            await db.execute("UPDATE products SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (item['quantity'], item['product_id']))
    if status_update.status == 'cancelled' and previous_status == 'confirmed':
        cursor = await db.execute("SELECT oi.product_id, oi.quantity FROM order_items oi WHERE oi.order_id = ?", (order_id,))
        items = await cursor.fetchall()
        for item in items:
            await db.execute("UPDATE products SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (item['quantity'], item['product_id']))
    await db.execute("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (status_update.status, order_id))
    await db.commit()
    cursor = await db.execute(ORDER_SELECT + " WHERE o.id = ?", (order_id,))
    order = await cursor.fetchone()
    return await _build_order_response(db, order)


@router.delete("/{order_id}")
async def cancel_order(order_id: int, current_user: dict = Depends(get_current_user), db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute("SELECT id, user_id, status FROM orders WHERE id = ?", (order_id,))
    order = await cursor.fetchone()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if current_user['role'] != 'admin' and order['user_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="No tienes permiso")
    if order['status'] not in ['pending']:
        raise HTTPException(status_code=400, detail="Solo se pueden cancelar pedidos pendientes")
    await db.execute("UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (order_id,))
    await db.commit()
    return {"message": "Pedido cancelado"}


@router.delete("/{order_id}/permanent")
async def delete_order_permanent(order_id: int, admin: dict = Depends(get_admin_user), db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute("SELECT id FROM orders WHERE id = ?", (order_id,))
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    await db.execute("DELETE FROM order_items WHERE order_id = ?", (order_id,))
    await db.execute("DELETE FROM orders WHERE id = ?", (order_id,))
    await db.commit()
    return {"message": "Pedido eliminado permanentemente"}
