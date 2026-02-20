import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, ShoppingCart, MessageCircle } from "lucide-react";

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
}

const WHATSAPP_NUMBER = "573112110480";

export default function CheckoutPage() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");
  const [guestData, setGuestData] = useState({ guest_name: "", guest_phone: "", guest_address: "", payment_method: "efectivo" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const buildWhatsAppMessage = (orderId?: number) => {
    let msg = `*Nuevo Pedido - La Llanerita*\n`;
    if (orderId) msg += `Pedido #${orderId}\n`;
    msg += `\n`;
    if (user) {
      msg += `*Cliente:* ${user.name}\n`;
      if (user.phone) msg += `*Tel:* ${user.phone}\n`;
    } else {
      msg += `*Cliente:* ${guestData.guest_name}\n`;
      msg += `*Tel:* ${guestData.guest_phone}\n`;
      msg += `*Dir:* ${guestData.guest_address}\n`;
      msg += `*Pago:* ${guestData.payment_method}\n`;
    }
    msg += `\n*Productos:*\n`;
    items.forEach((item) => {
      msg += `- ${item.name} x${item.quantity} ${item.unit} = ${formatCOP(item.final_price * item.quantity)}\n`;
    });
    msg += `\n*Total: ${formatCOP(total)}*\n`;
    if (notes) msg += `\n*Notas:* ${notes}`;
    return msg;
  };

  const sendWhatsApp = (orderId?: number) => {
    const msg = buildWhatsAppMessage(orderId);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const orderItems = items.map((i) => ({ product_id: i.product_id, quantity: i.quantity }));
      let order;
      if (user) {
        order = await api.createOrder({ items: orderItems, notes });
      } else {
        order = await api.guestOrder({ ...guestData, items: orderItems, notes });
      }
      sendWhatsApp(order.id);
      clearCart();
      navigate(user ? "/pedidos" : "/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear pedido");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <ShoppingCart className="mx-auto h-16 w-16 text-gray-600 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Carrito vacio</h2>
          <p className="text-gray-400 mb-4">Agrega productos desde el catalogo</p>
          <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold" onClick={() => navigate("/catalogo")}>
            Ir al Catalogo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold mb-6 text-amber-400">Tu Pedido</h1>
        {error && <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">{error}</div>}

        <Card className="bg-gray-900 border-gray-800 mb-6">
          <CardHeader><CardTitle className="text-white text-lg">Productos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {items.map((item) => (
              <div key={item.product_id} className="flex items-center justify-between gap-3 pb-3 border-b border-gray-800 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{item.name}</p>
                  <p className="text-xs text-amber-400">{formatCOP(item.final_price)} / {item.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    className="h-8 w-16 text-center text-sm bg-gray-800 border-gray-700 text-white"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.product_id, Number(e.target.value))}
                    min={1}
                  />
                  <span className="text-sm text-gray-400 w-20 text-right">{formatCOP(item.final_price * item.quantity)}</span>
                  <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 h-8 w-8 p-0" onClick={() => removeItem(item.product_id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-3 border-t border-gray-700 text-lg font-bold">
              <span>Total:</span>
              <span className="text-amber-400">{formatCOP(total)}</span>
            </div>
          </CardContent>
        </Card>

        {!user && (
          <Card className="bg-gray-900 border-gray-800 mb-6">
            <CardHeader><CardTitle className="text-white text-lg">Datos de Envio</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-gray-300">Nombre *</Label>
                <Input required className="bg-gray-800 border-gray-700 text-white" value={guestData.guest_name} onChange={(e) => setGuestData({ ...guestData, guest_name: e.target.value })} />
              </div>
              <div>
                <Label className="text-gray-300">Telefono *</Label>
                <Input required className="bg-gray-800 border-gray-700 text-white" value={guestData.guest_phone} onChange={(e) => setGuestData({ ...guestData, guest_phone: e.target.value })} />
              </div>
              <div>
                <Label className="text-gray-300">Direccion *</Label>
                <Input required className="bg-gray-800 border-gray-700 text-white" value={guestData.guest_address} onChange={(e) => setGuestData({ ...guestData, guest_address: e.target.value })} />
              </div>
              <div>
                <Label className="text-gray-300">Metodo de Pago</Label>
                <select className="w-full rounded-md bg-gray-800 border border-gray-700 text-white p-2 text-sm" value={guestData.payment_method} onChange={(e) => setGuestData({ ...guestData, payment_method: e.target.value })}>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="nequi">Nequi</option>
                  <option value="daviplata">Daviplata</option>
                </select>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gray-900 border-gray-800 mb-6">
          <CardContent className="pt-4">
            <Label className="text-gray-300">Notas del pedido</Label>
            <Textarea className="bg-gray-800 border-gray-700 text-white mt-1" placeholder="Instrucciones especiales..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold" onClick={handleSubmit} disabled={loading || (!user && (!guestData.guest_name || !guestData.guest_phone || !guestData.guest_address))}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            {loading ? "Enviando..." : "Confirmar Pedido"}
          </Button>
          <Button variant="outline" className="border-green-600 text-green-400 hover:bg-green-900" onClick={() => sendWhatsApp()}>
            <MessageCircle className="mr-2 h-4 w-4" />
            WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}
