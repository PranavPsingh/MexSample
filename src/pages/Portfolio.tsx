import { lazy, Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import FlipBook from '../components/FlipBook'
import ProjectModal from '../components/ProjectModal'
import { projectIndex, projects } from '../data/projects'
import type { Project } from '../data/projects'

const ModelScene = lazy(() => import('../scene/ModelScene'))

export default function Portfolio() {
  const [sp, setSp] = useSearchParams()
  const view = sp.get('view') === 'model' ? 'model' : 'cards'
  const open = sp.get('open')
  const [detail, setDetail] = useState<Project | null>(null)

  useEffect(() => {
    document.body.classList.add('no-scroll')
    return () => document.body.classList.remove('no-scroll')
  }, [])

  const setView = (v: 'cards' | 'model') => setSp(v === 'model' ? { view: 'model' } : open ? { open } : {})

  return (
    <main className="portfolio">
      <div className="pf-bar">
        <div>
          <p className="note">Selected work</p>
          <h1>Projects</h1>
        </div>
        <div className="seg" role="tablist" aria-label="View">
          <button role="tab" aria-selected={view === 'cards'} className={view === 'cards' ? 'on' : ''} onClick={() => setView('cards')}>
            Cards
          </button>
          <button role="tab" aria-selected={view === 'model'} className={view === 'model' ? 'on' : ''} onClick={() => setView('model')}>
            3D model
          </button>
        </div>
      </div>

      {view === 'cards' ? (
        <FlipBook key={open ?? 'start'} projects={projects} initialIndex={projectIndex(open)} onOpen={setDetail} paused={!!detail} />
      ) : (
        <div className="model-wrap">
          <Suspense fallback={<div className="loading">Loading the model…</div>}>
            <ModelScene onSelect={(id) => setSp({ open: id })} />
          </Suspense>
          <p className="flip-hint">Drag to orbit · click a plane to open it</p>
        </div>
      )}

      {detail && <ProjectModal p={detail} onClose={() => setDetail(null)} />}
    </main>
  )
}
