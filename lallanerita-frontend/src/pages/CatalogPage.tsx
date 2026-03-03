import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { useCart } from "../contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Plus, Minus, Tag } from "lucide-react";

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  category_id: number | null;
  category_name: string | null;
  image_url: string | null;
  stock: number;
  min_order: number;
  is_active: boolean;
  discount_percent: number | null;
  final_price: number;
}

interface Category {
  id: number;
  name: string;
}

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
}

export default function CatalogPage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const { addItem, items } = useCart();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    api.getCategories().then(setCategories);
    const catParam = searchParams.get("categoria");
    if (catParam) setSelectedCategory(Number(catParam));
  }, [searchParams]);

  useEffect(() => {
    api.getProducts({ category_id: selectedCategory || undefined, search: search || undefined }).then(setProducts);
  }, [selectedCategory, search]);

  const getQty = (p: Product) => quantities[p.id] ?? p.min_order;
  const setQty = (id: number, val: number) => setQuantities((prev) => ({ ...prev, [id]: val }));
  const inCart = (id: number) => items.some((i) => i.product_id === id);

  const handleAdd = (p: Product) => {
    addItem(
      { product_id: p.id, name: p.name, price: p.price, final_price: p.final_price, unit: p.unit, image_url: p.image_url || "", discount_percent: p.discount_percent },
      getQty(p)
    );
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm px-4 py-3">
        <div className="mx-auto max-w-6xl flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar productos..."
              className="pl-10 bg-gray-50 border-gray-300 text-gray-900"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="sticky top-[52px] z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
        <div className="mx-auto max-w-6xl flex gap-2 overflow-x-auto pb-1">
          <Button
            size="sm"
            variant={selectedCategory === null ? "default" : "outline"}
            className={selectedCategory === null ? "bg-blue-600 text-white font-bold" : "border-gray-300 text-gray-700 font-semibold hover:bg-gray-100"}
            onClick={() => setSelectedCategory(null)}
          >
            Todos
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={selectedCategory === c.id ? "default" : "outline"}
              className={selectedCategory === c.id ? "bg-blue-600 text-white font-bold" : "border-gray-300 text-gray-700 font-semibold hover:bg-gray-100"}
              onClick={() => setSelectedCategory(c.id)}
            >
              {c.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ShoppingCart className="mx-auto h-12 w-12 mb-4" />
            <p>No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <Card key={p.id} className="bg-white border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
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
                      <ShoppingCart className="h-10 w-10" />
                    </div>
                  )}
                  {p.discount_percent && (
                    <Badge className="absolute top-2 right-2 bg-red-600 text-white">
                      <Tag className="h-3 w-3 mr-1" />-{p.discount_percent}%
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-bold text-gray-900 text-sm truncate">{p.name}</h3>
                  {p.category_name && <p className="text-xs text-blue-600">{p.category_name}</p>}
                  <div className="mt-1">
                    {p.discount_percent ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm line-through text-gray-400">{formatCOP(p.price)}</span>
                        <span className="text-sm font-bold text-blue-600">{formatCOP(p.final_price)}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-blue-600">{formatCOP(p.price)}</span>
                    )}
                    <span className="text-xs text-gray-500 ml-1">/ {p.unit}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0 border-gray-300" onClick={() => setQty(p.id, Math.max(p.min_order, getQty(p) - 1))}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      className="h-7 w-12 text-center text-xs bg-gray-50 border-gray-300 text-gray-900 p-0"
                      value={getQty(p)}
                      onChange={(e) => setQty(p.id, Math.max(p.min_order, Number(e.target.value)))}
                    />
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0 border-gray-300" onClick={() => setQty(p.id, getQty(p) + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    className={`w-full mt-2 font-bold text-xs ${inCart(p.id) ? "bg-green-600 hover:bg-green-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                    onClick={() => handleAdd(p)}
                  >
                    {inCart(p.id) ? "Agregado +" : "Agregar"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
