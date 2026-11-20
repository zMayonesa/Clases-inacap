import { Component, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Activity,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  CircuitBoard,
  ClipboardCheck,
  ClipboardList,
  Database,
  FlaskConical,
  FolderKanban,
  House,
  Info,
  Layers,
  Menu,
  Moon,
  PanelTop,
  Sun,
  X,
} from 'lucide-react'
import { useHash, Head } from './ui/common'
import { Dashboard } from './ui/Dashboard'
import {
  Subjects,
  CoursePage,
  Foundation,
  LessonPage,
  LabCatalog,
  LabDetail,
  SoftwarePage,
} from './ui/Study'
import { Works, WorkPage, Backups, Project } from './ui/Works'
import { Sources, Model } from './ui/Info'
import { Planner, Progress, Reviews } from './ui/Planner'
import { Assessments, QuizPage } from './ui/Assess'
import { Board } from './board/Board'
import { CadEditor } from './lab/CadEditor'
import { useRecord } from './ui/hooks'
import { failure } from './core/storage'
const groups = [
  {
    label: 'Estudio',
    items: [
      ['/', 'Panel de estudio', House],
      ['/asignaturas', 'Asignaturas', BookOpen],
      ['/laboratorios', 'Laboratorio virtual', FlaskConical],
      ['/tablero/directo', 'Tablero eléctrico', CircuitBoard],
      ['/software', 'Biblioteca de software', Layers],
    ],
  },
  {
    label: 'Mi cuaderno',
    items: [
      ['/trabajos', 'Trabajos e informes', ClipboardList],
      ['/evaluaciones', 'Evaluaciones', ClipboardCheck],
      ['/plan', 'Calendario', CalendarDays],
      ['/progreso', 'Mi progreso', ChartNoAxesCombined],
      ['/proyecto', 'Proyecto integrador', FolderKanban],
    ],
  },
  {
    label: 'Academia',
    items: [
      ['/respaldo', 'Respaldo local', Database],
      ['/fuentes', 'Fuentes académicas', Info],
    ],
  },
] as const
const parent: Record<string, string> = {
  curso: 'asignaturas',
  clase: 'asignaturas',
  base: 'asignaturas',
  lab: 'laboratorios',
  dibujo: 'laboratorios',
  trabajo: 'trabajos',
  informe: 'trabajos',
  prueba: 'evaluaciones',
  modelo: 'tablero',
}
function Route({ parts: p }: { parts: string[] }) {
  const [a, b, c] = p
  switch (a) {
    case '':
      return <Dashboard />
    case 'asignaturas':
      return <Subjects />
    case 'curso':
      return <CoursePage id={b} />
    case 'base':
      return <Foundation id={b} />
    case 'clase':
      return <LessonPage id={b} n={Number(c) - 1} />
    case 'laboratorios':
      return <LabCatalog course={b} />
    case 'lab':
      return <LabDetail id={b} />
    case 'tablero':
      return <Board practice={b || 'directo'} slot={c || b || 'directo'} />
    case 'dibujo':
      return <CadEditor />
    case 'software':
      return <SoftwarePage />
    case 'trabajos':
      return <Works />
    case 'trabajo':
    case 'informe':
      return <WorkPage id={b} report={a === 'informe'} />
    case 'evaluaciones':
      return <Assessments />
    case 'prueba':
      return <QuizPage parts={p.slice(1)} />
    case 'repasos':
      return (
        <>
          <Head title="Repasos programados" back="#/plan" />
          <Reviews />
        </>
      )
    case 'plan':
      return <Planner />
    case 'progreso':
      return <Progress />
    case 'respaldo':
      return <Backups />
    case 'proyecto':
      return <Project />
    case 'fuentes':
      return <Sources />
    case 'modelo':
      return <Model />
    default:
      return <Head title="Página no encontrada" back="#/" where="Panel de estudio" />
  }
}
class Bound extends Component<{ children: ReactNode }, { broken: boolean }> {
  state = { broken: false }
  static getDerivedStateFromError() {
    return { broken: true }
  }
  render() {
    return this.state.broken ? (
      <section className="panel">
        <h1>No se pudo abrir esta vista</h1>
        <a href="#/">Volver al panel</a>
      </section>
    ) : (
      this.props.children
    )
  }
}
export function App() {
  const hash = useHash(),
    p = hash.replace(/^#\/?/, '').split('/'),
    section = parent[p[0]] || p[0],
    list = groups.flatMap((g) => [...g.items]),
    active = list.find(([r]) => r.split('/')[1] === section),
    [open, O] = useState(false),
    [theme, T] = useRecord<'dark' | 'light'>('theme', 'dark'),
    [online, On] = useState(navigator.onLine),
    [offline, F] = useState(false),
    main = useRef<HTMLElement>(null),
    menu = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  useEffect(() => {
    O(false)
    window.scrollTo(0, 0)
    main.current?.focus({ preventScroll: true })
    document.title =
      (main.current?.querySelector('h1')?.textContent || 'Panel de estudio') + ' · Academia AR'
  }, [hash])
  useEffect(() => {
    const f = () => On(navigator.onLine)
    window.addEventListener('online', f)
    window.addEventListener('offline', f)
    if ('serviceWorker' in navigator && import.meta.env.PROD)
      navigator.serviceWorker
        .register(import.meta.env.BASE_URL + 'sw.js', { scope: import.meta.env.BASE_URL })
        .then(() => navigator.serviceWorker.ready)
        .then(() => F(true))
        .catch(() => F(false))
    return () => {
      window.removeEventListener('online', f)
      window.removeEventListener('offline', f)
    }
  }, [])
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        O(false)
        menu.current?.focus()
      }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open])
  const toggle = () => void T(theme === 'dark' ? 'light' : 'dark')
  return (
    <div className="app">
      <a
        className="skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          main.current?.focus()
        }}
      >
        Saltar al contenido
      </a>
      {open && <button className="scrim" aria-label="Cerrar menú" onClick={() => O(false)} />}
      <aside className={'sidebar ' + (open ? 'opened' : '')} aria-label="Navegación de la academia">
        <a className="brand" href="#/">
          <span className="brand-icon">
            <Activity size={25} />
          </span>
          <span>
            Academia <b>AR</b>
            <small>Automatización y Robótica</small>
          </span>
        </a>
        <button className="close-menu" onClick={() => O(false)} aria-label="Cerrar navegación">
          <X size={20} />
        </button>
        <nav aria-label="Menú principal">
          {groups.map((g) => (
            <div className="nav-group" key={g.label}>
              <p>{g.label}</p>
              {g.items.map(([href, title, I]) => (
                <a
                  key={href}
                  href={'#' + href}
                  className={active?.[0] === href ? 'active' : ''}
                  aria-current={active?.[0] === href ? 'page' : undefined}
                  onClick={() => O(false)}
                >
                  <I size={18} strokeWidth={1.65} />
                  {title}
                </a>
              ))}
            </div>
          ))}
        </nav>
        <div className="identity">
          <span>AR</span>
          <div>
            <b>Estudio personal</b>
            <small>San Pedro de la Paz</small>
          </div>
        </div>
      </aside>
      <div className="body-col">
        <header className="topbar">
          <div>
            <button
              ref={menu}
              className="menu-toggle"
              aria-expanded={open}
              aria-label="Abrir navegación"
              onClick={() => O(!open)}
            >
              <Menu size={21} />
            </button>
            <span className="top-brand">Mi academia</span>
            <ChevronRight size={14} />
            <b>{active?.[1] || 'Academia'}</b>
          </div>
          <div>
            <span className="net-status">
              <i />
              {!online ? 'Sin conexión' : offline ? 'Disponible offline' : 'Estudio local'}
            </span>
            <button
              className="theme"
              aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
              onClick={toggle}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>
        <main
          id="main"
          ref={main}
          tabIndex={-1}
          className={p[0] === 'informe' || p[0] === 'dibujo' ? 'print-mode' : ''}
        >
          {failure && (
            <p role="alert" className="notice">
              {failure}
            </p>
          )}
          <Bound key={hash}>
            <Route parts={p} />
          </Bound>
        </main>
        <footer>
          Academia independiente de estudio · Automatización y Robótica · San Pedro de la Paz
        </footer>
      </div>
      <nav className="mobile-nav" aria-label="Accesos móviles">
        {[
          ['/', 'Inicio', House],
          ['/asignaturas', 'Cursos', BookOpen],
          ['/laboratorios', 'Laboratorio', FlaskConical],
        ].map(([r, t, I]) => {
          const Tag = I as typeof PanelTop
          return (
            <a key={String(r)} href={'#' + r} className={active?.[0] === r ? 'active' : ''}>
              <Tag size={19} />
              {String(t)}
            </a>
          )
        })}
        <button onClick={() => O(!open)} aria-expanded={open}>
          <Menu size={19} />
          Más
        </button>
      </nav>
    </div>
  )
}
