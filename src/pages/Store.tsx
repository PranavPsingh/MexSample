import { useRef, useState } from 'react'
import { kinds, products } from '../data/products'
import type { Product, ProductKind } from '../data/products'
import { artDataUrl } from '../lib/art'
import { inr, useCart } from '../store/cart'

function ProductCard({ p }: { p: Product }) {
  const { dispatch, setOpen } = useCart()
  const ref = useRef<HTMLDivElement>(null)
  const [added, setAdded] = useState(false)

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${(x * 12).toFixed(2)}deg`)
  }
  const onLeave = () => {
    ref.current?.style.setProperty('--rx', '0deg')
    ref.current?.style.setProperty('--ry', '0deg')
  }

  return (
    <article className="product">
      <div ref={ref} className="tilt" onPointerMove={onMove} onPointerLeave={onLeave}>
        <img
          src={p.landscape ? artDataUrl(p.art, 800, 560) : artDataUrl(p.art, 640, 800)}
          alt={`${p.title} (sample artwork)`}
          className={p.landscape ? 'land' : ''}
          draggable={false}
        />
      </div>
      <div className="product-info">
        <div>
          <h3>{p.title}</h3>
          <p>{p.note}</p>
        </div>
        <b>{inr(p.price)}</b>
      </div>
      <button
        className="btn"
        onClick={() => {
          dispatch({ type: 'add', product: p })
          setAdded(true)
          window.setTimeout(() => setAdded(false), 1200)
          setOpen(true)
        }}
      >
        <span>{added ? 'Added ✓' : 'Add to cart'}</span>
      </button>
    </article>
  )
}

export default function Store() {
  const [kind, setKind] = useState<ProductKind | 'All'>('All')
  const list = products.filter((p) => kind === 'All' || p.kind === kind)
  return (
    <main className="page store">
      <div className="page-head">
        <p className="note">The sale</p>
        <h1>Store</h1>
        <p className="lede">Only artwork: posters, paintings, postcards, digital sketches and small 3D pieces. Sample products shown.</p>
      </div>
      <div className="chips" role="tablist" aria-label="Filter by type">
        {(['All', ...kinds] as const).map((k) => (
          <button key={k} className={'chip' + (k === kind ? ' on' : '')} onClick={() => setKind(k)} role="tab" aria-selected={k === kind}>
            {k}
          </button>
        ))}
      </div>
      <div className="grid">
        {list.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </main>
  )
}
