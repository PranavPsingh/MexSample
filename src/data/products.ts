import type { ArtSpec } from '../lib/art'

export type ProductKind = 'Posters' | 'Paintings' | 'Postcards' | 'Digital sketches' | '3D art'
export const kinds: ProductKind[] = ['Posters', 'Paintings', 'Postcards', 'Digital sketches', '3D art']

export interface Product {
  id: string
  title: string
  kind: ProductKind
  price: number // INR
  note: string
  art: ArtSpec
  landscape?: boolean
}

/* SAMPLE PRODUCTS — "only artwork": posters, paintings, postcards, digital sketches, 3D art (?) */
const warm = ['#ff4d2e', '#ffc531', '#ff94b8', '#2f4bff', '#37d6a0']
const cool = ['#2f4bff', '#37d6a0', '#ffc531', '#14120f', '#ff4d2e']

export const products: Product[] = [
  { id: 'p1', title: 'Courtyard Study No. 1', kind: 'Posters', price: 1200, note: 'A2 giclée print', art: { seed: 101, style: 'iso', palette: warm } },
  { id: 'p2', title: 'Exploded Slabs', kind: 'Posters', price: 1400, note: 'A2 giclée print', art: { seed: 102, style: 'iso', palette: cool } },
  { id: 'p3', title: 'Plan, Coloured In', kind: 'Posters', price: 900, note: 'A3 print', art: { seed: 103, style: 'lines', palette: warm } },
  { id: 'pa1', title: 'Monsoon Blocks', kind: 'Paintings', price: 18000, note: 'Acrylic on canvas · 60×80 cm · original', art: { seed: 111, style: 'blobs', palette: warm } },
  { id: 'pa2', title: 'Slow Afternoon', kind: 'Paintings', price: 22000, note: 'Gouache on paper · 50×70 cm · original', art: { seed: 112, style: 'blobs', palette: ['#37d6a0', '#ffc531', '#2f4bff', '#ff94b8'] } },
  { id: 'pa3', title: 'Edge of a Plan', kind: 'Paintings', price: 15000, note: 'Ink + acrylic · 40×50 cm · original', art: { seed: 113, style: 'lines', palette: cool } },
  { id: 'c1', title: 'Postcards: Streets (set of 5)', kind: 'Postcards', price: 350, note: '10×15 cm · matte card', art: { seed: 121, style: 'iso', palette: warm }, landscape: true },
  { id: 'c2', title: 'Postcards: Sketchbook (set of 5)', kind: 'Postcards', price: 350, note: '10×15 cm · matte card', art: { seed: 122, style: 'lines', palette: cool }, landscape: true },
  { id: 'd1', title: 'Digital Sketch: Atrium', kind: 'Digital sketches', price: 250, note: 'High-res download · PNG', art: { seed: 131, style: 'lines', palette: warm } },
  { id: 'd2', title: 'Digital Sketch: Stairs', kind: 'Digital sketches', price: 250, note: 'High-res download · PNG', art: { seed: 132, style: 'blobs', palette: cool } },
  { id: 'a1', title: '3D Art: Tiny City', kind: '3D art', price: 3200, note: 'Printed model · 12 cm · edition of 20', art: { seed: 141, style: 'iso', palette: ['#ff4d2e', '#2f4bff', '#ffc531', '#ffffff', '#37d6a0'] } },
  { id: 'a2', title: '3D Art: Stacked Rooms', kind: '3D art', price: 3800, note: 'Printed model · 15 cm · edition of 20', art: { seed: 142, style: 'iso', palette: ['#ff94b8', '#37d6a0', '#14120f', '#ffc531', '#2f4bff'] } },
]
