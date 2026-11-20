import { useState } from 'react'
import { Flow, NumberField, Range, Readings } from '../ui/common'
import { crc16, fmt } from '../core/calculations'
const hex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase()
export function SerialBench() {
  const [client, C] = useState(9600),
    [server, S] = useState(9600),
    [unit, U] = useState(1),
    [serverId, I] = useState(1),
    [p, P] = useState('even'),
    [s, Q] = useState('even'),
    [word, W] = useState(357)
  const req = [unit, 3, 0, 0, 0, 1],
    res = [unit, 3, 2, word >> 8, word & 255],
    frame = (v: number[]) => [...v, crc16(v) & 255, crc16(v) >> 8].map(hex).join(' ')
  const response =
    unit !== serverId
      ? 'Sin respuesta de esa unidad'
      : client !== server || p !== s
        ? 'Parámetros serie incompatibles'
        : frame(res)
  return (
    <section className="panel">
      <h3>Lectura serie Modbus RTU</h3>
      <Flow
        steps={['Cliente · consulta FC03', 'Bus RS-485 simulado', 'Servidor · palabra 0']}
        label="Intercambio local de una trama"
      />
      <div className="fields">
        {[0, 1].map((i) => (
          <fieldset key={i}>
            <legend>{i ? 'Servidor' : 'Cliente'}</legend>
            <label>
              Velocidad {i ? 'del servidor' : 'del cliente'}
              <select
                value={i ? server : client}
                onChange={(e) => (i ? S : C)(Number(e.target.value))}
              >
                {[4800, 9600, 19200, 38400].map((v) => (
                  <option key={v} value={v}>
                    {v} bit/s
                  </option>
                ))}
              </select>
            </label>
            <label>
              Paridad {i ? 'del servidor' : 'del cliente'}
              <select value={i ? s : p} onChange={(e) => (i ? Q : P)(e.target.value)}>
                <option value="even">8E1 · par</option>
                <option value="odd">8O1 · impar</option>
                <option value="none">8N2 · sin paridad</option>
              </select>
            </label>
            <NumberField
              label={i ? 'ID del servidor' : 'Unidad consultada'}
              min={1}
              max={247}
              value={i ? serverId : unit}
              on={(v) => (i ? I : U)(Math.round(v))}
            />
          </fieldset>
        ))}
      </div>
      <NumberField
        label="Valor del registro sin signo"
        min={0}
        max={65535}
        value={word}
        on={(v) => W(Math.round(v))}
      />
      <Readings
        items={[
          ['Solicitud en hexadecimal', frame(req)],
          ['Respuesta en hexadecimal', response],
        ]}
      />
      <p>
        La consulta solicita un registro desde dirección 0. La respuesta válida lleva ID, función,
        cantidad de bytes y valor alto/bajo. El CRC se transmite con su byte bajo primero. Las
        líneas incompatibles se modelan como fallo de intercambio.
      </p>
    </section>
  )
}
export function CycleBench() {
  const [period, P] = useState(4),
    [display, D] = useState(20),
    [start, S] = useState(6),
    [duration, T] = useState(7)
  const until = 100
  const physical = (t: number) => t >= start && t < start + duration
  const atPLC = (t: number) => physical(Math.floor(t / period) * period)
  const hmi = (t: number) => atPLC(Math.floor(t / display) * display)
  const line = (fn: (x: number) => boolean, y: number) => {
    let d = 'M20 ' + y
    for (let t = 0; t <= until; t++) d += 'H' + (20 + 4 * t) + 'V' + (fn(t) ? y - 20 : y)
    return d
  }
  const captured = Array.from({ length: 101 }, (_, t) => t).filter(
    (t) => t % display === 0 && hmi(t),
  )
  return (
    <section className="panel">
      <h3>Muestreo de E/S y refresco HMI</h3>
      <div className="fields">
        <NumberField
          label="Período de E/S (ms)"
          value={period}
          min={1}
          max={50}
          on={(n) => P(Math.round(n))}
        />
        <NumberField
          label="Refresco HMI (ms)"
          value={display}
          min={1}
          max={100}
          on={(n) => D(Math.round(n))}
        />
        <NumberField label="Inicio del pulso (ms)" value={start} min={0} max={90} on={S} />
        <NumberField label="Duración del pulso (ms)" value={duration} min={1} max={50} on={T} />
      </div>
      <svg
        className="plot"
        viewBox="0 0 445 160"
        role="img"
        aria-label="Cronograma de entrada física, imagen de E/S y lectura HMI"
      >
        {[physical, atPLC, hmi].map((f, i) => (
          <g key={i}>
            <text x="20" y={14 + 44 * i}>
              {['Sensor', 'Imagen PLC', 'Pantalla HMI'][i]}
            </text>
            <path className="curve" d={line(f, 40 + 44 * i)} />
          </g>
        ))}
        <text x="20" y="150">
          0 ms
        </text>
        <text x="375" y="150">
          100 ms
        </text>
      </svg>
      <p>
        La HMI detecta el pulso en{' '}
        {captured.length ? captured.join(', ') + ' ms' : 'ninguna lectura del intervalo'}. El modelo
        ideal actualiza primero E/S y después HMI si coinciden en un instante. Representa muestreo,
        no implementa la pila PROFINET.
      </p>
    </section>
  )
}
export function DecisionBench() {
  const [weight, W] = useState(40),
    [ac, A] = useState(5),
    [af, B] = useState(3),
    [bc, C] = useState(3),
    [bf, D] = useState(5)
  const va = (weight * ac + (100 - weight) * af) / 100,
    vb = (weight * bc + (100 - weight) * bf) / 100
  return (
    <section className="panel">
      <h3>Matriz de decisión</h3>
      <Range label="Peso del costo favorable" min={0} max={100} value={weight} on={W} unit="%" />
      <p>
        La cobertura recibe el {100 - weight} %. Escala de 1 (menos favorable) a 5 (más favorable).
      </p>
      <div className="fields">
        {['Costo de A', 'Cobertura de A', 'Costo de B', 'Cobertura de B'].map((s, i) => (
          <NumberField
            key={s}
            label={s}
            value={[ac, af, bc, bf][i]}
            min={1}
            max={5}
            on={[A, B, C, D][i]}
          />
        ))}
      </div>
      <Readings
        items={[
          ['Opción A', fmt(va)],
          ['Opción B', fmt(vb)],
          ['Resultado', va === vb ? 'Empate' : va > vb ? 'A' : 'B'],
        ]}
      />
    </section>
  )
}
