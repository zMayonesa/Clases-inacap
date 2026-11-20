import { useEffect, useState } from 'react'
import { Flow, NumberField as Field, Range, Readings } from '../ui/common'
import {
  budget,
  fmt,
  network,
  ohm,
  pwm,
  rc,
  scale,
  subnet,
  ipString,
  tank,
  type Row,
} from '../core/calculations'
import { download, useRecord } from '../ui/hooks'
import { SerialBench, CycleBench, DecisionBench } from './ProcessBenches'
import { GeoLab } from './Geo'
export function ElectronicsBench({ kind }: { kind: string }) {
  const [v, V] = useState(kind === 'rc' ? 5 : 12),
    [r, R] = useState(kind === 'rc' ? 10000 : kind === 'divider' ? 100 : 600),
    [r2, R2] = useState(200),
    [top, T] = useState(kind === 'divider' ? 'series' : 'one'),
    [c, C] = useState(100),
    [t, Time] = useState(1),
    [d, D] = useState(25),
    [hz, H] = useState(100),
    [base, B] = useState(5),
    [rb, Rb] = useState(1000),
    [load, L] = useState(100)
  const circuit = ohm(v, r, r2, top),
    cap = rc(v, r, c, t),
    pulse = pwm(v, hz, d)
  let items: [string, string][] = []
  let curve: number[] | undefined
  let desc = ''
  if (kind === 'rc') {
    items = [
      ['Constante τ', fmt(cap.tau, 4) + ' s'],
      ['Tensión en C', fmt(cap.voltage, 3) + ' V'],
      ['Corriente en R', fmt(((v - cap.voltage) / r) * 1000, 3) + ' mA'],
    ]
    curve = Array.from({ length: 101 }, (_, i) => rc(v, r, c, (cap.tau * i) / 20).voltage)
    desc = 'Carga desde 0 hasta 5τ; altura entre 0 y ' + v + ' V'
  } else if (kind === 'pwm') {
    items = [
      ['Tensión media', fmt(pulse.mean) + ' V'],
      ['Valor eficaz', fmt(pulse.rms) + ' V'],
      ['Tiempo alto', fmt(pulse.on) + ' ms'],
      ['Período', fmt(pulse.period) + ' ms'],
    ]
    curve = Array.from({ length: 201 }, (_, i) => (i % 50 < d / 2 ? v : 0))
    desc = 'Cuatro períodos; nivel alto ' + v + ' V y ciclo útil ' + d + ' %'
  } else if (kind === 'transistor') {
    const ib = Math.max(0, (base - 0.7) / rb),
      limit = Math.max(0, (v - 0.2) / load),
      ic = Math.min(100 * ib, limit)
    items = [
      ['Corriente de base', fmt(1000 * ib, 3) + ' mA'],
      ['Corriente de carga', fmt(1000 * ic) + ' mA'],
      ['Estado', ib === 0 ? 'Corte' : 100 * ib >= limit ? 'Saturación' : 'Región activa'],
      ['Caída en carga', fmt(ic * load) + ' V'],
    ]
  } else if (circuit) {
    items = [
      ['Resistencia equivalente', fmt(circuit.req) + ' Ω'],
      ['Corriente de fuente', fmt(circuit.current * 1000) + ' mA'],
      ['Caída R₁', fmt(circuit.v1) + ' V'],
      ['Corriente R₁', fmt(circuit.i1 * 1000) + ' mA'],
      ...(top !== 'one'
        ? ([
            ['Caída R₂', fmt(circuit.v2) + ' V'],
            ['Corriente R₂', fmt(circuit.i2 * 1000) + ' mA'],
          ] as [string, string][])
        : []),
      ['Potencia total', fmt(circuit.p, 3) + ' W'],
    ]
  }
  return (
    <section className="panel">
      <h3>Banco de electrónica</h3>
      <Flow
        steps={
          kind === 'rc'
            ? ['Fuente continua', 'Resistencia R', 'Condensador a retorno']
            : kind === 'transistor'
              ? ['Control → R de base', 'NPN · β ideal = 100', 'Carga resistiva a +V']
              : kind === 'pwm'
                ? ['Reloj de período T', 'Salida alta durante D × T', 'Carga resistiva']
                : [
                    'Fuente continua',
                    top === 'one' ? 'R₁' : top === 'series' ? 'R₁ → R₂' : 'R₁ ∥ R₂',
                    'Retorno de la fuente',
                  ]
        }
      />
      <div className="fields">
        <Field label="Fuente (V)" value={v} on={V} min={0.1} max={100} step={0.1} />
        {['ohm', 'divider', 'rc'].includes(kind) && (
          <Field label="Resistencia R₁ (Ω)" value={r} on={R} min={1} max={1e7} />
        )}
        {['ohm', 'divider'].includes(kind) && (
          <>
            <label>
              Topología
              <select value={top} onChange={(e) => T(e.target.value)}>
                <option value="one">Una resistencia</option>
                <option value="series">Serie</option>
                <option value="parallel">Paralelo</option>
              </select>
            </label>
            {top !== 'one' && (
              <Field label="Resistencia R₂ (Ω)" value={r2} on={R2} min={1} max={1e7} />
            )}
          </>
        )}
        {kind === 'rc' && (
          <>
            <Field label="Capacitancia (µF)" value={c} on={C} min={0.01} max={1e6} step={0.1} />
            <Field
              label="Tiempo transcurrido (s)"
              value={t}
              on={Time}
              min={0}
              max={1e6}
              step={0.1}
            />
          </>
        )}
        {kind === 'pwm' && (
          <>
            <Field label="Frecuencia (Hz)" value={hz} on={H} min={1} max={10000} />
            <Range label="Ciclo útil" value={d} on={D} min={0} max={100} unit="%" />
          </>
        )}
        {kind === 'transistor' && (
          <>
            <Field label="Control (V)" value={base} on={B} min={0} max={12} step={0.1} />
            <Field label="Resistencia base (Ω)" value={rb} on={Rb} min={1} />
            <Field label="Carga (Ω)" value={load} on={L} min={1} />
          </>
        )}
      </div>
      {curve && <Trace values={curve} max={v} label={desc} />}
      <Readings items={items} />
    </section>
  )
}
function Trace({ values, max, label }: { values: number[]; max: number; label: string }) {
  const pts = values
    .map(
      (v, i) =>
        (10 + (380 * i) / Math.max(1, values.length - 1)).toFixed(1) +
        ',' +
        (96 - (82 * v) / (max || 1)).toFixed(1),
    )
    .join(' ')
  return (
    <figure className="trace">
      <svg viewBox="0 0 400 108" role="img" aria-label={label}>
        <path d="M10 5V96H392" className="axis" />
        <path d="M10 55H390 M105 8V96 M200 8V96 M295 8V96" className="gridline" />
        <polyline points={pts} className="curve" />
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  )
}
export function InstrumentBench({ kind }: { kind: string }) {
  const [lo, Lo] = useState(0),
    [hi, Hi] = useState(10),
    [raw, Raw] = useState(12),
    [unit, Unit] = useState('mA'),
    [gain, G] = useState(1),
    [bias, B] = useState(1),
    [height, H] = useState(2),
    [rho, R] = useState(1000)
  if (kind === 'pressure') {
    const p = rho * 9.81 * height
    return (
      <section className="panel">
        <h3>Columna hidrostática</h3>
        <Range label="Altura" value={height} on={H} min={0} max={12} step={0.1} unit="m" />
        <Field label="Densidad (kg/m³)" min={1} max={20000} value={rho} on={R} />
        <Readings
          items={[
            ['Presión relativa', fmt(p) + ' Pa'],
            ['Equivalencia', fmt(p / 1e5, 4) + ' bar'],
          ]}
        />
        <p>Tanque abierto, densidad uniforme y g = 9,81 m/s².</p>
      </section>
    )
  }
  if (kind === 'cal') {
    return (
      <section className="panel">
        <h3>Banco de calibración</h3>
        <div className="fields">
          <Field
            label="Ganancia del instrumento"
            value={gain}
            on={G}
            min={0.01}
            max={4}
            step={0.01}
          />
          <Field label="Sesgo (°C)" value={bias} on={B} min={-50} max={50} step={0.1} />
        </div>
        <p>
          Rango 0–100 °C. Tolerancia de esta práctica ±1 °C. Indicación = ganancia × patrón + sesgo.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {['Patrón (°C)', 'Lectura (°C)', 'Error (°C)', 'Resultado'].map((k) => (
                  <th key={k}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[0, 25, 50, 75, 100].map((v) => {
                const read = v * gain + bias
                return (
                  <tr key={v}>
                    <td>{v}</td>
                    <td>{fmt(read)}</td>
                    <td>{fmt(read - v)}</td>
                    <td>{Math.abs(read - v) <= 1 ? 'Dentro' : 'Fuera'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    )
  }
  const n = scale(raw, unit === 'mA' ? 4 : 0, unit === 'mA' ? 20 : 10, lo, hi),
    ok = raw >= (unit === 'mA' ? 4 : 0) && raw <= (unit === 'mA' ? 20 : 10)
  return (
    <section className="panel">
      <h3>Transmisor lineal</h3>
      <div className="fields">
        <Field label="Mínimo (bar)" value={lo} on={Lo} step={0.1} />
        <Field label="Máximo (bar)" value={hi} on={Hi} step={0.1} />
        <label>
          Señal
          <select
            value={unit}
            onChange={(e) => {
              Unit(e.target.value)
              Raw(e.target.value === 'mA' ? 12 : 5)
            }}
          >
            <option value="mA">4–20 mA</option>
            <option value="V">0–10 V</option>
          </select>
        </label>
      </div>
      <Range
        label="Señal bruta"
        value={raw}
        on={Raw}
        min={0}
        max={unit === 'mA' ? 24 : 12}
        step={0.1}
        unit={unit}
      />
      <Readings
        items={[
          [
            'Presión',
            hi <= lo ? 'Revisa los extremos' : !ok ? 'Fuera de intervalo' : fmt(n) + ' bar',
          ],
          ['Calidad', hi <= lo ? 'Rango inválido' : ok ? 'En escala' : 'Señal anómala'],
          [
            'Fracción del span',
            fmt(scale(raw, unit === 'mA' ? 4 : 0, unit === 'mA' ? 20 : 10, 0, 100)) + ' %',
          ],
        ]}
      />
      <p>PV = mínimo + fracción × (máximo − mínimo).</p>
    </section>
  )
}
export function Tank() {
  const [fill, F] = useState(5),
    [out, O] = useState(2),
    [lo, Lo] = useState(30),
    [hi, Hi] = useState(70),
    [play, P] = useState(false)
  const init = { level: 25, on: true, time: 0, history: [25] }
  const [s, S] = useState(init)
  const tick = () =>
    S((v) => {
      const n = tank(v.level, v.on, fill, out, lo, hi)
      return { ...n, time: v.time + 1, history: [...v.history.slice(-99), n.level] }
    })
  useEffect(() => {
    if (!play || lo >= hi) return
    const i = setInterval(tick, 500)
    return () => clearInterval(i)
  }, [play, fill, out, lo, hi])
  return (
    <section className="panel">
      <h3>Estanque de 100 L</h3>
      <Flow
        steps={['Bomba de entrada → tanque', 'LT-101 mide nivel', 'LIC-101 → orden a la bomba']}
        label="Lazo de nivel · tubería de entrada y realimentación"
      />
      <div className="tank-row">
        <div className="tank" role="img" aria-label={'Tanque con ' + s.level + ' litros'}>
          <i style={{ height: s.level + '%' }} />
          <b>{fmt(s.level)} L</b>
        </div>
        <div>
          <strong>{s.on ? 'Bomba encendida' : 'Bomba detenida'}</strong>
          <p>Tiempo de proceso {s.time} s</p>
          <p>Salida constante {out} L/s · Capacidad 100 L</p>
        </div>
      </div>
      <div className="fields">
        <Field label="Entrada (L/s)" value={fill} on={F} min={0} max={100} />
        <Field label="Salida (L/s)" value={out} on={O} min={0} max={100} />
        <Field label="Umbral bajo (L)" value={lo} on={Lo} min={0} max={99} />
        <Field label="Umbral alto (L)" value={hi} on={Hi} min={1} max={100} />
      </div>
      {lo >= hi && <p role="alert">El umbral alto debe superar al bajo.</p>}
      <div className="inline">
        <button disabled={lo >= hi} onClick={() => P(!play)}>
          {play ? 'Pausar' : 'Ejecutar tanque'}
        </button>
        <button disabled={play || lo >= hi} onClick={tick}>
          Avanzar 1 s
        </button>
        <button
          onClick={() => {
            P(false)
            S(init)
          }}
        >
          Volver a 25 L
        </button>
      </div>
      <Trace
        values={s.history}
        max={100}
        label="Historial de nivel en litros, una muestra por segundo simulado."
      />
    </section>
  )
}
export function NetworkBench() {
  const [p, P] = useState('192.168.1.75'),
    [h, H] = useState('192.168.1.105'),
    [mask, M] = useState(26),
    [lp, LP] = useState(true),
    [lh, LH] = useState(true),
    [addr, A] = useState(0),
    [raw, R] = useState(357)
  const sub = subnet(p, mask)
  return (
    <section className="panel">
      <h3>Celda PLC–HMI</h3>
      <Flow
        steps={[
          'PLC · ' + p + (lp ? ' ●' : ' ×'),
          'Switch Ethernet local',
          'HMI · ' + h + (lh ? ' ●' : ' ×'),
        ]}
        label="Estrella de dos estaciones"
      />
      <div className="fields">
        <label>
          IPv4 del PLC
          <input value={p} onChange={(e) => P(e.target.value)} inputMode="decimal" />
        </label>
        <label>
          IPv4 de la HMI
          <input value={h} onChange={(e) => H(e.target.value)} inputMode="decimal" />
        </label>
        <Field label="Prefijo común" value={mask} on={M} min={1} max={30} />
        <Field label="Dirección de registro" value={addr} on={A} min={0} max={65535} />
        <Field label="Registro crudo (uint16)" value={raw} on={R} min={0} max={65535} />
      </div>
      <div className="inline">
        <label>
          <input type="checkbox" checked={lp} onChange={(e) => LP(e.target.checked)} /> Enlace PLC
        </label>
        <label>
          <input type="checkbox" checked={lh} onChange={(e) => LH(e.target.checked)} /> Enlace HMI
        </label>
      </div>
      <Readings
        items={[
          ['Lectura de la HMI', network(p, h, mask, lp, lh, addr, raw)],
          ['Red del PLC', sub ? ipString(sub.base) : 'Inválida'],
          ['Difusión', sub ? ipString(sub.last) : 'Inválida'],
          ['Máscara', sub?.mask || 'Inválida'],
        ]}
      />
      <p>
        Modelo local de una lectura FC03. Dirección 0, una palabra, escala 0,1 L/cuenta. No se envía
        tráfico a equipos de red.
      </p>
    </section>
  )
}
const defRows: Row[] = [
  { label: 'Contactor', qty: 2, price: 18000 },
  { label: 'Hora de diseño', qty: 3, price: 8000 },
]
export function Budget() {
  const [rows, R] = useRecord('budgetRows', defRows),
    [reserve, V] = useRecord('budgetReserve', 10),
    t = budget(rows, reserve)
  const edit = (i: number, patch: Partial<Row>) =>
    R((old) => old.map((r, j) => (i === j ? { ...r, ...patch } : r)))
  function csv() {
    const q = (s: string) => '"' + (/^[=+@-]/.test(s) ? "'" : '') + s.replaceAll('"', '""') + '"'
    const line = (s: (string | number)[]) => s.join(';')
    const lines = [
      line(['Recurso', 'Cantidad', 'Precio CLP', 'Subtotal CLP']),
      ...rows.map((r) => line([q(r.label), r.qty, r.price, r.qty * r.price])),
      line(['Costo base', '', '', t.base]),
      line(['Reserva ' + reserve + ' %', '', '', t.reserve]),
      line(['Total CLP', '', '', t.total]),
    ]
    download('presupuesto.csv', '\uFEFF' + lines.join('\r\n'), 'text/csv;charset=utf-8')
  }
  return (
    <section className="panel">
      <h3>Hoja de presupuesto</h3>
      <p>Valores de práctica en CLP, antes de impuestos. Cada fila se guarda en este navegador.</p>
      {rows.map((r, i) => (
        <div className="budget-row" key={i}>
          <label>
            Recurso {i + 1}
            <input value={r.label} onChange={(e) => void edit(i, { label: e.target.value })} />
          </label>
          <Field label="Cantidad" value={r.qty} min={0} on={(qty) => void edit(i, { qty })} />
          <Field
            label="Precio unitario (CLP)"
            min={0}
            value={r.price}
            on={(price) => void edit(i, { price })}
          />
          <strong>$ {fmt(r.qty * r.price)}</strong>
          <button
            aria-label={'Retirar fila ' + (i + 1)}
            onClick={() => void R((old) => old.filter((_, j) => j !== i))}
          >
            Retirar
          </button>
        </div>
      ))}
      <div className="inline">
        <button
          onClick={() => void R((old) => [...old, { label: 'Nuevo recurso', qty: 1, price: 0 }])}
        >
          Agregar recurso
        </button>
        <button onClick={csv}>Exportar hoja CSV</button>
      </div>
      <Range label="Reserva" min={0} max={100} value={reserve} on={(n) => void V(n)} unit="%" />
      <Readings
        items={[
          ['Costo base', '$ ' + fmt(t.base)],
          ['Reserva', '$ ' + fmt(t.reserve)],
          ['Total', '$ ' + fmt(t.total)],
        ]}
      />
    </section>
  )
}
function AdminBench({ kind }: { kind: string }) {
  const [a, A] = useState(kind === 'kpi' ? 100 : 1),
    [b, B] = useState(kind === 'kpi' ? 8 : 3),
    [c, C] = useState(kind === 'kpi' ? 4 : 5),
    [d, D] = useState(kind === 'kpi' ? 20 : 2),
    [two, T] = useState(true)
  return (
    <section className="panel">
      <h3>{kind === 'kpi' ? 'Productividad del turno' : 'Cronograma del proyecto'}</h3>
      <div className="fields">
        {(kind === 'kpi'
          ? ['Unidades totales', 'Rechazos', 'Horas-persona', 'Objetivo (buenas/h)']
          : ['Preparación (h)', 'Dibujo (h)', 'Simulación (h)', 'Cierre (h)']
        ).map((l, i) => (
          <Field key={l} label={l} min={0} value={[a, b, c, d][i]} on={[A, B, C, D][i]} />
        ))}
      </div>
      {kind === 'kpi' ? (
        <Readings
          items={[
            ['Piezas buenas', b > a ? 'Revisa rechazos' : fmt(a - b)],
            ['Productividad', !c || b > a ? 'Sin valor definido' : fmt((a - b) / c) + ' buenas/h'],
            [
              'Desviación del objetivo',
              !c || b > a ? 'Sin valor definido' : fmt((a - b) / c - d) + ' buenas/h',
            ],
          ]}
        />
      ) : (
        <>
          <label>
            <input type="checkbox" checked={two} onChange={(e) => T(e.target.checked)} /> Dos
            puestos independientes en la etapa intermedia
          </label>
          <Flow
            steps={[
              fmt(a) + ' h de preparación',
              (two ? 'En paralelo: ' : 'En serie: ') + b + ' y ' + c + ' h',
              fmt(d) + ' h de cierre',
            ]}
            label="Dependencias"
          />
          <Readings
            items={[
              ['Plazo', fmt(a + (two ? Math.max(b, c) : b + c) + d) + ' h'],
              ['Holgura de dibujo', fmt(two ? Math.max(0, c - b) : 0) + ' h'],
            ]}
          />
        </>
      )}
    </section>
  )
}
export function Bench({ kind, index = 0 }: { kind: string; index?: number }) {
  if (kind === 'rtu') return <SerialBench />
  if (kind === 'cycle') return <CycleBench />
  if (kind === 'decision') return <DecisionBench />
  if (kind === 'geo') return <GeoLab index={index} />
  if (['ohm', 'divider', 'rc', 'transistor', 'pwm'].includes(kind))
    return <ElectronicsBench kind={kind} />
  if (['loop', 'cal', 'pressure'].includes(kind)) return <InstrumentBench kind={kind} />
  if (kind === 'tank') return <Tank />
  if (kind === 'network') return <NetworkBench />
  if (kind === 'budget') return <Budget />
  return <AdminBench kind={kind} />
}
