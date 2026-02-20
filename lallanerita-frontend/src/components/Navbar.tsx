import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { Button } from "@/components/ui/button";
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
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(path) ? "bg-amber-500 text-black" : "text-gray-300 hover:text-white hover:bg-gray-800"}`}
      onClick={() => setMenuOpen(false)}
    >
      {icon}{label}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 bg-gray-950 border-b border-gray-800">
      <div className="mx-auto max-w-6xl px-4 flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="La Llanerita" className="h-8 w-8 rounded-full object-cover" />
          <span className="font-bold text-white text-lg">La Llanerita</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLink("/", "Inicio", <Home className="h-4 w-4" />)}
          {navLink("/catalogo", "Catalogo", <ShoppingCart className="h-4 w-4" />)}
          {user && navLink("/pedidos", "Pedidos", <Package className="h-4 w-4" />)}
          {isAdmin && navLink("/admin", "Admin", <Shield className="h-4 w-4" />)}
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="relative text-gray-300 hover:text-white" onClick={() => navigate("/checkout")}>
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">{itemCount}</span>
            )}
          </Button>

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-gray-400">{user.name}</span>
              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white" onClick={() => { logout(); navigate("/"); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button size="sm" className="hidden md:flex bg-amber-500 hover:bg-amber-600 text-black font-bold" onClick={() => navigate("/login")}>
              <User className="h-4 w-4 mr-1" /> Ingresar
            </Button>
          )}

          <Button size="sm" variant="ghost" className="md:hidden text-gray-300" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-gray-950 border-t border-gray-800 px-4 py-3 space-y-1">
          {navLink("/", "Inicio", <Home className="h-4 w-4" />)}
          {navLink("/catalogo", "Catalogo", <ShoppingCart className="h-4 w-4" />)}
          {user && navLink("/pedidos", "Pedidos", <Package className="h-4 w-4" />)}
          {isAdmin && navLink("/admin", "Admin", <Shield className="h-4 w-4" />)}
          {user ? (
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-400 w-full" onClick={() => { logout(); navigate("/"); setMenuOpen(false); }}>
              <LogOut className="h-4 w-4" /> Cerrar Sesion
            </button>
          ) : (
            <Link to="/login" className="flex items-center gap-1.5 px-3 py-2 text-sm text-amber-400" onClick={() => setMenuOpen(false)}>
              <User className="h-4 w-4" /> Ingresar
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
