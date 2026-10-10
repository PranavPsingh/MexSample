import { Link, NavLink } from 'react-router-dom'
import Squiggle from './Squiggle'
import { useCart } from '../store/cart'

/** Shown on ALL pages (wireframe): logo, moving squiggly lines, Contact + Store/Portfolio. */
export default function Header() {
  const { count, setOpen } = useCart()
  return (
    <header className="hdr">
      <Link to="/" className="logo" aria-label="Mehak Singh — home">
        <span className="logo-mark">M</span>
        <span className="logo-text">Mehak Singh</span>
      </Link>

      <div className="hdr-lines" aria-hidden>
        <Squiggle color="#14120f" amp={4} freq={0.028} speed={1.1} sw={2} />
        <Squiggle color="#ff4d2e" amp={5} freq={0.021} speed={-0.8} sw={2} phase={2} />
        <Squiggle color="#2f4bff" amp={3} freq={0.04} speed={1.6} sw={1.5} phase={4} />
      </div>

      <nav className="hdr-nav">
        <NavLink to="/portfolio" className="btn">
          <i>P</i>
          <span>Portfolio</span>
        </NavLink>
        <NavLink to="/store" className="btn">
          <i>S</i>
          <span>Store</span>
        </NavLink>
        <NavLink to="/contact" className="btn">
          <span>Contact</span>
        </NavLink>
        {count > 0 && (
          <button className="btn cart-btn" onClick={() => setOpen(true)} aria-label={`Open cart, ${count} items`}>
            <span>Cart</span>
            <b>{count}</b>
          </button>
        )}
      </nav>
    </header>
  )
}
