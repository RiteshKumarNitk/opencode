import { useAuthStore, useCartStore } from './stores';

const API_BASE = '/api';

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
}

async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, headers = {} } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (auth) {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      requestHeaders['Authorization'] = `Bearer ${accessToken}`;
    }
  }

  const sessionId = useCartStore.getState().getSessionId();
  if (sessionId) {
    requestHeaders['x-session-id'] = sessionId;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: requestHeaders,
    ...(body && { body: JSON.stringify(body) }),
  });

  if (response.status === 401 && auth) {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          useAuthStore.getState().updateTokens(refreshData.data.accessToken);

          requestHeaders['Authorization'] = `Bearer ${refreshData.data.accessToken}`;
          const retryResponse = await fetch(`${API_BASE}${path}`, {
            method,
            headers: requestHeaders,
            ...(body && { body: JSON.stringify(body) }),
          });

          const retryData = await retryResponse.json();
          if (!retryResponse.ok) {
            throw new Error(retryData.error || 'Request failed');
          }
          return retryData.data ?? retryData;
        }
      } catch {
        useAuthStore.getState().clearAuth();
      }
    }
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data.data ?? data;
}

export const authApi = {
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => {
    const sessionId = useCartStore.getState().getSessionId();
    return apiFetch('/auth/register', { method: 'POST', body: { ...data, sessionId }, auth: false });
  },

  login: (data: { email: string; password: string }) => {
    const sessionId = useCartStore.getState().getSessionId();
    return apiFetch('/auth/login', { method: 'POST', body: { ...data, sessionId }, auth: false });
  },

  me: () => apiFetch('/auth/me'),
};

export const productsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/products${query}`, { auth: false });
  },

  get: (id: string) => apiFetch(`/products/${id}`, { auth: false }),

  create: (data: Record<string, unknown>) =>
    apiFetch('/products', { method: 'POST', body: data }),

  update: (id: string, data: Record<string, unknown>) =>
    apiFetch(`/products/${id}`, { method: 'PATCH', body: data }),

  delete: (id: string) =>
    apiFetch(`/products/${id}`, { method: 'DELETE' }),
};

export const cartApi = {
  get: () => apiFetch('/cart', { auth: false }),

  addItem: (data: { productId: string; variantId?: string; quantity: number }) =>
    apiFetch('/cart', { method: 'POST', body: data, auth: false }),

  updateItem: (itemId: string, quantity: number) =>
    apiFetch(`/cart/${itemId}`, { method: 'PATCH', body: { quantity }, auth: false }),

  removeItem: (itemId: string) =>
    apiFetch(`/cart/${itemId}`, { method: 'DELETE', auth: false }),
};

export const ordersApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/orders${query}`);
  },

  get: (id: string) => apiFetch(`/orders/${id}`),

  create: (data: { addressId: string; couponCode?: string; notes?: string; paymentMethod: string }) =>
    apiFetch('/orders', { method: 'POST', body: data }),
};

export const addressesApi = {
  list: () => apiFetch('/addresses'),
  create: (data: Record<string, unknown>) => apiFetch('/addresses', { method: 'POST', body: data }),
  update: (id: string, data: Record<string, unknown>) => apiFetch(`/addresses/${id}`, { method: 'PATCH', body: data }),
  delete: (id: string) => apiFetch(`/addresses/${id}`, { method: 'DELETE' }),
};

export const paymentsApi = {
  create: (data: { orderId: string; method: string }) =>
    apiFetch('/payments', { method: 'POST', body: data }),

  verify: (data: { paymentId: string; method: string; gatewayPaymentId: string; gatewayOrderId: string; signature: string }) =>
    apiFetch('/payments/verify', { method: 'POST', body: data }),

  demoVerify: (data: { orderId: string }) =>
    apiFetch('/payments/demo-verify', { method: 'POST', body: data }),
};

export const couponsApi = {
  apply: (code: string) => apiFetch('/coupons', { method: 'POST', body: { code } }),
  remove: () => apiFetch('/coupons', { method: 'DELETE' }),
};

export const adminApi = {
  analytics: () => apiFetch('/admin/analytics'),

  users: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/admin/users${query}`);
  },

  orders: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/admin/orders${query}`);
  },

  products: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/admin/products${query}`);
  },
};
