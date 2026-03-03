import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, MessageCircle, Store, Truck, Package, Heart, Star, Zap, MapPin } from "lucide-react";
import HeroBanner from "../components/HeroBanner";
import { api } from "../services/api";

interface Service { id: number; title: string; description: string | null; icon: string; display_order: number; }

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Store, ShoppingBag, Truck, Package, Heart, Star, Zap, MessageCircle,
};

const DEFAULT_SERVICES = [
  { id: 0, title: "Catalogo Online", description: "Explora nuestra amplia variedad de productos actualizados.", icon: "Store" },
  { id: 0, title: "Pedidos Faciles", description: "Realiza tu pedido en minutos desde tu celular o computador.", icon: "ShoppingBag" },
  { id: 0, title: "Entrega Rapida", description: "Recibe tus productos de forma rapida y segura.", icon: "Truck" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    api.getServices(true).then(setServices).catch(() => {});
  }, []);

  const displayServices = services.length > 0 ? services : DEFAULT_SERVICES;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <section className="relative flex flex-col items-center justify-center px-4 py-24 text-center bg-gradient-to-b from-blue-50 to-white">
        <p className="mx-auto max-w-2xl text-lg text-gray-500 mb-8">
          Tu tienda en linea con los mejores productos. Explora nuestro catalogo, haz tu pedido y recibelo donde estes.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg px-8"
            onClick={() => navigate("/catalogo")}
          >
            <ShoppingBag className="mr-2 h-5 w-5" />
            Ver Catalogo
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-bold text-lg px-8"
            asChild
          >
            <a href="https://wa.link/mv45ai" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-5 w-5" />
              Contactanos
            </a>
          </Button>
        </div>
      </section>

      <HeroBanner />

      <section className="bg-gray-50 py-16 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-blue-600">Nuestros Servicios</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {displayServices.map((s, i) => {
              const Icon = ICON_MAP[s.icon] || Store;
              return (
                <div key={s.id || i} className="flex flex-col items-center text-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <Icon className="h-12 w-12 text-blue-600 mb-4" />
                  <h3 className="text-xl font-bold mb-2 text-gray-900">{s.title}</h3>
                  <p className="text-gray-500">{s.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-200 py-8 px-4 text-center text-gray-400">
        <p className="flex items-center justify-center gap-1 mb-2 text-gray-500">
          <MapPin className="h-4 w-4" /> Cra 6 # 7-03 La Macarena, Meta 🇨🇴
        </p>
        <p>&copy; 2026 Lallanerita.co - Todos los derechos reservados</p>
      </footer>
    </div>
  );
}
