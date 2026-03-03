import { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Clock, CheckCircle, Truck, XCircle, ChefHat } from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pendiente", color: "bg-yellow-600", icon: <Clock className="h-4 w-4" /> },
  confirmed: { label: "Confirmado", color: "bg-blue-600", icon: <CheckCircle className="h-4 w-4" /> },
  preparing: { label: "Preparando", color: "bg-purple-600", icon: <ChefHat className="h-4 w-4" /> },
  ready: { label: "Listo", color: "bg-green-600", icon: <Package className="h-4 w-4" /> },
  delivered: { label: "Entregado", color: "bg-green-800", icon: <Truck className="h-4 w-4" /> },
  cancelled: { label: "Cancelado", color: "bg-red-700", icon: <XCircle className="h-4 w-4" /> },
};

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
}

interface Order {
  id: number;
  user_name: string;
  status: string;
  total: number;
  notes: string | null;
  items: OrderItem[];
  created_at: string;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => {
    if (user) api.getOrders().then(setOrders);
  }, [user]);

  const handleCancel = async (id: number) => {
    if (!confirm("Cancelar este pedido?")) return;
    await api.cancelOrder(id);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "cancelled" } : o)));
    setSelected(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4">
      <div className="mx-auto max-w-2xl">
        <ScrollReveal><h1 className="text-2xl font-bold mb-6 text-blue-600">Mis Pedidos</h1></ScrollReveal>
        {orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package className="mx-auto h-12 w-12 mb-4" />
            <p>No tienes pedidos aun</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              return (
                <ScrollReveal key={order.id}>
                <Card
                  className="bg-white border-gray-200 shadow-sm cursor-pointer hover:border-blue-300 transition-colors"
                  onClick={() => setSelected(order)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">Pedido #{order.id}</p>
                      <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      <p className="text-sm text-blue-600 font-semibold mt-1">{formatCOP(order.total)}</p>
                    </div>
                    <Badge className={`${sc.color} text-white flex items-center gap-1`}>
                      {sc.icon} {sc.label}
                    </Badge>
                  </CardContent>
                </Card>
                </ScrollReveal>
              );
            })}
          </div>
        )}

        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-blue-600">Pedido #{selected?.id}</DialogTitle>
            </DialogHeader>
            {selected && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {new Date(selected.created_at).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <Badge className={`${STATUS_CONFIG[selected.status]?.color || "bg-gray-600"} text-white`}>
                    {STATUS_CONFIG[selected.status]?.label || selected.status}
                  </Badge>
                </div>
                <Card className="bg-gray-50 border-gray-200">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-700">Productos</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {selected.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.product_name} x{item.quantity}</span>
                        <span className="text-blue-600">{formatCOP(item.subtotal)}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-blue-600">{formatCOP(selected.total)}</span>
                    </div>
                  </CardContent>
                </Card>
                {selected.notes && (
                  <div className="text-sm"><span className="text-gray-400">Notas:</span> {selected.notes}</div>
                )}
                {selected.status === "pending" && (
                  <Button variant="destructive" className="w-full" onClick={() => handleCancel(selected.id)}>
                    Cancelar Pedido
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
