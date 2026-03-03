import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

import { ShoppingCart, User, LogOut, Shield, Package, Home, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLink = (path: string, label: string, icon: React.ReactNode) => (
    <Link
      to={path}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(path) ? "bg-blue-600 text-white" : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"}`}
      onClick={() => setMenuOpen(false)}
    >
      {icon}{label}
    </Link>
  );

  return (
    <>
      {/* Navbar: only big centered logo + desktop nav links */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-center py-1">
          <Link to="/">
            <img src="/logo.png" alt="La Llanerita" className="h-16 md:h-20 object-contain" />
          </Link>
        </div>
        <div className="hidden md:flex items-center justify-center gap-1 pb-2">
          {navLink("/", "Inicio", <Home className="h-4 w-4" />)}
          {navLink("/catalogo", "Catalogo", <ShoppingCart className="h-4 w-4" />)}
          {isAdmin && navLink("/pedidos", "Pedidos", <Package className="h-4 w-4" />)}
          {isAdmin && navLink("/admin", "Admin", <Shield className="h-4 w-4" />)}
        </div>
      </nav>

      {/* Floating island - right side, vertically centered */}
      <div className="fixed right-3 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2 bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl shadow-lg px-2 py-3">
        <button
          className="relative p-2 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          onClick={() => navigate("/checkout")}
          title="Carrito"
        >
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">{itemCount}</span>
          )}
        </button>

        {user ? (
          <button
            className="p-2 rounded-xl text-gray-600 hover:text-red-500 hover:bg-red-50 transition-colors"
            onClick={() => { logout(); navigate("/"); }}
            title="Cerrar Sesion"
          >
            <LogOut className="h-5 w-5" />
          </button>
        ) : (
          <button
            className="p-2 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            onClick={() => navigate("/login")}
            title="Ingresar"
          >
            <User className="h-5 w-5" />
          </button>
        )}

        <button
          className="p-2 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          title="Menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Slide-out menu panel */}
      {menuOpen && (
        <div className="fixed right-16 top-1/2 -translate-y-1/2 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl px-4 py-4 space-y-1 min-w-48">
          {navLink("/", "Inicio", <Home className="h-4 w-4" />)}
          {navLink("/catalogo", "Catalogo", <ShoppingCart className="h-4 w-4" />)}
          {isAdmin && navLink("/pedidos", "Pedidos", <Package className="h-4 w-4" />)}
          {isAdmin && navLink("/admin", "Admin", <Shield className="h-4 w-4" />)}
          {user ? (
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-500 w-full rounded-lg hover:bg-red-50" onClick={() => { logout(); navigate("/"); setMenuOpen(false); }}>
              <LogOut className="h-4 w-4" /> Cerrar Sesion
            </button>
          ) : (
            <Link to="/login" className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 rounded-lg hover:bg-blue-50" onClick={() => setMenuOpen(false)}>
              <User className="h-4 w-4" /> Ingresar
            </Link>
          )}
        </div>
      )}
    </>
  );
}
