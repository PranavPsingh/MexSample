import { useEffect, useState } from 'react'
import { artDataUrl } from '../lib/art'
import { inr, useCart } from '../store/cart'

export default function CartDrawer() {
  const { lines, total, isOpen, setOpen, dispatch } = useCart()
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOpen])

  return (
    <>
      <div className={'scrim' + (isOpen ? ' on' : '')} onClick={() => setOpen(false)} />
      <aside className={'drawer' + (isOpen ? ' on' : '')} aria-hidden={!isOpen} aria-label="Cart">
        <div className="drawer-head">
          <h2>Cart</h2>
          <button className="btn sm" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
        {lines.length === 0 ? (
          <p className="muted">Nothing here yet.</p>
        ) : (
          <ul className="drawer-list">
            {lines.map(({ product: p, qty }) => (
              <li key={p.id}>
                <img src={artDataUrl(p.art, 120, 150)} alt="" />
                <div>
                  <b>{p.title}</b>
                  <span>{inr(p.price)}</span>
                  <div className="qty">
                    <button onClick={() => dispatch({ type: 'dec', id: p.id })} aria-label="Fewer">−</button>
                    <em>{qty}</em>
                    <button onClick={() => dispatch({ type: 'add', product: p })} aria-label="More">+</button>
                    <button className="rm" onClick={() => dispatch({ type: 'remove', id: p.id })}>Remove</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="drawer-foot">
          <div className="total">
            <span>Total</span>
            <b>{inr(total)}</b>
          </div>
          <button
            className="btn solid"
            disabled={!lines.length}
            onClick={() => setMsg('Checkout (Razorpay / Stripe) is added in a later stage. This is the sample store.')}
          >
            <span>Checkout</span>
          </button>
          {msg && <p className="muted small">{msg}</p>}
        </div>
      </aside>
    </>
  )
}
