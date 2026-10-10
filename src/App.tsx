import { Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import BoilFilter from './components/BoilFilter'
import CartDrawer from './components/CartDrawer'
import Header from './components/Header'
import Contact from './pages/Contact'
import Home from './pages/Home'
import Portfolio from './pages/Portfolio'
import Store from './pages/Store'
import { CartProvider } from './store/cart'

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => {window.scrollTo(0, 0)}, [pathname])
  return null
}

export default function App() {
  return (
    <CartProvider>
      <BoilFilter />
      <ScrollTop />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/store" element={<Store />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <CartDrawer />
    </CartProvider>
  )
}
