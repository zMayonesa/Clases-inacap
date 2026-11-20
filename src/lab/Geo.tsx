import { useEffect, useId, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { geoActivities } from '../content/math'
import { evaluateFunction, fmt, matrix, type Matrix } from '../core/calculations'
import { NumberField, Range, Readings } from '../ui/common'
type API = {
  evalCommand: (s: string) => boolean
  getValue: (s: string) => number
  evalCommandCAS?: (s: string) => string
  remove: () => void
}
type Applet = { inject: (el: string) => void }
declare global {
  interface Window {
    GGBApplet?: new (params: Record<string, unknown>, html5: boolean) => Applet
  }
}
let loader: Promise<void> | undefined
function loadAPI() {
  if (window.GGBApplet) return Promise.resolve()
  if (!loader) {
    loader = new Promise<void>((ok, fail) => {
      const script = document.createElement('script')
      script.src = 'https://www.geogebra.org/apps/deployggb.js'
      script.onload = () => (window.GGBApplet ? ok() : fail(Error('Cargador incompleto')))
      script.onerror = () => {
        script.remove()
        fail(Error('Recurso externo inaccesible'))
      }
      document.head.append(script)
    }).catch((e) => {
      loader = undefined
      throw e
    })
  }
  return loader
}
function GeoEmbed({ index }: { index: number }) {
  const a = geoActivities[index],
    area = useRef<HTMLDivElement>(null),
    api = useRef<API | null>(null),
    id = 'geo' + useId().replace(/[^a-z0-9]/gi, ''),
    [load, start] = useState(0),
    [msg, set] = useState('')
  useEffect(() => {
    if (!load || !area.current) return
    let active = true
    const timeout = setTimeout(() => {
      if (active && !api.current)
        set(
          'La aplicación externa tarda en cargar. Puedes abrirla en otra pestaña o utilizar el explorador local.',
        )
    }, 22000)
    set('Cargando GeoGebra desde su servidor…')
    loadAPI()
      .then(() => {
        if (!active || !area.current) return
        area.current.replaceChildren()
        new window.GGBApplet!(
          {
            id: id + 'api',
            appName: a.app,
            language: 'en',
            width: Math.max(280, Math.min(850, area.current.clientWidth)),
            height: 440,
            showToolBar: true,
            showAlgebraInput: true,
            showMenuBar: true,
            enableShiftDragZoom: true,
            appletOnLoad: (g: API) => {
              if (!active) {
                g.remove()
                return
              }
              api.current = g
              clearTimeout(timeout)
              set('GeoGebra está listo. Puedes escribir las entradas o cargar el ejemplo.')
            },
          },
          true,
        ).inject(id)
      })
      .catch(() => {
        if (active)
          set(
            'No se pudo cargar GeoGebra. Abre el enlace oficial o practica en el explorador local.',
          )
      })
    return () => {
      active = false
      clearTimeout(timeout)
      api.current?.remove()
      api.current = null
    }
  }, [load, index])
  return (
    <section className="panel">
      <h3>Practicar en GeoGebra {a.app === 'classic' ? 'Classic' : 'Gráfica'}</h3>
      <p>
        Entra en la barra «Input» de la vista Álgebra. Escribe una línea por vez y pulsa Enter. El
        applet usa inglés para que los nombres de los comandos coincidan.
      </p>
      <pre>{a.commands.join('\n')}</pre>
      {a.cas && (
        <p>
          En Classic abre Menu → View → CAS e introduce <code>{a.cas}</code>.
        </p>
      )}
      <p>
        <strong>Resultado esperado.</strong> {a.expected}
      </p>
      <div className="inline">
        <button onClick={() => start((n) => n + 1)}>
          {load ? 'Recargar GeoGebra' : 'Cargar GeoGebra'}
        </button>
        {api.current && (
          <button
            onClick={() => {
              try {
                const ok = a.commands.every((cmd) => api.current!.evalCommand(cmd))
                const v = api.current!.getValue(a.probe)
                set(
                  ok && Math.abs(v - a.value) < 1e-7
                    ? 'Ejemplo comprobado por GeoGebra: v = ' + fmt(v) + '.'
                    : 'Revisa Álgebra. Alguna entrada no produjo el valor previsto.',
                )
              } catch {
                set('No fue posible evaluar una entrada en esta vista.')
              }
            }}
          >
            Introducir y comprobar ejemplo
          </button>
        )}
        <a
          className="btn secondary"
          href={'https://www.geogebra.org/' + a.app + '?lang=en'}
          target="_blank"
          rel="noreferrer"
        >
          Abrir herramienta oficial <ExternalLink size={14} />
        </a>
      </div>
      <p role="status">{msg}</p>
      <div ref={area} id={id} className="ggb-host" />
    </section>
  )
}
export function Plot({
  fn,
  second,
  x,
  label,
  domain = 8,
}: {
  fn: (x: number) => number
  second?: (x: number) => number
  x: number
  label: string
  domain?: number
}) {
  const id = 'clip' + useId().replace(/[^a-z0-9]/gi, ''),
    w = 520,
    h = 270,
    factor = 12
  const X = (x: number) => w / 2 + (x * w) / (2 * domain),
    Y = (y: number) => h / 2 - y * factor
  const path = (f: (x: number) => number) =>
    Array.from({ length: w + 1 }, (_, i) => {
      const t = ((i - w / 2) * (2 * domain)) / w
      return (i ? 'L' : 'M') + i + ' ' + Math.max(-2000, Math.min(2000, Y(f(t)))).toFixed(2)
    }).join(' ')
  return (
    <svg viewBox={'0 0 ' + w + ' ' + h} className="plot" role="img" aria-label={label}>
      <title>{label}</title>
      <defs>
        <clipPath id={id}>
          <rect width={w} height={h} />
        </clipPath>
      </defs>
      <g clipPath={'url(#' + id + ')'}>
        {Array.from({ length: 21 }, (_, i) => i - 10).map((n) => (
          <g key={n}>
            <path className="gridline" d={'M' + X(n) + ' 0V270 M0 ' + Y(n) + 'H520'} />
            {n !== 0 && n % 2 === 0 && Math.abs(n) < domain && (
              <text x={X(n) + 3} y={h / 2 + 14}>
                {n}
              </text>
            )}
            {n !== 0 && n % 4 === 0 && (
              <text x={w / 2 + 4} y={Y(n) - 3}>
                {n}
              </text>
            )}
          </g>
        ))}
        <path className="axis" d="M0 135H520 M260 0V270" />
        <text x="506" y="129">
          x
        </text>
        <text x="268" y="16">
          y
        </text>
        <path className="curve" d={path(fn)} />
        {second && <path className="curve alt" d={path(second)} />}
        <circle className="plot-point" cx={X(x)} cy={Y(fn(x))} r="5" />
      </g>
    </svg>
  )
}
export function GeoLab({ index = 0 }: { index?: number }) {
  const [a, A] = useState(index === 1 ? 2 : 1),
    [b, B] = useState(index === 1 ? 3 : index === 2 ? 2 : 1),
    [k, K] = useState(-1),
    [x, X] = useState(2)
  const [m, M] = useState<Matrix>(index === 5 ? [2, 1, 3, 2] : [1, 2, 3, 4]),
    [n, N] = useState<Matrix>([5, 6, 7, 8])
  const calc = matrix(m, n),
    str = (v: number[]) =>
      '[' +
      v
        .slice(0, 2)
        .map((t) => fmt(t))
        .join(', ') +
      '] · [' +
      v
        .slice(2)
        .map((t) => fmt(t))
        .join(', ') +
      ']'
  const f = (t: number) =>
    index === 3 ? 5 - t : evaluateFunction(index === 2 ? 'quadratic' : 'line', t, a, b, k)
  return (
    <>
      <section className="panel">
        <h3>Explorador matemático local</h3>
        {index < 4 ? (
          <>
            <Plot
              fn={f}
              x={x}
              second={index === 3 ? (t) => a * t - b : undefined}
              label={'Gráfica cartesiana. En x = ' + x + ', f(x) = ' + f(x)}
            />
            <div className="fields">
              <Range
                label={index === 2 ? 'Abertura a' : 'Pendiente m'}
                value={a}
                on={A}
                min={-5}
                max={5}
                step={0.5}
              />
              <Range
                label={index === 2 ? 'Vértice h' : index === 3 ? 'b de y = mx − b' : 'Intercepto b'}
                value={b}
                on={B}
                min={-6}
                max={6}
                step={0.5}
              />
              {index === 2 && (
                <Range label="Vértice k" value={k} on={K} min={-6} max={6} step={0.5} />
              )}
              <Range label="Punto de prueba x" value={x} on={X} min={-7} max={7} step={0.5} />
            </div>
            <Readings
              items={
                index === 3
                  ? [
                      ['Rectas', 'y = 5 − x · y = ' + a + 'x − ' + b],
                      [
                        'Cruce',
                        a === -1
                          ? b === -5
                            ? 'Coincidentes'
                            : 'Paralelas'
                          : '(' + fmt((5 + b) / (1 + a)) + '; ' + fmt(5 - (5 + b) / (1 + a)) + ')',
                      ],
                    ]
                  : [
                      [
                        'Función',
                        index === 2
                          ? 'y = ' + a + '(x − ' + b + ')² + ' + k
                          : 'y = ' + a + 'x + ' + b,
                      ],
                      ['Punto', '(' + x + '; ' + fmt(f(x)) + ')'],
                    ]
              }
            />
          </>
        ) : (
          <>
            <div className="fields">
              {[m, n].map((v, j) => (
                <fieldset key={j}>
                  <legend>Matriz {j ? 'B' : 'A'}</legend>
                  <div className="matrix-input">
                    {v.map((v1, i) => (
                      <NumberField
                        key={i}
                        label={(j ? 'B' : 'A') + (Math.floor(i / 2) + 1) + ((i % 2) + 1)}
                        step={0.1}
                        value={v1}
                        on={(z) => {
                          const next = [...v] as Matrix
                          next[i] = z
                          ;(j ? N : M)(next)
                        }}
                      />
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
            <Readings
              items={[
                ['det(A)', fmt(calc.det)],
                ['A + B', str(calc.sum)],
                ['A × B', str(calc.product)],
                ['Inversa de A', calc.inverse ? str(calc.inverse) : 'Matriz singular'],
              ]}
            />
          </>
        )}
      </section>
      <GeoEmbed index={index} />
    </>
  )
}
