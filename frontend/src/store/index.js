import { create } from 'zustand'

// ── Auth Store ────────────────────────────────────────────────────
export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,

  login: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
    set({ user, token })
  },

  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  isAdmin: () => {
    const state = useAuthStore.getState()
    return state.user?.is_admin === true
  }
}))

// ── Cart Store ────────────────────────────────────────────────────
export const useCartStore = create((set, get) => ({
  items: [],  // [{ product, quantity }]

  addItem: (product, quantity = 1) => {
    const items = get().items
    const existing = items.find(i => i.product.id === product.id)
    if (existing) {
      set({
        items: items.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      })
    } else {
      set({ items: [...items, { product, quantity }] })
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter(i => i.product.id !== productId) })
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }
    set({
      items: get().items.map(i =>
        i.product.id === productId ? { ...i, quantity } : i
      )
    })
  },

  clearCart: () => set({ items: [] }),

  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  totalPrice: () =>
    get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
}))
