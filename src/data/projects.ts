import type { ArtSpec } from '../lib/art'

export interface Project {
  id: string
  title: string
  kicker: string
  year: string
  role: string
  tags: string[]
  blurb: string
  art: ArtSpec
}

/* SAMPLE COPY + SAMPLE ART — replace with Mehak's real projects and images.
   The project names come from the roadmap wireframe. */
const warm = ['#ff4d2e', '#ffc531', '#ff94b8', '#2f4bff', '#37d6a0']
const cool = ['#2f4bff', '#37d6a0', '#ffc531', '#14120f', '#ff4d2e']

export const projects: Project[] = [
  { id: 'dfi', title: 'DFI', kicker: 'Institutional', year: '2025', role: 'Design lead', tags: ['Plans', 'Massing'], blurb: 'A sample description for the DFI project: a stepped campus block that opens to a shaded courtyard.', art: { seed: 11, style: 'iso', palette: warm } },
  { id: 'college', title: 'College', kicker: 'Academic', year: '2024', role: 'Team member', tags: ['Studio', 'Sections'], blurb: 'Sample copy. A college studio project exploring thresholds between teaching spaces and the street.', art: { seed: 23, style: 'iso', palette: cool } },
  { id: 'north', title: 'North', kicker: 'Residential', year: '2025', role: 'Design + drawings', tags: ['Housing', 'Site'], blurb: 'Sample copy. North-facing courtyard housing, drawn as plans, sections and an exploded model.', art: { seed: 37, style: 'iso', palette: ['#ff94b8', '#ffc531', '#2f4bff', '#37d6a0', '#ff4d2e'] } },
  { id: 'master-planning', title: 'Concept Master Planning + Site', kicker: 'Urban', year: '2024', role: 'Concept design', tags: ['Master plan', 'Site'], blurb: 'Sample copy. Concept master plan: movement, water and a loose grid of public rooms.', art: { seed: 41, style: 'lines', palette: warm } },
  { id: 'plans-sections', title: 'Plans + Sections', kicker: 'Drawing', year: '2023', role: 'Drafting', tags: ['Plans', 'Sections'], blurb: 'Sample copy. A set of plans and sections drawn to be read like a story, floor by floor.', art: { seed: 53, style: 'lines', palette: cool } },
  { id: 'sustainable-research', title: 'Research on Sustainable Architecture', kicker: 'Research', year: '2024', role: 'Researcher', tags: ['Climate', 'Materials'], blurb: 'Sample copy. Notes and diagrams on passive cooling, local materials and low-carbon building.', art: { seed: 67, style: 'blobs', palette: ['#37d6a0', '#ffc531', '#2f4bff', '#ff94b8'] } },
  { id: 'kath-khuni', title: 'Kath Khuni Documentation', kicker: 'Documentation', year: '2023', role: 'Field documentation', tags: ['Heritage', 'Survey'], blurb: 'Sample copy. Measured drawings of Kath Khuni timber-and-stone construction.', art: { seed: 71, style: 'iso', palette: ['#c8873a', '#ffc531', '#14120f', '#ff4d2e', '#37d6a0'] } },
  { id: 'personal', title: 'Personal Work', kicker: 'Art', year: '2022–now', role: 'Artist', tags: ['Sketches', 'Paintings'], blurb: 'Sample copy. Sketchbook pages, paintings and small experiments made off-brief.', art: { seed: 83, style: 'blobs', palette: warm } },
  { id: 'alpn', title: 'ALPN Work', kicker: 'Professional', year: '2025', role: 'Architect', tags: ['Practice'], blurb: 'Sample copy. Selected work from practice, shown as drawings and models.', art: { seed: 97, style: 'iso', palette: ['#2f4bff', '#ff94b8', '#ffc531', '#37d6a0', '#14120f'] } },
]

export const projectIndex = (id: string | null) => Math.max(0, projects.findIndex((p) => p.id === id))
