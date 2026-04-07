const API_URL = import.meta.env.VITE_API_URL || "https://app-czbfsnbs.fly.dev";

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error del servidor" }));
    throw new Error(err.detail || "Error del servidor");
  }
  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (data: { email: string; password: string; name: string; phone: string; address: string }) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  getMe: () => request("/auth/me"),
  changePassword: (current_password: string, new_password: string) =>
    request("/auth/change-password", { method: "PUT", body: JSON.stringify({ current_password, new_password }) }),

  getCategories: () => request("/categories"),
  createCategory: (data: { name: string; description: string; image_url: string }) =>
    request("/categories", { method: "POST", body: JSON.stringify(data) }),
  updateCategory: (id: number, data: { name?: string; description?: string; image_url?: string }) =>
    request(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCategory: (id: number) => request(`/categories/${id}`, { method: "DELETE" }),

  getProducts: (params?: { category_id?: number; search?: string; active_only?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.category_id) q.set("category_id", String(params.category_id));
    if (params?.search) q.set("search", params.search);
    if (params?.active_only !== undefined) q.set("active_only", String(params.active_only));
    return request(`/products?${q.toString()}`);
  },
  getProduct: (id: number) => request(`/products/${id}`),
  createProduct: (data: Record<string, unknown>) =>
    request("/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id: number, data: Record<string, unknown>) =>
    request(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProduct: (id: number) => request(`/products/${id}`, { method: "DELETE" }),

  getPromotions: () => request("/promotions"),
  getAllPromotions: () => request("/promotions/all"),
  createPromotion: (data: Record<string, unknown>) =>
    request("/promotions", { method: "POST", body: JSON.stringify(data) }),
  updatePromotion: (id: number, data: Record<string, unknown>) =>
    request(`/promotions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePromotion: (id: number) => request(`/promotions/${id}`, { method: "DELETE" }),

  getOrders: (status?: string) => {
    const q = status ? `?status_filter=${status}` : "";
    return request(`/orders${q}`);
  },
  createOrder: (data: { items: { product_id: number; quantity: number }[]; notes: string }) =>
    request("/orders", { method: "POST", body: JSON.stringify(data) }),
  guestOrder: (data: Record<string, unknown>) =>
    request("/orders/guest", { method: "POST", body: JSON.stringify(data) }),
  adminCreateOrder: (data: Record<string, unknown>) =>
    request("/orders/admin", { method: "POST", body: JSON.stringify(data) }),
  updateOrderStatus: (id: number, status: string) =>
    request(`/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  cancelOrder: (id: number) => request(`/orders/${id}`, { method: "DELETE" }),
  deleteOrderPermanent: (id: number) => request(`/orders/${id}/permanent`, { method: "DELETE" }),

  getUsers: () => request("/users"),
  createUser: (data: Record<string, unknown>) =>
    request("/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id: number, data: Record<string, unknown>) =>
    request(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteUser: (id: number) => request(`/users/${id}`, { method: "DELETE" }),

  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request("/uploads", { method: "POST", body: formData });
  },

  getBanners: (active_only: boolean = true) => request(`/banners?active_only=${active_only}`),
  createBanner: (data: Record<string, unknown>) =>
    request("/banners", { method: "POST", body: JSON.stringify(data) }),
  updateBanner: (id: number, data: Record<string, unknown>) =>
    request(`/banners/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteBanner: (id: number) => request(`/banners/${id}`, { method: "DELETE" }),

  getServices: (active_only: boolean = true) => request(`/services?active_only=${active_only}`),
  createService: (data: Record<string, unknown>) =>
    request("/services", { method: "POST", body: JSON.stringify(data) }),
  updateService: (id: number, data: Record<string, unknown>) =>
    request(`/services/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteService: (id: number) => request(`/services/${id}`, { method: "DELETE" }),

  getFileUrl: (path: string) => `${API_URL}${path}`,
};
