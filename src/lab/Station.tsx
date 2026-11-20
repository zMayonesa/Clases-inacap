import { useEffect, useState } from 'react'
import {
  freshStation,
  stationCircuit,
  stationReading,
  stationStep,
  type StationInputs,
} from '../core/station'
import { fmt } from '../core/calculations'
import { change } from '../core/storage'
import { emptyWork } from '../core/grading'
import { Flow, Range, Readings } from '../ui/common'
import { Schematic, WireTable } from '../board/Schematic'
const drawing = stationCircuit()
export function Station() {
  const [s, S] = useState(freshStation),
    [run, R] = useState(false),
    [em, E] = useState(false),
    [over, O] = useState(false),
    [drain, D] = useState(2),
    [link, L] = useState(true),
    [msg, M] = useState('')
  const input: StationInputs = { enable: false, emergency: em, overload: over, drain }
  function advance(steps: number) {
    S((v) => {
      let next = v
      for (let i = 0; i < steps; i++) next = stationStep(next, input)
      return next
    })
  }
  useEffect(() => {
    if (!run) return
    const timer = setInterval(() => advance(5), 250)
    return () => clearInterval(timer)
  }, [run, em, over, drain])
  const { word, hmi, current } = stationReading(s, link),
    motor = s.sim.motors.m
  async function record() {
    const line =
      't=' +
      fmt(s.sim.time, 1) +
      ' s · nivel ' +
      fmt(s.level, 2) +
      ' L · LT ' +
      fmt(current, 3) +
      ' mA · registro ' +
      word +
      ' · HMI ' +
      hmi +
      ' · KM1 ' +
      (s.sim.coils.km ? 'activo' : 'abierto') +
      ' · eje ' +
      fmt(motor?.speed || 0, 0) +
      ' rpm · FR ' +
      (s.sim.tripped.fr ? 'disparado' : 'normal')
    await change('work:proyecto-5', emptyWork, (w) => ({
      ...w,
      state: 'En curso',
      updated: new Date().toISOString(),
      fields: { ...w.fields, results: [w.fields.results, line].filter(Boolean).join('\n') },
    }))
    M('Observación agregada a los resultados de la etapa final.')
  }
  return (
    <section className="panel">
      <h2>Ensayo integrado de la estación</h2>
      <p>
        Habilita el mando y avanza el reloj. El nivel gobierna el contactor entre 30 y 70 L. El
        caudal de entrada varía con la velocidad del eje, hasta 5 L/s a 1440 rpm. El transmisor y la
        HMI muestran la misma variable con escalas distintas.
      </p>
      <Flow
        steps={['LT-101 → LIC-101', 'KA1 y protección → KM1 → M1', 'Bomba → nivel del estanque']}
        label="Lazo cerrado de la estación"
      />
      <div className="inline">
        <button onClick={() => S((v) => stationStep(v, { ...input, enable: true }, 0))}>
          Habilitar estación
        </button>
        <button onClick={() => R(!run)}>{run ? 'Pausar reloj' : 'Ejecutar ciclo'}</button>
        <button disabled={run} onClick={() => advance(10)}>
          Avanzar estación 1 s
        </button>
        <button
          onClick={() => {
            E(!em)
            S((v) => stationStep(v, { ...input, emergency: !em }, 0))
          }}
          aria-pressed={em}
        >
          Emergencia {em ? 'activa' : 'liberada'}
        </button>
        <button onClick={() => S((v) => stationStep(v, { ...input, reset: true }, 0))}>
          Rearmar térmico
        </button>
      </div>
      <div className="fields">
        <Range
          label="Consumo de proceso"
          min={0}
          max={8}
          step={0.5}
          value={drain}
          on={D}
          unit="L/s"
        />
        <label>
          <input type="checkbox" checked={over} onChange={(e) => O(e.target.checked)} /> Sobrecarga
          del motor
        </label>
        <label>
          <input type="checkbox" checked={link} onChange={(e) => L(e.target.checked)} /> Enlace HMI
        </label>
      </div>
      <Readings
        items={[
          ['Tiempo', fmt(s.sim.time, 1) + ' s'],
          ['Nivel real', fmt(s.level, 2) + ' L'],
          ['Transmisor', fmt(current, 3) + ' mA'],
          ['Registro 0', String(word)],
          ['Pantalla HMI', hmi],
          ['Motor', fmt(motor?.speed || 0, 0) + ' rpm'],
          ['Contactor KM1', s.sim.coils.km ? 'Activo' : 'Abierto'],
          ['Permiso KA1', s.sim.coils.ka ? 'Retenido' : 'En reposo'],
          ['Protección FR', s.sim.tripped.fr ? 'Disparado' : 'Normal'],
        ]}
      />
      <div className="inline">
        <button onClick={record}>Registrar observación en el informe final</button>
        <button
          onClick={() => {
            R(false)
            E(false)
            O(false)
            L(true)
            D(2)
            S(freshStation())
          }}
        >
          Reiniciar ensayo
        </button>
      </div>
      <p role="status">{msg}</p>
      <details>
        <summary>Esquema de mando y fuerza de la estación</summary>
        <Schematic c={drawing} s={s.sim} mini />
        <WireTable c={drawing} />
      </details>
    </section>
  )
}
