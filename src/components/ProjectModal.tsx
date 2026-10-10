import { useEffect } from 'react'
import type { Project } from '../data/projects'
import { artDataUrl } from '../lib/art'

export default function ProjectModal({ p, onClose }: { p: Project; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={p.title} onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <img src={artDataUrl(p.art, 800, 1000)} alt={`${p.title} (sample artwork)`} />
        <div className="modal-text">
          <div className="card-kicker">
            {p.kicker} · {p.year}
          </div>
          <h2>{p.title}</h2>
          <p>{p.blurb}</p>
          <dl>
            <dt>Role</dt>
            <dd>{p.role}</dd>
            <dt>Tags</dt>
            <dd>{p.tags.join(', ')}</dd>
          </dl>
          <p className="muted small">Full project page (drawings, models, process) comes in a later stage.</p>
          <button className="btn solid" onClick={onClose}>
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  )
}
