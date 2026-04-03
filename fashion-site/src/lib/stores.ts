import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
    isActive: boolean;
  };
  variant?: {
    id: string;
    name: string;
    attributes: Record<string, string>;
    images: string[];
  };
}

interface CartState {
  items: CartItem[];
  totalAmount: number;
  itemCount: number;
  discount: number;
  sessionId: string;
  setCart: (data: { items: CartItem[]; totalAmount: number; itemCount: number; discount: number }) => void;
  clearCart: () => void;
  getSessionId: () => string;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalAmount: 0,
      itemCount: 0,
      discount: 0,
      sessionId: '',

      setCart: (data) => set(data),

      clearCart: () =>
        set({
          items: [],
          totalAmount: 0,
          itemCount: 0,
          discount: 0,
        }),

      getSessionId: () => {
        let sessionId = get().sessionId;
        if (!sessionId) {
          sessionId = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          set({ sessionId });
        }
        return sessionId;
      },
    }),
    { name: 'cart-storage' }
  )
);

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'CUSTOMER';
  avatar: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateTokens: (accessToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),

      updateTokens: (accessToken) => set({ accessToken }),
    }),
    { name: 'auth-storage' }
  )
);

interface CompareState {
  items: string[];
  addItem: (id: string) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  isInCompare: (id: string) => boolean;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (id) =>
        set((state) => {
          if (state.items.length >= 4) return state;
          if (state.items.includes(id)) return state;
          return { items: [...state.items, id] };
        }),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i !== id) })),
      clearAll: () => set({ items: [] }),
      isInCompare: (id) => get().items.includes(id),
    }),
    { name: 'compare-storage' }
  )
);

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  setOpen: (open: boolean) => void;
  addMessage: (text: string, isUser: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  isOpen: false,
  messages: [
    { id: '1', text: 'Hello! How can I help you today?', isUser: false, timestamp: new Date() },
  ],
  setOpen: (isOpen) => set({ isOpen }),
  addMessage: (text, isUser) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { id: Date.now().toString(), text, isUser, timestamp: new Date() },
      ],
    })),
  clearMessages: () =>
    set({
      messages: [
        { id: '1', text: 'Hello! How can I help you today?', isUser: false, timestamp: new Date() },
      ],
    }),
}));