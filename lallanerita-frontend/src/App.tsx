import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import CatalogPage from "./pages/CatalogPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import AdminPage from "./pages/AdminPage";
import WhatsAppBubble from "./components/WhatsAppBubble";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WhatsAppBubble />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-blue-600 overflow-hidden py-2">
            <div className="animate-marquee whitespace-nowrap text-white font-bold text-sm md:text-base">
              <span className="mx-16">Domicilio Gratis por compras mayores a $100.000</span>
              <span className="mx-16">Domicilio Gratis por compras mayores a $100.000</span>
              <span className="mx-16">Domicilio Gratis por compras mayores a $100.000</span>
              <span className="mx-16">Domicilio Gratis por compras mayores a $100.000</span>
            </div>
          </div>
          <Routes>
            <Route path="/" element={<><Navbar /><LandingPage /></>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/catalogo" element={<><Navbar /><CatalogPage /></>} />
            <Route path="/checkout" element={<><Navbar /><CheckoutPage /></>} />
            <Route path="/pedidos" element={<><Navbar /><OrdersPage /></>} />
            <Route path="/admin" element={<><Navbar /><AdminPage /></>} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
