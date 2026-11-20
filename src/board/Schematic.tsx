import { library, type Circuit, type Part } from './components'
import type { Simulation } from './engine'
import type { PointerEvent } from 'react'
export const blockWidth = 132
function sides(p: Part) {
  const pins = library[p.kind].pins
  if (['three', 'mono', 'dc'].includes(p.kind)) return [[], pins]
  if (p.kind === 'motor') return [pins, []]
  const h = Math.ceil(pins.length / 2)
  return [pins.slice(0, h), pins.slice(h)]
}
export const blockHeight = (p: Part) =>
  Math.max(67, 37 + Math.max(...sides(p).map((a) => a.length)) * 18)
export function pinPoint(p: Part, term: string) {
  const ss = sides(p),
    side = ss[0].includes(term) ? 0 : 1
  return { x: p.x + side * blockWidth, y: p.y + 34 + ss[side].indexOf(term) * 18 }
}
export function sizeOf(c: Circuit) {
  return {
    width: Math.max(600, ...c.parts.map((p) => p.x + blockWidth + 45)),
    height: Math.max(365, ...c.parts.map((p) => p.y + blockHeight(p) + 40)),
  }
}
type Props = {
  c: Circuit
  s?: Simulation
  selected?: string
  pin?: string
  wire?: string
  onPart?: (p: Part, e: PointerEvent<SVGGElement>) => void
  onPin?: (id: string) => void
  onWire?: (id: string) => void
  onMove?: (e: PointerEvent<SVGSVGElement>) => void
  onEnd?: () => void
  zoom?: number
  mini?: boolean
}
export function Schematic({
  c,
  s,
  selected,
  pin,
  wire,
  onPart,
  onPin,
  onWire,
  onMove,
  onEnd,
  zoom = 1,
  mini = false,
}: Props) {
  const { width, height } = sizeOf(c),
    lookup = Object.fromEntries(c.parts.map((p) => [p.id, p]))
  const point = (p: string) => {
    const [id, port] = p.split('.')
    return pinPoint(lookup[id], port)
  }
  return (
    <svg
      className="schematic"
      aria-label="Esquema de componentes y conductores"
      role="img"
      style={
        mini ? { width: '100%', height: 'auto' } : { width: width * zoom, height: height * zoom }
      }
      viewBox={'0 0 ' + width + ' ' + height}
      onPointerMove={onMove}
      onPointerUp={onEnd}
      onPointerCancel={onEnd}
    >
      <title>
        Esquema eléctrico. La tabla de conexiones ofrece la misma información por bornes.
      </title>
      {c.wires.map((w, i) => {
        if (!lookup[w.a.split('.')[0]] || !lookup[w.b.split('.')[0]]) return null
        const a = point(w.a),
          b = point(w.b)
        const mid = w.bend ?? (a.x + b.x) / 2 + ((i % 5) - 2) * 5
        const path = 'M' + a.x + ' ' + a.y + ' H' + mid + ' V' + b.y + ' H' + b.x
        return (
          <g key={w.id} onClick={() => onWire?.(w.id)}>
            <path
              className={
                'conductor ' +
                w.layer +
                (s?.live.includes(w.id) ? ' live' : '') +
                (w.id === wire ? ' selected' : '')
              }
              d={path}
            />
            <path d={path} fill="none" stroke="transparent" strokeWidth="12" className="wire-hit" />
          </g>
        )
      })}
      {c.parts.map((p) => (
        <g
          key={p.id}
          className={
            'board-part ' +
            (selected === p.id ? 'selected ' : '') +
            (s?.coils[p.id] || s?.lamps[p.id] ? 'energized ' : '') +
            (s?.tripped[p.id] ? 'tripped' : '')
          }
        >
          <g
            onPointerDown={(e) => onPart?.(p, e)}
            style={{ touchAction: 'none', cursor: onPart ? 'grab' : undefined }}
          >
            <rect
              className="part-body"
              x={p.x}
              y={p.y}
              width={blockWidth}
              height={blockHeight(p)}
              rx="5"
            />
            <path className="part-header" d={'M' + (p.x + 1) + ' ' + (p.y + 22) + 'h130'} />
            <text className="part-tag" x={p.x + 8} y={p.y + 16}>
              {p.tag}
            </text>
            <text
              className="part-glyph"
              x={p.x + 66}
              y={p.y + blockHeight(p) / 2 + 17}
              textAnchor="middle"
            >
              {library[p.kind].glyph}
            </text>
          </g>
          {library[p.kind].pins.map((term) => {
            const pos = pinPoint(p, term),
              left = pos.x === p.x,
              id = p.id + '.' + term
            return (
              <g
                key={term}
                onClick={(e) => {
                  e.stopPropagation()
                  onPin?.(id)
                }}
                style={{ cursor: onPin ? 'crosshair' : undefined }}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={pin === id ? 7 : 4}
                  className={'pin ' + (pin === id ? 'active' : '')}
                />
                <text
                  x={pos.x + (left ? 8 : -8)}
                  y={pos.y + 3}
                  textAnchor={left ? 'start' : 'end'}
                  className="pin-label"
                >
                  {term}
                </text>
                <circle cx={pos.x} cy={pos.y} r="9" fill="transparent" />
              </g>
            )
          })}
        </g>
      ))}
    </svg>
  )
}
export function WireTable({ c }: { c: Circuit }) {
  const name = (id: string) => {
    const [p, pin] = id.split('.')
    return (c.parts.find((x) => x.id === p)?.tag ?? p) + '.' + pin
  }
  return (
    <div className="table-wrap">
      <table>
        <caption>Lista de conexiones por bornes</caption>
        <thead>
          <tr>
            <th>Origen</th>
            <th>Destino</th>
            <th>Circuito</th>
          </tr>
        </thead>
        <tbody>
          {c.wires.map((w) => (
            <tr key={w.id}>
              <td>{name(w.a)}</td>
              <td>{name(w.b)}</td>
              <td>{w.layer}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
