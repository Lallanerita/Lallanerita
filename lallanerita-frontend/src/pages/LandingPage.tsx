import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, MessageCircle, Store, Truck, Package, Heart, Star, Zap } from "lucide-react";
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
    <div className="min-h-screen bg-black text-white">
      <section className="relative flex flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-6 flex items-center gap-3">
          <img src="/logo.png" alt="La Llanerita" className="h-20 w-20 rounded-full object-cover" />
          <div>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">LA LLANERITA</h1>
            <p className="text-lg text-amber-400 font-semibold">.co</p>
          </div>
        </div>
        <p className="mx-auto max-w-2xl text-lg text-gray-300 mb-8">
          Tu tienda en linea con los mejores productos. Explora nuestro catalogo, haz tu pedido y recibelo donde estes.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            size="lg"
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-lg px-8"
            onClick={() => navigate("/catalogo")}
          >
            <ShoppingBag className="mr-2 h-5 w-5" />
            Ver Catalogo
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-black font-bold text-lg px-8"
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

      <section className="bg-gray-950 py-16 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-amber-400">Nuestros Servicios</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {displayServices.map((s, i) => {
              const Icon = ICON_MAP[s.icon] || Store;
              return (
                <div key={s.id || i} className="flex flex-col items-center text-center p-6 bg-gray-900 rounded-xl border border-gray-800">
                  <Icon className="h-12 w-12 text-amber-500 mb-4" />
                  <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                  <p className="text-gray-400">{s.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="bg-black border-t border-gray-800 py-8 px-4 text-center text-gray-500">
        <p>&copy; 2026 Lallanerita.co - Todos los derechos reservados</p>
      </footer>
    </div>
  );
}
