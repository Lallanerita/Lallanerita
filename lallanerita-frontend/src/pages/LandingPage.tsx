import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, MessageCircle, Store, Truck } from "lucide-react";
import HeroBanner from "../components/HeroBanner";

export default function LandingPage() {
  const navigate = useNavigate();

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
            <div className="flex flex-col items-center text-center p-6 bg-gray-900 rounded-xl border border-gray-800">
              <Store className="h-12 w-12 text-amber-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Catalogo Online</h3>
              <p className="text-gray-400">Explora nuestra amplia variedad de productos actualizados.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-gray-900 rounded-xl border border-gray-800">
              <ShoppingBag className="h-12 w-12 text-amber-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Pedidos Faciles</h3>
              <p className="text-gray-400">Realiza tu pedido en minutos desde tu celular o computador.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-gray-900 rounded-xl border border-gray-800">
              <Truck className="h-12 w-12 text-amber-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Entrega Rapida</h3>
              <p className="text-gray-400">Recibe tus productos de forma rapida y segura.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-black border-t border-gray-800 py-8 px-4 text-center text-gray-500">
        <p>&copy; 2026 Lallanerita.co - Todos los derechos reservados</p>
        <a href="https://wa.link/mv45ai" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline mt-2 inline-block">
          WhatsApp: Contactanos
        </a>
      </footer>
    </div>
  );
}
