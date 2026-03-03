import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface CartItem {
  product_id: number;
  name: string;
  price: number;
  final_price: number;
  quantity: number;
  unit: string;
  image_url: string;
  discount_percent: number | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  removeItem: (product_id: number) => void;
  updateQuantity: (product_id: number, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | null>(null);
const CART_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

function loadCart(): CartItem[] {
  const saved = localStorage.getItem("cart");
  const timestamp = localStorage.getItem("cart_timestamp");
  if (!saved || !timestamp) return [];
  const elapsed = Date.now() - Number(timestamp);
  if (elapsed > CART_EXPIRY_MS) {
    localStorage.removeItem("cart");
    localStorage.removeItem("cart_timestamp");
    return [];
  }
  return JSON.parse(saved);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
    if (items.length > 0) {
      if (!localStorage.getItem("cart_timestamp")) {
        localStorage.setItem("cart_timestamp", String(Date.now()));
      }
    } else {
      localStorage.removeItem("cart_timestamp");
    }
  }, [items]);

  const clearExpired = useCallback(() => {
    const timestamp = localStorage.getItem("cart_timestamp");
    if (timestamp && Date.now() - Number(timestamp) > CART_EXPIRY_MS) {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(clearExpired, 30_000); // check every 30s
    return () => clearInterval(interval);
  }, [clearExpired]);

  const addItem = (item: Omit<CartItem, "quantity">, quantity: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === item.product_id);
      if (existing) {
        return prev.map((i) => i.product_id === item.product_id ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const removeItem = (product_id: number) => {
    setItems((prev) => prev.filter((i) => i.product_id !== product_id));
  };

  const updateQuantity = (product_id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(product_id);
      return;
    }
    setItems((prev) => prev.map((i) => i.product_id === product_id ? { ...i, quantity } : i));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.final_price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
