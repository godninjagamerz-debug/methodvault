const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mv_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authenticated) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errBody: { code?: string; message?: string } = {};
    try { errBody = await res.json(); } catch {}
    const error = new Error(errBody.message || `HTTP ${res.status}`) as Error & { code?: string; status: number };
    error.code = errBody.code;
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Auth
export const authApi = {
  register: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }, false),
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, false),
  me: () => request<User>('/auth/me'),
};

// Admin
export const adminApi = {
  listMethods: () => request<Method[]>('/admin/methods'),
  createMethod: (data: Partial<Method>) =>
    request<Method>('/admin/methods', { method: 'POST', body: JSON.stringify(data) }),
  getMethod: (id: string) => request<Method>(`/admin/methods/${id}`),
  updateMethod: (id: string, data: Partial<Method>) =>
    request<Method>(`/admin/methods/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteMethod: (id: string) =>
    request<void>(`/admin/methods/${id}`, { method: 'DELETE' }),
  generateCodes: (methodId: string, count: number) =>
    request<MethodCode[]>(`/admin/methods/${methodId}/codes`, { method: 'POST', body: JSON.stringify({ count }) }),
  listCodes: (methodId: string) => request<MethodCode[]>(`/admin/methods/${methodId}/codes`),
  revokeCode: (codeId: string) =>
    request<MethodCode>(`/admin/codes/${codeId}/revoke`, { method: 'POST' }),
  listUsers: () => request<User[]>('/admin/users'),
  listPurchases: () => request<Purchase[]>('/admin/purchases'),
};

// User methods
export const myApi = {
  listMethods: () => request<UserMethod[]>('/me/methods'),
  getMethod: (id: string) => request<Method>(`/me/methods/${id}`),
  redeem: (code: string) => request<{ message: string; method: Method }>('/me/redeem', { method: 'POST', body: JSON.stringify({ code }) }),
};

// Marketplace
export const marketplaceApi = {
  listMethods: () => request<Method[]>('/marketplace/methods', {}, false),
  getMethod: (id: string) => request<Method>(`/marketplace/methods/${id}`, {}, false),
};

// Purchases
export const purchasesApi = {
  createOrder: (method_id: string) =>
    request<{ id: string; razorpay_order_id: string; amount: number; currency: string; key_id: string }>('/purchases/orders', { method: 'POST', body: JSON.stringify({ method_id }) }),
  verify: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    request<{ message: string; method_id: string }>('/purchases/verify', { method: 'POST', body: JSON.stringify(data) }),
  listPurchases: () => request<Purchase[]>('/purchases'),
};

// Types
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface Method {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  thumbnail_url?: string;
  content?: string;
  published: boolean;
  marketplace_listed?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface MethodCode {
  id: string;
  code: string;
  method_id: string;
  status: 'unused' | 'redeemed' | 'revoked';
  redeemed_by?: string;
  redeemed_by_email?: string;
  redeemed_at?: string;
  created_at: string;
}

export interface UserMethod extends Method {
  source: 'code' | 'purchase';
  unlocked_at: string;
}

export interface Purchase {
  id: string;
  method_id: string;
  method_name?: string;
  user_email?: string;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'failed';
  razorpay_order_id: string;
  created_at: string;
}
