import { createContext, useContext, useMemo, useReducer, useState } from 'react'
import type { ReactNode } from 'react'
import type { Product } from '../data/products'

interface Line {
  product: Product
  qty: number
}
type Action = { type: 'add'; product: Product } | { type: 'dec'; id: string } | { type: 'remove'; id: string } | { type: 'clear' }

function reducer(state: Line[], a: Action): Line[] {
  switch (a.type) {
    case 'add': {
      const hit = state.find((l) => l.product.id === a.product.id)
      return hit
        ? state.map((l) => (l === hit ? { ...l, qty: l.qty + 1 } : l))
        : [...state, { product: a.product, qty: 1 }]
    }
    case 'dec':
      return state.flatMap((l) => (l.product.id === a.id ? (l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : []) : [l]))
    case 'remove':
      return state.filter((l) => l.product.id !== a.id)
    case 'clear':
      return []
  }
}

interface Ctx {
  lines: Line[]
  count: number
  total: number
  isOpen: boolean
  setOpen: (v: boolean) => void
  dispatch: React.Dispatch<Action>
}
const CartCtx = createContext<Ctx | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, [])
  const [isOpen, setOpen] = useState(false)
  const value = useMemo<Ctx>(
    () => ({
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      total: lines.reduce((s, l) => s + l.qty * l.product.price, 0),
      isOpen,
      setOpen,
      dispatch,
    }),
    [lines, isOpen],
  )
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}

export function useCart() {
  const c = useContext(CartCtx)
  if (!c) throw new Error('useCart must be used inside CartProvider')
  return c
}

export const inr = (n: number) => '₹' + n.toLocaleString('en-IN')
