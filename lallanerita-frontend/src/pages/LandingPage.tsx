import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, MessageCircle, Store, Truck, Package, Heart, Star, Zap, MapPin, Tag, Apple, Beef, Wine, SprayCan, ShoppingBasket } from "lucide-react";
import HeroBanner from "../components/HeroBanner";
import ScrollReveal from "../components/ScrollReveal";
import { api } from "../services/api";

interface Service { id: number; title: string; description: string | null; icon: string; display_order: number; }
interface Product { id: number; name: string; price: number; unit: string; image_url: string | null; discount_percent: number | null; final_price: number; category_name: string | null; }
interface Category { id: number; name: string; description: string | null; image_url: string | null; }

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Store, ShoppingBag, Truck, Package, Heart, Star, Zap, MessageCircle,
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Despensa": ShoppingBasket,
  "Frutas y verduras": Apple,
  "Aseo": SprayCan,
  "Carnes": Beef,
  "Licores": Wine,
  "Otros": Package,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Despensa": "from-amber-400 to-amber-600",
  "Frutas y verduras": "from-green-400 to-green-600",
  "Aseo": "from-cyan-400 to-cyan-600",
  "Carnes": "from-red-400 to-red-600",
  "Licores": "from-purple-400 to-purple-600",
  "Otros": "from-gray-400 to-gray-600",
};

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [promoProducts, setPromoProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    api.getServices(true).then(setServices).catch(() => {});
    api.getCategories().then(setCategories).catch(() => {});
    api.getProducts({ active_only: true }).then((products: Product[]) => {
      setPromoProducts(products.filter((p) => p.discount_percent && p.discount_percent > 0));
    }).catch(() => {});
  }, []);


  return (
    <div className="min-h-screen bg-white text-gray-900 pb-10">
      <HeroBanner />

      <ScrollReveal>
        <section className="relative flex flex-col items-center justify-center px-4 py-16 text-center bg-gradient-to-b from-blue-50 to-white">
          <p className="mx-auto max-w-2xl text-lg text-gray-500 mb-8">
            Explora nuestro catalogo, haz tu pedido y recibelo a la puerta de tu casa!
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
          </div>
        </section>
      </ScrollReveal>

      {categories.length > 0 && (
        <ScrollReveal>
        <section className="bg-white py-12 px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Explora por Categoria</h2>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {categories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.name] || ShoppingBasket;
                const colors = CATEGORY_COLORS[cat.name] || "from-blue-400 to-blue-600";
                return (
                  <div
                    key={cat.id}
                    className="group cursor-pointer"
                    onClick={() => navigate(`/catalogo?categoria=${cat.id}`)}
                  >
                    <div className={`relative flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br ${colors} p-6 h-36 shadow-md hover:shadow-xl transition-all hover:scale-105`}>
                      <Icon className="h-12 w-12 text-white mb-3 drop-shadow-md" />
                      <h3 className="text-white font-bold text-sm md:text-base text-center drop-shadow-md">{cat.name}</h3>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        </ScrollReveal>
      )}

      {promoProducts.length > 0 && (
        <ScrollReveal>
        <section className="bg-white py-12 px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-8 text-red-600 flex items-center justify-center gap-2">
              <Tag className="h-7 w-7" /> Promociones
            </h2>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {promoProducts.map((p) => (
                <Card
                  key={p.id}
                  className="bg-white border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate("/catalogo")}
                >
                  <div className="relative aspect-square bg-gray-100">
                    {p.image_url ? (
                      <img
                        src={p.image_url.startsWith("http") ? p.image_url : `${API_URL}${p.image_url}`}
                        alt={p.name}
                        loading="lazy"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ShoppingBag className="h-10 w-10" />
                      </div>
                    )}
                    <Badge className="absolute top-2 right-2 bg-red-600 text-white text-xs">
                      <Tag className="h-3 w-3 mr-1" />-{p.discount_percent}%
                    </Badge>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{p.name}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs line-through text-gray-400">{formatCOP(p.price)}</span>
                      <span className="text-sm font-bold text-red-600">{formatCOP(p.final_price)}</span>
                    </div>
                    <span className="text-xs text-gray-500">/ {p.unit}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        </ScrollReveal>
      )}

      {services.length > 0 && (
        <ScrollReveal>
        <section className="bg-gray-50 py-16 px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-12 text-blue-600">Nuestros Servicios</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {services.map((s) => {
                const Icon = ICON_MAP[s.icon] || Store;
                return (
                  <div key={s.id} className="flex flex-col items-center text-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <Icon className="h-12 w-12 text-blue-600 mb-4" />
                    <h3 className="text-xl font-bold mb-2 text-gray-900">{s.title}</h3>
                    <p className="text-gray-500">{s.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        </ScrollReveal>
      )}

      <ScrollReveal>
      <footer className="bg-white border-t border-gray-200 py-8 px-4 text-center text-gray-400">
        <p className="flex items-center justify-center gap-1 mb-2 text-gray-500">
          <MapPin className="h-4 w-4" /> Cra 6 # 7-03 La Macarena, Meta 🇨🇴
        </p>
        <p className="text-gray-500 mb-2">Contacto: 3112110480</p>
        <p>&copy; 2026 Lallanerita.co - Todos los derechos reservados</p>
      </footer>
      </ScrollReveal>
    </div>
  );
}
