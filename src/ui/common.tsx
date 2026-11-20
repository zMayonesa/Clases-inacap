import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Activity,
  ArrowRight,
  BookOpen,
  Boxes,
  ChartNoAxesCombined,
  CircuitBoard,
  ClipboardList,
  DraftingCompass,
  FlaskConical,
  FolderOpen,
  FunctionSquare,
  Gauge,
  GitFork,
  GraduationCap,
  Layers,
  Network,
  Orbit,
  PanelTop,
  Workflow,
  Zap,
  type LucideIcon,
} from 'lucide-react'
export const symbols: Record<string, LucideIcon> = {
  maquinas: Orbit,
  electronica: CircuitBoard,
  instrumentacion: Gauge,
  redes: Network,
  administracion: ChartNoAxesCombined,
  matematicas: FunctionSquare,
  autocad: DraftingCompass,
  cade: Workflow,
  lab: FlaskConical,
  book: BookOpen,
  work: ClipboardList,
  project: Boxes,
  software: Layers,
  board: PanelTop,
  folder: FolderOpen,
  eval: GraduationCap,
  activity: Activity,
  source: GitFork,
  zap: Zap,
}
export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const I = symbols[name] || BookOpen
  return <I size={size} strokeWidth={1.65} aria-hidden="true" />
}
export function Head({
  back,
  where,
  title,
  desc,
  action,
}: {
  back?: string
  where?: string
  title: string
  desc?: string
  action?: ReactNode
}) {
  return (
    <header className="page-head">
      {back && (
        <a className="crumb" href={back}>
          ← {where || 'Volver'}
        </a>
      )}
      <div className="head-row">
        <h1>{title}</h1>
        {action}
      </div>
      {desc && <p>{desc}</p>}
    </header>
  )
}
export function LinkBtn({
  href,
  children,
  sub = false,
}: {
  href: string
  children: ReactNode
  sub?: boolean
}) {
  return (
    <a className={'btn ' + (sub ? 'secondary' : 'primary')} href={href}>
      {children}
      <ArrowRight size={16} />
    </a>
  )
}
export function Flow({ steps, label = 'Esquema funcional' }: { steps: string[]; label?: string }) {
  return (
    <figure className="flow">
      <figcaption>{label}</figcaption>
      <div>
        {steps.map((s, i) => (
          <div className="flow-it" key={i}>
            <span>{s}</span>
            {i < steps.length - 1 && <ArrowRight size={18} aria-hidden="true" />}
          </div>
        ))}
      </div>
    </figure>
  )
}
export function NumberField({
  label,
  value,
  on,
  min,
  max,
  step = 1,
}: {
  label: string
  value: number
  on: (v: number) => void
  min?: number
  max?: number
  step?: number
}) {
  const [raw, setRaw] = useState(String(value)),
    focused = useRef(false)
  useEffect(() => {
    if (!focused.current) setRaw(String(value))
  }, [value])
  return (
    <label>
      {label}
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={raw}
        onFocus={() => (focused.current = true)}
        onBlur={() => {
          focused.current = false
          setRaw(String(value))
        }}
        onChange={(e) => {
          setRaw(e.target.value)
          const n = e.target.valueAsNumber
          if (
            Number.isFinite(n) &&
            (min === undefined || n >= min) &&
            (max === undefined || n <= max)
          )
            on(n)
        }}
      />
    </label>
  )
}
export function Range({
  label,
  value,
  on,
  min,
  max,
  step = 1,
  unit = '',
}: {
  label: string
  value: number
  on: (v: number) => void
  min: number
  max: number
  step?: number
  unit?: string
}) {
  return (
    <label className="range">
      <span>
        {label}
        <strong>
          {value.toLocaleString('es-CL')} {unit}
        </strong>
      </span>
      <input
        aria-label={label}
        type="range"
        value={value}
        onChange={(e) => on(+e.target.value)}
        min={min}
        max={max}
        step={step}
      />
    </label>
  )
}
export function Readings({ items }: { items: [string, string][] }) {
  return (
    <dl className="readings">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  )
}
export function ProgressBar({
  value,
  total,
  label,
}: {
  value: number
  total: number
  label: string
}) {
  return <progress aria-label={label} value={value} max={total || 1} />
}
export function Note({ children }: { children: ReactNode }) {
  return <p className="note">{children}</p>
}
export function useHash() {
  const [hash, set] = useState(() => location.hash || '#/')
  useEffect(() => {
    const f = () => set(location.hash || '#/')
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return hash
}
