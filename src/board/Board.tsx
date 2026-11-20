import { useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, Plus, Minus, Download, Save } from 'lucide-react'
import { library, newPart, validateCircuit, type Circuit, type Kind, type Part } from './components'
import { benchTest, practices, template } from './practices'
import { initial, step, type Inputs, type Simulation } from './engine'
import { Schematic, WireTable } from './Schematic'
import { Head, Note, NumberField, Range, Readings } from '../ui/common'
import { change } from '../core/storage'
import { download, useRecord, useRecords } from '../ui/hooks'
import { fmt } from '../core/calculations'
type Project = { name: string; practice: string; circuit: Circuit }
export function Board({
  practice = 'directo',
  slot = practice,
}: {
  practice?: string
  slot?: string
}) {
  const valid = practices.some((p) => p[0] === practice)
  const kind = valid ? practice : 'directo'
  const lesson = practices.find((p) => p[0] === kind)!
  const [base] = useState<Project>(() => ({
    name: lesson[1],
    practice: kind,
    circuit: template(kind),
  }))
  const [proj, put] = useRecord('board:' + slot, base),
    all = useRecords(),
    c = proj.circuit
  const [editorOpen, showEditor] = useState(!c.parts.length)
  const [sim, view] = useState(initial),
    state = useRef(sim),
    inputs = useRef<Inputs>({ active: {}, load: 1 })
  const [running, run] = useState(false),
    [selected, select] = useState(''),
    [wire, selWire] = useState(''),
    [startPin, setStart] = useState(''),
    [endPin, setEnd] = useState(''),
    [layer, setLayer] = useState<'mando' | 'fuerza'>('mando'),
    [category, setCategory] = useState<Kind>('start'),
    [zoom, setZoom] = useState(0.78),
    [msg, say] = useState(''),
    [dragPart, setDrag] = useState<Part | null>(null)
  const [projectName, setProjectName] = useState(proj.name),
    [checks, setChecks] = useState<{ label: string; ok: boolean }[] | null>(null)
  const drag = useRef<{ p: Part; clientX: number; clientY: number; scale: number } | null>(null),
    surface = useRef<HTMLDivElement>(null),
    pinch = useRef(0)
  const item = c.parts.find((p) => p.id === selected),
    w = c.wires.find((x) => x.id === wire)
  const next = (dt: number) => {
    state.current = step(c, state.current, inputs.current, dt)
    view(state.current)
  }
  const stop = () => {
    run(false)
    state.current = initial()
    inputs.current = { active: {}, load: 1 }
    view(state.current)
  }
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => next(0.1), 100)
    return () => clearInterval(id)
  }, [running, c])
  function modify(nextCircuit: Circuit) {
    stop()
    setChecks(null)
    void put({ ...proj, circuit: nextCircuit })
    say('Proyecto actualizado.')
  }
  function alterPart(id: string, patch: Partial<Part>) {
    modify({ ...c, parts: c.parts.map((p) => (p.id === id ? { ...p, ...patch } : p)) })
  }
  function connect(a: string, b: string) {
    if (
      !a ||
      !b ||
      a === b ||
      c.wires.some((w) => (w.a === a && w.b === b) || (w.a === b && w.b === a))
    ) {
      say('Elige dos bornes distintos sin conexión directa previa.')
      return
    }
    modify({ ...c, wires: [...c.wires, { id: crypto.randomUUID(), a, b, layer }] })
    setStart('')
    setEnd('')
    say('Conductor conectado.')
  }
  function clickPin(id: string) {
    if (startPin) {
      connect(startPin, id)
    } else {
      setStart(id)
      say('Origen elegido. Toca el borne de destino.')
    }
  }
  function act(id: string, on: boolean) {
    inputs.current = { ...inputs.current, active: { ...inputs.current.active, [id]: on } }
    next(0)
  }
  async function copy(circuit: Circuit, name: string, routeKind = kind) {
    const id = crypto.randomUUID()
    await change('board:' + id, {}, { name, practice: routeKind, circuit })
    location.hash = '/tablero/' + routeKind + '/' + id
  }
  const pinOptions = c.parts.flatMap((p) =>
    library[p.kind].pins.map((pin) => (
      <option key={p.id + '.' + pin} value={p.id + '.' + pin}>
        {p.tag} · {pin}
      </option>
    )),
  )
  const motor = Object.values(sim.motors)[0]
  return (
    <>
      <Head
        back={'#/lab/' + kind}
        where="Guía y rúbrica"
        title="Tablero eléctrico"
        desc="Cablea los bornes, aplica una orden y sigue el estado del motor."
      />
      <div className="panel board-toolbar">
        <label>
          Práctica
          <select value={kind} onChange={(e) => (location.hash = '/tablero/' + e.target.value)}>
            {practices.map((p) => (
              <option key={p[0]} value={p[0]}>
                {p[1]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Proyectos guardados
          <select
            value={all['board:' + slot] ? slot : ''}
            onChange={(e) => {
              const p = all['board:' + e.target.value] as Project
              if (p) location.hash = '/tablero/' + p.practice + '/' + e.target.value
            }}
          >
            <option value="">Plantilla de estudio</option>
            {Object.entries(all)
              .filter(([k]) => k.startsWith('board:'))
              .map(([k, v]) => (
                <option key={k} value={k.slice(6)}>
                  {(v as Project).name}
                </option>
              ))}
          </select>
        </label>
        <button onClick={() => copy(template('vacio'), lesson[1] + ' · construcción')}>
          Construir desde cero
        </button>
        <button onClick={() => copy(template(kind), lesson[1] + ' · copia')}>
          Abrir plantilla nueva
        </button>
      </div>
      <div className="panel board-panel">
        <div className="board-bar">
          <strong>{proj.name}</strong>
          <span className="mono">
            {running ? 'En ejecución' : sim.time ? 'En pausa' : 'Edición'} · {fmt(sim.time, 1)} s
          </span>
          <div className="inline">
            <button
              aria-label="Reducir zoom"
              onClick={() => setZoom((z) => Math.max(0.35, z - 0.15))}
            >
              <Minus size={16} />
            </button>
            <button
              aria-label="Aumentar zoom"
              onClick={() => setZoom((z) => Math.min(2, z + 0.15))}
            >
              <Plus size={16} />
            </button>
            <button onClick={() => setZoom(0.78)}> {Math.round(zoom * 100)} %</button>
          </div>
        </div>
        <div
          className="board-canvas"
          role="region"
          ref={surface}
          tabIndex={0}
          aria-label="Lienzo desplazable del tablero"
          onTouchStart={(e) => {
            if (e.touches.length === 2)
              pinch.current = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY,
              )
          }}
          onTouchMove={(e) => {
            if (e.touches.length !== 2 || !pinch.current) return
            const gap = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY,
            )
            if (Math.abs(gap - pinch.current) > 12) {
              setZoom((z) => Math.max(0.35, Math.min(2, (z * gap) / pinch.current)))
              pinch.current = gap
            }
          }}
          onTouchEnd={() => {
            pinch.current = 0
          }}
        >
          <Schematic
            c={
              dragPart
                ? { ...c, parts: c.parts.map((p) => (p.id === dragPart.id ? dragPart : p)) }
                : c
            }
            s={sim}
            selected={selected}
            wire={wire}
            pin={startPin}
            zoom={zoom}
            onPart={(p, e) => {
              select(p.id)
              selWire('')
              if (running) return
              drag.current = { p, clientX: e.clientX, clientY: e.clientY, scale: zoom }
              e.currentTarget.setPointerCapture(e.pointerId)
            }}
            onMove={(e) => {
              const d = drag.current
              if (!d) return
              setDrag({
                ...d.p,
                x: Math.max(15, Math.round(d.p.x + (e.clientX - d.clientX) / d.scale)),
                y: Math.max(15, Math.round(d.p.y + (e.clientY - d.clientY) / d.scale)),
              })
            }}
            onEnd={() => {
              if (
                drag.current &&
                dragPart &&
                (dragPart.x !== drag.current.p.x || dragPart.y !== drag.current.p.y)
              )
                alterPart(dragPart.id, { x: dragPart.x, y: dragPart.y })
              drag.current = null
              setDrag(null)
            }}
            onPin={running ? undefined : clickPin}
            onWire={(id) => {
              selWire(id)
              select('')
            }}
          />
        </div>
        <div className="canvas-legend">
          <span>━ Mando</span>
          <span>┅ Fuerza</span>
          <span>● Borne</span>
          <span>Arrastra el fondo en móvil para desplazarte.</span>
        </div>
      </div>
      <section className="panel">
        <div className="section-line">
          <h2>Simulación</h2>
          <div className="inline">
            <button
              className="primary"
              onClick={() => {
                if (!running) next(0)
                run(!running)
              }}
            >
              {running ? <Pause size={16} /> : <Play size={16} />} {running ? 'Pausar' : 'Ejecutar'}
            </button>
            <button onClick={stop}>
              <RotateCcw size={16} /> Reiniciar
            </button>
          </div>
        </div>
        <p>
          Activa QF cuando esté presente. Mantén pulsada la marcha o usa Enter para aplicar un
          pulso. Los mandos operan durante la ejecución.
        </p>
        <div className="inline">
          {c.parts
            .filter((p) =>
              [
                'start',
                'stop',
                'select',
                'emergency',
                'isolator',
                'breaker',
                'limit',
                'rcd',
              ].includes(p.kind),
            )
            .map((p) => {
              const moment = p.kind === 'start' || p.kind === 'stop',
                label =
                  p.tag +
                  ' · ' +
                  (
                    {
                      start: 'Marcha',
                      stop: 'Paro',
                      emergency: 'Emergencia',
                      breaker: 'Alimentación',
                      isolator: 'General',
                      select: 'Selector',
                      limit: 'Carrera',
                      rcd: 'Ensayo',
                    } as Record<string, string>
                  )[p.kind]
              return moment ? (
                <button
                  key={p.id}
                  disabled={!running}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId)
                    act(p.id, true)
                  }}
                  onPointerUp={() => act(p.id, false)}
                  onPointerCancel={() => act(p.id, false)}
                  onClick={(e) => {
                    if (e.detail === 0) {
                      act(p.id, true)
                      act(p.id, false)
                    }
                  }}
                >
                  {label}
                </button>
              ) : (
                <button
                  key={p.id}
                  disabled={!running}
                  aria-pressed={!!inputs.current.active[p.id]}
                  onClick={() => act(p.id, !inputs.current.active[p.id])}
                >
                  {label} · {inputs.current.active[p.id] ? 'ON' : 'OFF'}
                </button>
              )
            })}
        </div>
        <Range
          label="Carga mecánica simulada"
          value={Math.round(inputs.current.load * 100)}
          on={(v) => {
            inputs.current.load = v / 100
            next(0)
          }}
          min={25}
          max={250}
          unit="%"
        />
        {motor && (
          <div className="motor-meter">
            <svg viewBox="0 0 100 100" role="img" aria-label={'Rotor en ' + motor.state}>
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <path
                  key={deg}
                  d="M40 9h20l-3 9H43Z"
                  transform={'rotate(' + deg + ' 50 50)'}
                  fill="currentColor"
                  opacity=".5"
                />
              ))}
              <g transform={'rotate(' + motor.angle + ' 50 50)'}>
                {[0, 120, 240].map((deg) => (
                  <path
                    key={deg}
                    d="M48 47Q30 40 36 24Q50 24 55 45Z"
                    transform={'rotate(' + deg + ' 50 50)'}
                    fill="currentColor"
                  />
                ))}
              </g>
              <circle cx="50" cy="50" r="6" fill="currentColor" />
            </svg>
            <span>
              Rotor <b>{motor.state}</b>
              <small>Giro visual a escala 1:60</small>
            </span>
          </div>
        )}
        {c.parts
          .filter((p) => p.kind === 'drive')
          .map((p) => (
            <Range
              key={p.id}
              label={p.tag + ' · frecuencia de salida consignada'}
              min={0}
              max={60}
              unit="Hz"
              value={p.value ?? 50}
              on={(value) => {
                void put({
                  ...proj,
                  circuit: {
                    ...c,
                    parts: c.parts.map((v) => (v.id === p.id ? { ...v, value } : v)),
                  },
                })
              }}
            />
          ))}
        {motor && (
          <Readings
            items={[
              ['Estado del eje', motor.state],
              ['Velocidad del eje', fmt(motor.speed, 0) + ' rpm'],
              ['Frecuencia', fmt(motor.frequency) + ' Hz'],
              ['Corriente estimada', fmt(motor.current) + ' A'],
              ['Conexión', motor.mode],
              [
                'Sentido',
                motor.direction === 1
                  ? 'Directo'
                  : motor.direction === -1
                    ? 'Inverso'
                    : 'Sin campo',
              ],
            ]}
          />
        )}
        <div className="chips">
          {Object.entries(sim.coils).map(([id, on]) => (
            <span key={id}>
              {c.parts.find((p) => p.id === id)?.tag} · {on ? 'activo' : 'reposo'}
            </span>
          ))}
          {Object.entries(sim.meters).map(([id, v]) => (
            <span key={id}>
              {c.parts.find((p) => p.id === id)?.tag} · {v}
            </span>
          ))}
          {Object.entries(sim.lamps).map(([id, v]) => (
            <span key={id}>
              {c.parts.find((p) => p.id === id)?.tag} · {v ? 'encendido' : 'apagado'}
            </span>
          ))}
        </div>
        {Object.keys(sim.tripped)
          .filter((k) => sim.tripped[k])
          .map((id) => (
            <button
              key={id}
              onClick={() => {
                inputs.current.reset = [id]
                next(0)
                delete inputs.current.reset
              }}
            >
              Rearmar / reponer {c.parts.find((p) => p.id === id)?.tag}
            </button>
          ))}
        {sim.issues.length > 0 && (
          <div className="notice">
            <strong>Diagnóstico del circuito</strong>
            <ul>
              {sim.issues.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
      <details
        className="panel"
        open={editorOpen}
        onToggle={(e) => showEditor(e.currentTarget.open)}
      >
        <summary>Editor de componentes y conductores</summary>
        <fieldset disabled={running}>
          <div className="fields">
            <label>
              Biblioteca
              <select value={category} onChange={(e) => setCategory(e.target.value as Kind)}>
                {Object.entries(library).map(([k, v]) => (
                  <option value={k} key={k}>
                    {v.category} · {v.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => {
                const p = newPart(
                  category,
                  library[category].glyph + (c.parts.length + 1),
                  35 + (c.parts.length % 4) * 175,
                  35 + Math.floor(c.parts.length / 4) * 125,
                )
                modify({ ...c, parts: [...c.parts, p] })
                select(p.id)
              }}
            >
              Agregar componente
            </button>
          </div>
          <label>
            Componente seleccionado
            <select value={selected} onChange={(e) => select(e.target.value)}>
              <option value="">Seleccionar</option>
              {c.parts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.tag} · {library[p.kind].name}
                </option>
              ))}
            </select>
          </label>
          {item && (
            <div className="editor-props" key={item.id}>
              <p>{library[item.kind].description}</p>
              <div className="fields">
                <label>
                  Referencia
                  <input
                    defaultValue={item.tag}
                    onBlur={(e) => {
                      const tag = e.target.value.trim()
                      if (tag && tag !== item.tag) alterPart(item.id, { tag })
                    }}
                  />
                </label>
                <NumberField
                  label="Posición X"
                  min={0}
                  max={4000}
                  value={item.x}
                  on={(x) => alterPart(item.id, { x })}
                />
                <NumberField
                  label="Posición Y"
                  min={0}
                  max={4000}
                  value={item.y}
                  on={(y) => alterPart(item.id, { y })}
                />
                {item.value !== undefined && (
                  <NumberField
                    label={
                      item.kind === 'drive'
                        ? 'Consigna (Hz)'
                        : item.kind === 'timer'
                          ? 'Retardo (s)'
                          : item.kind.startsWith('motor')
                            ? 'Pares de polos'
                            : 'Tensión nominal (V)'
                    }
                    value={item.value}
                    min={item.kind === 'drive' ? 0 : 1}
                    max={item.kind === 'drive' ? 60 : item.kind.startsWith('motor') ? 8 : 400}
                    on={(value) => alterPart(item.id, { value: Math.round(value) })}
                  />
                )}
                {item.kind.startsWith('aux') && (
                  <label>
                    Bobina asociada
                    <select
                      value={item.link || ''}
                      onChange={(e) => alterPart(item.id, { link: e.target.value })}
                    >
                      <option value="">Elige una bobina</option>
                      {c.parts
                        .filter((p) => ['contactor', 'relay', 'timer'].includes(p.kind))
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.tag}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
              </div>
              <button
                onClick={() => {
                  modify({
                    parts: c.parts.filter((p) => p.id !== item.id),
                    wires: c.wires.filter(
                      (w) => ![w.a, w.b].some((x) => x.startsWith(item.id + '.')),
                    ),
                  })
                  select('')
                }}
              >
                Retirar componente y sus cables
              </button>
            </div>
          )}
          <h3>Conectar dos bornes</h3>
          <div className="fields">
            <label>
              Origen
              <select value={startPin} onChange={(e) => setStart(e.target.value)}>
                <option value="">Elegir borne</option>
                {pinOptions}
              </select>
            </label>
            <label>
              Destino
              <select value={endPin} onChange={(e) => setEnd(e.target.value)}>
                <option value="">Elegir borne</option>
                {pinOptions}
              </select>
            </label>
            <label>
              Tipo de cable
              <select value={layer} onChange={(e) => setLayer(e.target.value as typeof layer)}>
                <option>mando</option>
                <option>fuerza</option>
              </select>
            </label>
            <button onClick={() => connect(startPin, endPin)}>Conectar</button>
          </div>
          <label>
            Editar cable
            <select value={wire} onChange={(e) => selWire(e.target.value)}>
              <option value="">Elegir conexión</option>
              {c.wires.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.a.replace(/^[^.]+/, (v) => c.parts.find((p) => p.id === v)?.tag || v)} →{' '}
                  {w.b.replace(/^[^.]+/, (v) => c.parts.find((p) => p.id === v)?.tag || v)}
                </option>
              ))}
            </select>
          </label>
          {w && (
            <div className="fields">
              <NumberField
                label="Posición horizontal del codo"
                value={w.bend ?? 200}
                on={(bend) =>
                  modify({ ...c, wires: c.wires.map((v) => (v.id === w.id ? { ...v, bend } : v)) })
                }
              />
              <button
                onClick={() =>
                  modify({
                    ...c,
                    wires: c.wires.map((v) =>
                      v.id === w.id ? { ...v, layer: v.layer === 'mando' ? 'fuerza' : 'mando' } : v,
                    ),
                  })
                }
              >
                Cambiar capa del cable
              </button>
              <button
                onClick={() => {
                  modify({ ...c, wires: c.wires.filter((v) => v.id !== w.id) })
                  selWire('')
                }}
              >
                Eliminar conexión
              </button>
            </div>
          )}
        </fieldset>
      </details>
      <section className="panel">
        <h2>Ensayo de la práctica</h2>
        <p>{lesson[4]}</p>
        <p>
          Usa las referencias de la guía (por ejemplo KM1, S0 y S1). El ensayo opera una copia de tu
          circuito desde reposo.
        </p>
        <button
          onClick={() => {
            const results = benchTest(c, kind)
            setChecks(results)
            void change(
              'boardResult:' + kind,
              {},
              { date: new Date().toISOString(), checks: results },
            )
          }}
        >
          Evaluar circuito
        </button>
        {checks && (
          <ul className="checklist">
            {checks.map((q) => (
              <li key={q.label}>
                {q.ok ? '✓ Cumple' : '× Revisar'} · {q.label}
              </li>
            ))}
          </ul>
        )}
        <p>
          <a href={'#/trabajo/' + kind}>Registrar evidencia e informe →</a>
        </p>
      </section>
      <details className="panel">
        <summary>Proyecto, exportación y lista de bornes</summary>
        <label>
          Nombre del proyecto
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
        </label>
        <div className="inline">
          <button
            onClick={() => {
              void put({ ...proj, name: projectName.trim() || lesson[1] })
              say('Proyecto guardado.')
            }}
          >
            <Save size={16} /> Guardar proyecto
          </button>
          <button onClick={() => copy(c, projectName + ' · copia')}>Guardar una copia</button>
          <button
            onClick={() =>
              download('tablero.json', JSON.stringify({ ...proj, name: projectName }, null, 2))
            }
          >
            <Download size={16} /> Exportar JSON
          </button>
          <label className="file-label">
            Importar proyecto
            <input
              type="file"
              accept=".json"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (!f) return
                try {
                  const v = JSON.parse(await f.text())
                  if (!validateCircuit(v.circuit)) throw Error()
                  await copy(
                    v.circuit,
                    String(v.name || 'Importado'),
                    practices.some((p) => p[0] === v.practice) ? v.practice : kind,
                  )
                } catch {
                  say('Proyecto inválido. Comprueba el formato y los bornes.')
                }
              }}
            />
          </label>
        </div>
        <WireTable c={c} />
      </details>
      <p role="status">{msg}</p>
      <Note>
        Modelo educativo de fuentes ideales, conmutación discreta y deslizamiento fijo del 4 %. Las
        rpm incluyen inercia de primer orden. Las protecciones usan umbrales didácticos.{' '}
        <a href="#/modelo">Modelo, supuestos y límites</a>.
      </Note>
    </>
  )
}
