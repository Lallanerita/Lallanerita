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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
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
