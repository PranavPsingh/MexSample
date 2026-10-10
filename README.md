# Mehak Singh: Portfolio + Store (sample build)

Vite · React 18 · TypeScript · Three.js via @react-three/fiber + drei · react-router.

## Run it
    npm install
    npm run dev        # http://localhost:5173
    npm run build      # type-check + production build into dist/
    npm run preview    # serve the production build

## What's where
| Path | What it does |
|---|---|
| `src/pages/Home.tsx` | Landing: 3 scroll stages (flat axonometric, isometric + projected plan, exploded slabs) |
| `src/scene/HeroScene.tsx` | The 3D hero scene (made-up sample geometry) |
| `src/pages/Portfolio.tsx` | Portfolio page: Cards (Option 1) / 3D model (Option 2) toggle |
| `src/components/FlipBook.tsx` | Two-card flip-book + fast-scroll riffle reel. **Tuning knobs at the top (`TUNING`)** |
| `src/scene/ModelScene.tsx` | Option 2: white slab with project planes standing on it |
| `src/pages/Store.tsx`, `src/store/cart.tsx` | Store + client-side cart (no payments yet) |
| `src/components/Header.tsx`, `Squiggle.tsx`, `BoilFilter.tsx` | Header on every page, moving squiggly lines, hand-drawn wobble |
| `src/data/projects.ts`, `products.ts` | **All content lives here.** Replace the sample copy and art |
| `src/lib/art.ts` | Procedural sample artwork. Delete once real images exist |
| `src/styles.css` | All styling and colour tokens (`:root`) |

## Swapping in real images
In `projects.ts` / `products.ts` each item has an `art` spec. Add an `image: '/images/dfi.jpg'` field
(put files in `public/images/`) and use it where `artDataUrl(p.art, ...)` is called
(`FlipBook.tsx`, `ProjectModal.tsx`, `Store.tsx`, `CartDrawer.tsx`; `ModelScene.tsx` uses `makeArtCanvas`).
For real 3D models, load `.glb` files with drei's `useGLTF` in `HeroScene.tsx`.
