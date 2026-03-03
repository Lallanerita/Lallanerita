import { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Package, Tag, Users, ShoppingCart, Image, ImagePlus, Settings, Lock } from "lucide-react";

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Confirmado" },
  { value: "preparing", label: "Preparando" },
  { value: "ready", label: "Listo" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
];

interface Category { id: number; name: string; description: string | null; image_url: string | null; }
interface Product { id: number; name: string; description: string | null; price: number; unit: string; category_id: number | null; category_name: string | null; image_url: string | null; image_url_2: string | null; stock: number; min_order: number; is_active: boolean; discount_percent: number | null; final_price: number; }
interface Order { id: number; user_id: number | null; user_name: string; user_phone: string | null; guest_name: string | null; guest_phone: string | null; guest_address: string | null; payment_method: string | null; status: string; total: number; notes: string | null; items: { id: number; product_name: string; quantity: number; price: number; discount: number; subtotal: number }[]; created_at: string; }
interface Promotion { id: number; name: string; description: string | null; discount_percent: number; product_id: number | null; product_name: string | null; category_id: number | null; category_name: string | null; start_date: string; end_date: string; is_active: boolean; }
interface User { id: number; email: string; name: string; phone: string | null; address: string | null; role: string; is_active: boolean; created_at: string | null; }

function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "", unit: "und", category_id: "", image_url: "", stock: "", min_order: "1" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.getProducts({ active_only: false }).then(setProducts);
    api.getCategories().then(setCategories);
  }, []);

  const resetForm = () => { setForm({ name: "", description: "", price: "", unit: "und", category_id: "", image_url: "", stock: "", min_order: "1" }); setEditing(null); setShowForm(false); };

  const openEdit = (p: Product) => {
    setForm({ name: p.name, description: p.description || "", price: String(p.price), unit: p.unit, category_id: p.category_id ? String(p.category_id) : "", image_url: p.image_url || "", stock: String(p.stock), min_order: String(p.min_order) });
    setEditing(p); setShowForm(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadFile(file);
      setForm((prev) => ({ ...prev, image_url: res.url }));
    } catch { /* ignore */ }
    setUploading(false);
  };

  const handleSave = async () => {
    const data = { name: form.name, description: form.description, price: Number(form.price), unit: form.unit, category_id: form.category_id ? Number(form.category_id) : null, image_url: form.image_url, stock: Number(form.stock), min_order: Number(form.min_order) };
    if (editing) {
      await api.updateProduct(editing.id, data);
    } else {
      await api.createProduct(data);
    }
    api.getProducts({ active_only: false }).then(setProducts);
    resetForm();
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const handleDelete = async (id: number) => {
    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      alert(`Error al eliminar producto: ${msg}`);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Productos ({products.length})</h2>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="h-4 w-4 mr-1" /> Nuevo</Button>
      </div>

      <Dialog open={showForm} onOpenChange={() => resetForm()}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-lg max-h-screen overflow-y-auto">
          <DialogHeader><DialogTitle className="text-blue-600">{editing ? "Editar Producto" : "Nuevo Producto"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-gray-600">Nombre *</Label><Input className="bg-gray-50 border-gray-300 text-gray-900" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label className="text-gray-600">Descripcion</Label><Textarea className="bg-gray-50 border-gray-300 text-gray-900" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-gray-600">Precio *</Label><Input type="number" className="bg-gray-50 border-gray-300 text-gray-900" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label className="text-gray-600">Unidad</Label><Input className="bg-gray-50 border-gray-300 text-gray-900" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-gray-600">Stock</Label><Input type="number" className="bg-gray-50 border-gray-300 text-gray-900" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
              <div><Label className="text-gray-600">Pedido Min</Label><Input type="number" className="bg-gray-50 border-gray-300 text-gray-900" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })} /></div>
            </div>
            <div>
              <Label className="text-gray-600">Categoria</Label>
              <select className="w-full rounded-md bg-gray-50 border border-gray-300 text-gray-900 p-2 text-sm" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Sin categoria</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-gray-600">Imagen</Label>
              <div className="flex gap-2 items-center">
                <Input className="bg-gray-50 border-gray-300 text-gray-900 flex-1" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="URL o subir archivo" />
                <label className="cursor-pointer">
                  <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                  <Button size="sm" variant="outline" className="border-gray-300" asChild disabled={uploading}><span><Image className="h-4 w-4" /></span></Button>
                </label>
              </div>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={handleSave} disabled={!form.name || !form.price}>{editing ? "Guardar Cambios" : "Crear Producto"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        {products.map((p) => (
          <Card key={p.id} className={`bg-white border-gray-200 ${!p.is_active ? "opacity-50" : ""}`}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-12 w-12 rounded bg-gray-50 flex-shrink-0 overflow-hidden">
                {p.image_url ? <img src={p.image_url.startsWith("http") ? p.image_url : `${import.meta.env.VITE_API_URL || "http://localhost:8000"}${p.image_url}`} alt="" className="w-full h-full object-cover" /> : <Package className="h-6 w-6 m-3 text-gray-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{p.name}</p>
                <p className="text-xs text-gray-500">{p.category_name || "Sin categoria"} | Stock: {p.stock}</p>
              </div>
              <span className="text-sm font-bold text-blue-600 whitespace-nowrap">{formatCOP(p.price)}</span>
              <Button size="sm" variant="ghost" className="text-gray-500 h-8 w-8 p-0" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
              {deleteConfirmId === p.id ? (
                <Button size="sm" variant="ghost" className="text-red-600 text-xs px-2 h-8 font-bold" onClick={() => handleDelete(p.id)}>Confirmar</Button>
              ) : (
                <Button size="sm" variant="ghost" className="text-red-400 h-8 w-8 p-0" onClick={() => setDeleteConfirmId(p.id)}><Trash2 className="h-4 w-4" /></Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", image_url: "" });

  useEffect(() => { api.getCategories().then(setCategories); }, []);

  const resetForm = () => { setForm({ name: "", description: "", image_url: "" }); setEditing(null); setShowForm(false); };

  const handleSave = async () => {
    if (editing) { await api.updateCategory(editing.id, form); } else { await api.createCategory(form); }
    api.getCategories().then(setCategories); resetForm();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Categorias ({categories.length})</h2>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="h-4 w-4 mr-1" /> Nueva</Button>
      </div>
      <Dialog open={showForm} onOpenChange={() => resetForm()}>
        <DialogContent className="bg-white border-gray-200 text-gray-900">
          <DialogHeader><DialogTitle className="text-blue-600">{editing ? "Editar" : "Nueva"} Categoria</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-gray-600">Nombre *</Label><Input className="bg-gray-50 border-gray-300 text-gray-900" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label className="text-gray-600">Descripcion</Label><Textarea className="bg-gray-50 border-gray-300 text-gray-900" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={handleSave} disabled={!form.name}>{editing ? "Guardar" : "Crear"}</Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="space-y-2">
        {categories.map((c) => (
          <Card key={c.id} className="bg-white border-gray-200">
            <CardContent className="p-3 flex items-center justify-between">
              <div><p className="font-semibold text-gray-900">{c.name}</p><p className="text-xs text-gray-500">{c.description}</p></div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="text-gray-500 h-8 w-8 p-0" onClick={() => { setForm({ name: c.name, description: c.description || "", image_url: c.image_url || "" }); setEditing(c); setShowForm(true); }}><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" className="text-red-400 h-8 w-8 p-0" onClick={async () => { if (confirm("Eliminar?")) { await api.deleteCategory(c.id); api.getCategories().then(setCategories); } }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => { api.getOrders(statusFilter || undefined).then(setOrders); }, [statusFilter]);

  const handleStatus = async (id: number, status: string) => {
    await api.updateOrderStatus(id, status);
    api.getOrders(statusFilter || undefined).then(setOrders);
    setSelected(null);
  };

  const handleDeletePermanent = async (id: number) => {
    if (!confirm("Eliminar permanentemente?")) return;
    await api.deleteOrderPermanent(id);
    api.getOrders(statusFilter || undefined).then(setOrders);
    setSelected(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-gray-900">Pedidos ({orders.length})</h2>
        <select className="rounded-md bg-gray-50 border border-gray-300 text-gray-900 p-1.5 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos</option>
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        {orders.map((o) => (
          <Card key={o.id} className="bg-white border-gray-200 cursor-pointer hover:border-blue-300" onClick={() => setSelected(o)}>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">#{o.id} - {o.user_name}</p>
                <p className="text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString("es-CO")}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-600 text-sm">{formatCOP(o.total)}</p>
                <Badge className="text-xs" variant="outline">{STATUS_OPTIONS.find((s) => s.value === o.status)?.label || o.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-lg max-h-screen overflow-y-auto">
          <DialogHeader><DialogTitle className="text-blue-600">Pedido #{selected?.id}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Cliente:</span> {selected.user_name}</div>
                <div><span className="text-gray-500">Tel:</span> {selected.user_phone || selected.guest_phone || "-"}</div>
                {selected.guest_address && <div className="col-span-2"><span className="text-gray-500">Dir:</span> {selected.guest_address}</div>}
                {selected.payment_method && <div><span className="text-gray-500">Pago:</span> {selected.payment_method}</div>}
              </div>
              <Card className="bg-gray-50 border-gray-300">
                <CardContent className="p-3 space-y-1">
                  {selected.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.product_name} x{item.quantity}</span>
                      <span className="text-blue-600">{formatCOP(item.subtotal)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-bold"><span>Total</span><span className="text-blue-600">{formatCOP(selected.total)}</span></div>
                </CardContent>
              </Card>
              {selected.notes && <p className="text-sm"><span className="text-gray-500">Notas:</span> {selected.notes}</p>}
              <div>
                <Label className="text-gray-600 text-sm">Cambiar Estado</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {STATUS_OPTIONS.map((s) => (
                    <Button key={s.value} size="sm" variant={selected.status === s.value ? "default" : "outline"} className={selected.status === s.value ? "bg-blue-600 text-white" : "border-gray-300 text-gray-600"} onClick={() => handleStatus(selected.id, s.value)}>
                      {s.label}
                    </Button>
                  ))}
                </div>
              </div>
              <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDeletePermanent(selected.id)}>Eliminar Permanentemente</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PromotionsTab() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState({ name: "", description: "", discount_percent: "", product_id: "", category_id: "", start_date: "", end_date: "" });

  useEffect(() => {
    api.getAllPromotions().then(setPromotions);
    api.getProducts({ active_only: false }).then(setProducts);
    api.getCategories().then(setCategories);
  }, []);

  const resetForm = () => { setForm({ name: "", description: "", discount_percent: "", product_id: "", category_id: "", start_date: "", end_date: "" }); setEditing(null); setShowForm(false); };

  const handleSave = async () => {
    const data = { name: form.name, description: form.description, discount_percent: Number(form.discount_percent), product_id: form.product_id ? Number(form.product_id) : null, category_id: form.category_id ? Number(form.category_id) : null, start_date: form.start_date, end_date: form.end_date };
    if (editing) { await api.updatePromotion(editing.id, data); } else { await api.createPromotion(data); }
    api.getAllPromotions().then(setPromotions); resetForm();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Promociones ({promotions.length})</h2>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="h-4 w-4 mr-1" /> Nueva</Button>
      </div>
      <Dialog open={showForm} onOpenChange={() => resetForm()}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-lg max-h-screen overflow-y-auto">
          <DialogHeader><DialogTitle className="text-blue-600">{editing ? "Editar" : "Nueva"} Promocion</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-gray-600">Nombre *</Label><Input className="bg-gray-50 border-gray-300 text-gray-900" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label className="text-gray-600">Descripcion</Label><Textarea className="bg-gray-50 border-gray-300 text-gray-900" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label className="text-gray-600">Descuento % *</Label><Input type="number" className="bg-gray-50 border-gray-300 text-gray-900" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} /></div>
            <div>
              <Label className="text-gray-600">Producto (opcional)</Label>
              <select className="w-full rounded-md bg-gray-50 border border-gray-300 text-gray-900 p-2 text-sm" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
                <option value="">Ninguno</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-gray-600">Categoria (opcional)</Label>
              <select className="w-full rounded-md bg-gray-50 border border-gray-300 text-gray-900 p-2 text-sm" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Ninguna</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-gray-600">Inicio *</Label><Input type="datetime-local" className="bg-gray-50 border-gray-300 text-gray-900" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label className="text-gray-600">Fin *</Label><Input type="datetime-local" className="bg-gray-50 border-gray-300 text-gray-900" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={handleSave} disabled={!form.name || !form.discount_percent || !form.start_date || !form.end_date}>{editing ? "Guardar" : "Crear"}</Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="space-y-2">
        {promotions.map((p) => (
          <Card key={p.id} className={`bg-white border-gray-200 ${!p.is_active ? "opacity-50" : ""}`}>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{p.name} <Badge className="bg-red-600 ml-1 text-xs">-{p.discount_percent}%</Badge></p>
                <p className="text-xs text-gray-500">{p.product_name || p.category_name || "Global"} | {new Date(p.start_date).toLocaleDateString()} - {new Date(p.end_date).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="text-gray-500 h-8 w-8 p-0" onClick={() => {
                  setForm({ name: p.name, description: p.description || "", discount_percent: String(p.discount_percent), product_id: p.product_id ? String(p.product_id) : "", category_id: p.category_id ? String(p.category_id) : "", start_date: p.start_date, end_date: p.end_date });
                  setEditing(p); setShowForm(true);
                }}><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" className="text-red-400 h-8 w-8 p-0" onClick={async () => { if (confirm("Eliminar?")) { await api.deletePromotion(p.id); api.getAllPromotions().then(setPromotions); } }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface Banner { id: number; image_url: string; alt: string | null; display_order: number; is_active: number; }

function BannersTab() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState({ image_url: "", alt: "", display_order: "0" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => { api.getBanners(false).then(setBanners); }, []);

  const resetForm = () => { setForm({ image_url: "", alt: "", display_order: "0" }); setEditing(null); setShowForm(false); };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadFile(file);
      setForm((prev) => ({ ...prev, image_url: res.url }));
    } catch { /* ignore */ }
    setUploading(false);
  };

  const handleSave = async () => {
    const data = { image_url: form.image_url, alt: form.alt, display_order: Number(form.display_order) };
    if (editing) { await api.updateBanner(editing.id, data); } else { await api.createBanner(data); }
    api.getBanners(false).then(setBanners); resetForm();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Banners ({banners.length})</h2>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="h-4 w-4 mr-1" /> Nuevo</Button>
      </div>
      <Dialog open={showForm} onOpenChange={() => resetForm()}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-lg">
          <DialogHeader><DialogTitle className="text-blue-600">{editing ? "Editar" : "Nuevo"} Banner</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-gray-600">Imagen *</Label>
              <div className="flex gap-2 items-center">
                <Input className="bg-gray-50 border-gray-300 text-gray-900 flex-1" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="URL o subir archivo" />
                <label className="cursor-pointer">
                  <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                  <Button size="sm" variant="outline" className="border-gray-300" asChild disabled={uploading}><span><Image className="h-4 w-4" /></span></Button>
                </label>
              </div>
              {form.image_url && <img src={form.image_url.startsWith("http") ? form.image_url : `${import.meta.env.VITE_API_URL || "http://localhost:8000"}${form.image_url}`} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg" />}
            </div>
            <div><Label className="text-gray-600">Texto alternativo</Label><Input className="bg-gray-50 border-gray-300 text-gray-900" value={form.alt} onChange={(e) => setForm({ ...form, alt: e.target.value })} placeholder="Ej: Promocion carnes de res" /></div>
            <div><Label className="text-gray-600">Orden</Label><Input type="number" className="bg-gray-50 border-gray-300 text-gray-900" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} /></div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={handleSave} disabled={!form.image_url}>{editing ? "Guardar" : "Crear"}</Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="space-y-2">
        {banners.map((b) => (
          <Card key={b.id} className={`bg-white border-gray-200 ${!b.is_active ? "opacity-50" : ""}`}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-16 w-28 rounded bg-gray-50 flex-shrink-0 overflow-hidden">
                <img src={b.image_url.startsWith("http") ? b.image_url : `${import.meta.env.VITE_API_URL || "http://localhost:8000"}${b.image_url}`} alt={b.alt || ""} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{b.alt || "Sin texto"}</p>
                <p className="text-xs text-gray-500">Orden: {b.display_order} | {b.is_active ? "Activo" : "Inactivo"}</p>
              </div>
              <Button size="sm" variant="ghost" className="text-gray-500 h-8 w-8 p-0" onClick={() => {
                setForm({ image_url: b.image_url, alt: b.alt || "", display_order: String(b.display_order) });
                setEditing(b); setShowForm(true);
              }}><Pencil className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" className="text-red-400 h-8 w-8 p-0" onClick={async () => { if (confirm("Eliminar banner?")) { await api.deleteBanner(b.id); api.getBanners(false).then(setBanners); } }}><Trash2 className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const ICON_OPTIONS = ["Store", "ShoppingBag", "Truck", "Package", "Heart", "Star", "Zap", "MessageCircle"];

function ServicesTab() {
  const [services, setServices] = useState<{ id: number; title: string; description: string | null; icon: string; display_order: number; is_active: number }[]>([]);
  const [editing, setEditing] = useState<{ id: number } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", icon: "Store", display_order: "0" });

  useEffect(() => { api.getServices(false).then(setServices); }, []);

  const resetForm = () => { setForm({ title: "", description: "", icon: "Store", display_order: "0" }); setEditing(null); setShowForm(false); };

  const handleSave = async () => {
    const data = { title: form.title, description: form.description, icon: form.icon, display_order: Number(form.display_order) };
    if (editing) { await api.updateService(editing.id, data); } else { await api.createService(data); }
    api.getServices(false).then(setServices); resetForm();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Servicios ({services.length})</h2>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="h-4 w-4 mr-1" /> Nuevo</Button>
      </div>
      <Dialog open={showForm} onOpenChange={() => resetForm()}>
        <DialogContent className="bg-white border-gray-200 text-gray-900">
          <DialogHeader><DialogTitle className="text-blue-600">{editing ? "Editar" : "Nuevo"} Servicio</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-gray-600">Titulo *</Label><Input className="bg-gray-50 border-gray-300 text-gray-900" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label className="text-gray-600">Descripcion</Label><Textarea className="bg-gray-50 border-gray-300 text-gray-900" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div>
              <Label className="text-gray-600">Icono</Label>
              <select className="w-full rounded-md bg-gray-50 border border-gray-300 text-gray-900 p-2 text-sm" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
                {ICON_OPTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
            <div><Label className="text-gray-600">Orden</Label><Input type="number" className="bg-gray-50 border-gray-300 text-gray-900" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} /></div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={handleSave} disabled={!form.title}>{editing ? "Guardar" : "Crear"}</Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="space-y-2">
        {services.map((s) => (
          <Card key={s.id} className={`bg-white border-gray-200 ${!s.is_active ? "opacity-50" : ""}`}>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{s.title}</p>
                <p className="text-xs text-gray-500">{s.description} | Icono: {s.icon}</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="text-gray-500 h-8 w-8 p-0" onClick={() => { setForm({ title: s.title, description: s.description || "", icon: s.icon, display_order: String(s.display_order) }); setEditing(s); setShowForm(true); }}><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" className="text-red-400 h-8 w-8 p-0" onClick={async () => { if (confirm("Eliminar?")) { await api.deleteService(s.id); api.getServices(false).then(setServices); } }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "", phone: "", address: "", role: "buyer" });

  useEffect(() => { api.getUsers().then(setUsers); }, []);

  const handleCreate = async () => {
    await api.createUser(form);
    api.getUsers().then(setUsers);
    setShowForm(false); setForm({ email: "", password: "", name: "", phone: "", address: "", role: "buyer" });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Usuarios ({users.length})</h2>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" /> Nuevo</Button>
      </div>
      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent className="bg-white border-gray-200 text-gray-900">
          <DialogHeader><DialogTitle className="text-blue-600">Nuevo Usuario</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-gray-600">Nombre *</Label><Input className="bg-gray-50 border-gray-300 text-gray-900" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label className="text-gray-600">Email *</Label><Input type="email" className="bg-gray-50 border-gray-300 text-gray-900" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label className="text-gray-600">Contrasena *</Label><Input type="password" className="bg-gray-50 border-gray-300 text-gray-900" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div><Label className="text-gray-600">Telefono</Label><Input className="bg-gray-50 border-gray-300 text-gray-900" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div>
              <Label className="text-gray-600">Rol</Label>
              <select className="w-full rounded-md bg-gray-50 border border-gray-300 text-gray-900 p-2 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="buyer">Comprador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={handleCreate} disabled={!form.name || !form.email || !form.password}>Crear</Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="space-y-2">
        {users.map((u) => (
          <Card key={u.id} className={`bg-white border-gray-200 ${!u.is_active ? "opacity-50" : ""}`}>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{u.name} <Badge className={u.role === "admin" ? "bg-blue-600" : "bg-gray-600"} variant="outline">{u.role}</Badge></p>
                <p className="text-xs text-gray-500">{u.email} | {u.phone || "-"}</p>
              </div>
              <Button size="sm" variant="ghost" className="text-red-400 h-8 w-8 p-0" onClick={async () => { if (confirm("Desactivar?")) { await api.deleteUser(u.id); api.getUsers().then(setUsers); } }}><Trash2 className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ConfigTab() {
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    setMessage(null);
    if (!form.current_password || !form.new_password) {
      setMessage({ type: "error", text: "Todos los campos son obligatorios" });
      return;
    }
    if (form.new_password.length < 6) {
      setMessage({ type: "error", text: "La nueva contrasena debe tener al menos 6 caracteres" });
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setMessage({ type: "error", text: "Las contrasenas no coinciden" });
      return;
    }
    setSaving(true);
    try {
      await api.changePassword(form.current_password, form.new_password);
      setMessage({ type: "success", text: "Contrasena actualizada exitosamente" });
      setForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cambiar contrasena";
      setMessage({ type: "error", text: msg });
    }
    setSaving(false);
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Configuracion</h2>
      <Card className="bg-white border-gray-200">
        <CardContent className="p-4 space-y-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><Lock className="h-4 w-4 text-blue-600" /> Cambiar Contrasena</h3>
          {message && (
            <div className={`p-3 rounded text-sm ${message.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-600"}`}>
              {message.text}
            </div>
          )}
          <div>
            <Label className="text-gray-600">Contrasena actual *</Label>
            <Input type="password" className="bg-gray-50 border-gray-300 text-gray-900" value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} />
          </div>
          <div>
            <Label className="text-gray-600">Nueva contrasena *</Label>
            <Input type="password" className="bg-gray-50 border-gray-300 text-gray-900" value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} />
          </div>
          <div>
            <Label className="text-gray-600">Confirmar nueva contrasena *</Label>
            <Input type="password" className="bg-gray-50 border-gray-300 text-gray-900" value={form.confirm_password} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} />
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleChangePassword} disabled={saving}>
            {saving ? "Guardando..." : "Cambiar Contrasena"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPage() {
  const { user, isAdmin, loading, token } = useAuth();

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">Cargando...</p></div>;

  if (!token || !user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Debes iniciar sesion como administrador para acceder a este panel.</p>
          <a href="/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Iniciar Sesion</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold mb-6 text-blue-600">Panel de Administracion</h1>
        <Tabs defaultValue="products">
          <TabsList className="bg-white border border-gray-200 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="products" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs"><Package className="h-3 w-3 mr-1" />Productos</TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs"><Tag className="h-3 w-3 mr-1" />Categorias</TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs"><ShoppingCart className="h-3 w-3 mr-1" />Pedidos</TabsTrigger>
            <TabsTrigger value="promotions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs"><Tag className="h-3 w-3 mr-1" />Promos</TabsTrigger>
            <TabsTrigger value="banners" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs"><ImagePlus className="h-3 w-3 mr-1" />Banners</TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs"><Settings className="h-3 w-3 mr-1" />Servicios</TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs"><Users className="h-3 w-3 mr-1" />Usuarios</TabsTrigger>
            <TabsTrigger value="config" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs"><Settings className="h-3 w-3 mr-1" />Config</TabsTrigger>
          </TabsList>
          <TabsContent value="products"><ProductsTab /></TabsContent>
          <TabsContent value="categories"><CategoriesTab /></TabsContent>
          <TabsContent value="orders"><OrdersTab /></TabsContent>
          <TabsContent value="promotions"><PromotionsTab /></TabsContent>
          <TabsContent value="banners"><BannersTab /></TabsContent>
          <TabsContent value="services"><ServicesTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="config"><ConfigTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
