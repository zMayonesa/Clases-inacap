import { initialValue, type Circuit, type Kind, type Part } from './components'
import { initial, step, type Inputs } from './engine'
export const practices = [
  [
    'pulso',
    'Marcha y parada',
    'Comprueba la diferencia entre pulsar y mantener.',
    'Conecta + a S0 NC, su salida a S1 NA y la salida de S1 a A1 de KA. Cierra el retorno A2 a 0.',
    'Mantén marcha durante un segundo y suéltala. La bobina cae al abrirse S1.',
  ],
  [
    'retencion',
    'Autoalimentación',
    'Usa el estado de una bobina para recordar una orden.',
    'Añade un auxiliar NA de KM1 en paralelo con el pulsador. El paro debe quedar antes de ambas ramas.',
    'Pulsa y suelta marcha. El auxiliar conserva la bobina hasta que pulses paro.',
  ],
  [
    'directo',
    'Arranque directo',
    'Relaciona la continuidad del mando con la presencia de las tres fases.',
    'Alimenta QF desde L1, L2 y L3. Une sus tres salidas a KM1, después a FR y finalmente a U, V y W. Construye la retención.',
    'Con QF cerrado pulsa marcha. Observa el pico de corriente y la aproximación a 1440 rpm.',
  ],
  [
    'mando',
    'Circuitos de mando y fuerza',
    'Explica por qué una bobina activa no garantiza movimiento.',
    'Traza la rama de 24 V por S0, FR 95–96 y S1 hasta A1. Separa los tres conductores que atraviesan los polos del contactor.',
    'Abre QF con KM1 retenido. Hay mando y falta fuerza.',
  ],
  [
    'inversion',
    'Inversión de giro',
    'Cambia la secuencia de fases de un motor.',
    'Alimenta un segundo contactor desde QF. Cruza dos de sus salidas hacia FR. Intercala un auxiliar NC del contactor opuesto en cada bobina.',
    'Detén antes de ordenar retroceso. Compara el signo de las rpm.',
  ],
  [
    'enclavamiento',
    'Enclavamiento cruzado',
    'Prueba la exclusión mutua de dos órdenes.',
    'Cablea la retención de cada contactor después del paro común. Interrumpe cada rama con el NC de la bobina contraria.',
    'Con avance retenido intenta retroceso. KM2 debe permanecer abierto.',
  ],
  [
    'estrella',
    'Estrella–triángulo',
    'Reduce la tensión por devanado al arrancar.',
    'Conecta KM1 a U1, V1 y W1. KMY une U2, V2 y W2. KMD enlaza U2–V1, V2–W1 y W2–U1. Usa contactos opuestos de KT y enclavamiento cruzado.',
    'Parte en estrella, espera el retardo y verifica triángulo. Nunca deben cerrar ambos contactores de conexión.',
  ],
  [
    'tiempo',
    'Temporizadores',
    'Mide el retardo continuo de conexión.',
    'Alimenta KT desde el mando retenido. Ajusta a tres segundos. Usa su NA para encender H1.',
    'El piloto permanece apagado antes de tres segundos. El paro restablece la cuenta.',
  ],
  [
    'piloto',
    'Señalización',
    'Distingue una orden de una confirmación de estado.',
    'Conecta un auxiliar de KM1 en serie con H1 entre + y 0. Mantén independiente la rama de la bobina.',
    'Compara piloto y bobina antes de marcha, después de soltar y tras paro.',
  ],
  [
    'termico',
    'Protección térmica',
    'Observa acumulación de sobrecarga y necesidad de rearme.',
    'Haz pasar las tres fases por FR. Inserta su NC en la alimentación común de la retención.',
    'Arranca, espera el régimen y aumenta la carga al 220 %. Tras el disparo reduce la carga y rearma. Hace falta otra marcha.',
  ],
  [
    'emergencia',
    'Parada de emergencia',
    'Desactiva y comprueba la ausencia de rearranque al liberar.',
    'Cablea el NC de emergencia antes de la retención. Revisa alimentación y retorno de mando.',
    'Con el motor en marcha activa emergencia. Libérala y comprueba que el motor espera una nueva orden.',
  ],
  [
    'variador',
    'Introducción a variadores',
    'Relaciona frecuencia, pares de polos y velocidad.',
    'Alimenta R, S y T del variador desde QF. Une U, V y W al motor. Un contacto seco de KM1 une RUN y COM.',
    'Ajusta 25 Hz y dos pares de polos. Contrasta 750 rpm síncronas con 720 rpm estimadas bajo carga.',
  ],
  [
    'diagnostico',
    'Diagnóstico de fallas',
    'Localiza una fase ausente aun con mando correcto.',
    'Sigue cada fase desde QF hasta M1. En la plantilla de avería falta la conexión entre FR.6 y M1.W. Repárala y prueba también el paro.',
    'Justifica qué observación excluye una falla de bobina. Verifica tres fases distintas en los bornes del motor.',
  ],
] as const
export type PracticeId = (typeof practices)[number][0]
export function template(key: string): Circuit {
  const c: Circuit = { parts: [], wires: [] }
  const add = (id: string, kind: Kind, tag: string, col: number, row: number, link?: string) => {
    const p: Part = { id, kind, tag, x: 45 + col * 190, y: 40 + row * 145 }
    const value = initialValue(kind)
    if (link) p.link = link
    if (value !== undefined) p.value = value
    c.parts.push(p)
    return p
  }
  const wire = (a: string, b: string, layer: 'mando' | 'fuerza' = 'mando') =>
    c.wires.push({ id: 'w' + (c.wires.length + 1), a, b, layer })
  const chain = (...pins: string[]) => {
    for (let i = 0; i < pins.length; i += 2) wire(pins[i], pins[i + 1])
  }
  const power = (a: string, b: string, pa: string[], pb: string[]) =>
    pa.forEach((pin, i) => wire(a + '.' + pin, b + '.' + pb[i], 'fuerza'))
  if (key === 'vacio') return c
  const rev = ['inversion', 'enclavamiento'].includes(key),
    star = key === 'estrella',
    force = !['pulso', 'retencion', 'tiempo', 'piloto'].includes(key),
    vfd = key === 'variador'
  add('ps', 'dc', 'G1', 0, 0)
  add('stop', 'stop', 'S0', 1, 0)
  add('start', 'start', 'S1', 3, 0)
  add('km', key === 'pulso' ? 'relay' : 'contactor', key === 'pulso' ? 'KA' : 'KM1', 4, 0)
  let common = 'stop.12'
  wire('ps.+', 'stop.11')
  if (force) {
    add('em', 'emergency', 'SE', 1, 1)
    add('fr', 'thermal', 'FR', 3, 3)
    chain('stop.12', 'em.11', 'em.12', 'fr.95')
    common = 'fr.96'
  }
  wire('km.A2', 'ps.0')
  if (rev) {
    add('lockB', 'auxNC', 'KM2 NC', 2, 1, 'km2')
    wire(common, 'lockB.21')
    common = 'lockB.22'
  }
  wire(common, 'start.13')
  wire('start.14', 'km.A1')
  if (key !== 'pulso') {
    add('hold', 'auxNO', 'KM1 NA', 3, 1, 'km')
    chain(common, 'hold.13', 'hold.14', 'km.A1')
  }
  if (force) {
    add('red', 'three', 'G2', 0, 3)
    add('q', 'breaker', 'QF', 1, 3)
    add('m', star ? 'motor6' : 'motor', 'M1', 4, 3)
    power('red', 'q', ['L1', 'L2', 'L3'], ['1', '3', '5'])
    if (vfd) {
      add('vfd', 'drive', 'V1', 2, 3).value = 25
      add('enable', 'auxNO', 'KM1 RUN', 3, 2, 'km')
      power('q', 'vfd', ['2', '4', '6'], ['R', 'S', 'T'])
      power('vfd', 'fr', ['U', 'V', 'W'], ['1', '3', '5'])
      chain('vfd.RUN', 'enable.13', 'enable.14', 'vfd.COM')
    } else {
      power('q', 'km', ['2', '4', '6'], ['1', '3', '5'])
      power('km', 'fr', ['2', '4', '6'], ['1', '3', '5'])
    }
    power('fr', 'm', ['2', '4', '6'], star ? ['U1', 'V1', 'W1'] : ['U', 'V', 'W'])
  }
  if (rev) {
    add('km2', 'contactor', 'KM2', 4, 2)
    add('back', 'start', 'S2', 3, 2)
    add('hold2', 'auxNO', 'KM2 NA', 3, 4, 'km2')
    add('lockA', 'auxNC', 'KM1 NC', 2, 2, 'km')
    chain(
      'fr.96',
      'lockA.21',
      'lockA.22',
      'back.13',
      'lockA.22',
      'hold2.13',
      'back.14',
      'km2.A1',
      'hold2.14',
      'km2.A1',
      'km2.A2',
      'ps.0',
    )
    power('q', 'km2', ['2', '4', '6'], ['1', '3', '5'])
    power('km2', 'fr', ['2', '4', '6'], ['3', '1', '5'])
  }
  if (key === 'tiempo' || star) {
    add('kt', 'timer', 'KT', 5, 0)
    chain('km.A1', 'kt.A1', 'kt.A2', 'ps.0')
  }
  if (key === 'tiempo' || key === 'piloto') {
    add(
      'signal',
      'auxNO',
      key === 'tiempo' ? 'KT NA' : 'KM1 señal',
      3,
      2,
      key === 'tiempo' ? 'kt' : 'km',
    )
    add('lamp', 'lamp', 'H1', 4, 2)
    chain('ps.+', 'signal.13', 'signal.14', 'lamp.X1', 'lamp.X2', 'ps.0')
  }
  if (star) {
    add('ky', 'contactor', 'KMY', 5, 3)
    add('kd', 'contactor', 'KMD', 6, 3)
    add('before', 'auxNC', 'KT NC', 5, 1, 'kt')
    add('after', 'auxNO', 'KT NA', 6, 1, 'kt')
    add('lockd', 'auxNC', 'KMD NC', 5, 2, 'kd')
    add('locky', 'auxNC', 'KMY NC', 6, 2, 'ky')
    chain(
      'km.A1',
      'before.21',
      'before.22',
      'lockd.21',
      'lockd.22',
      'ky.A1',
      'ky.A2',
      'ps.0',
      'km.A1',
      'after.13',
      'after.14',
      'locky.21',
      'locky.22',
      'kd.A1',
      'kd.A2',
      'ps.0',
    )
    power('m', 'ky', ['U2', 'V2', 'W2'], ['1', '3', '5'])
    wire('ky.2', 'ky.4', 'fuerza')
    wire('ky.4', 'ky.6', 'fuerza')
    power('m', 'kd', ['U2', 'V2', 'W2'], ['1', '3', '5'])
    power('kd', 'm', ['2', '4', '6'], ['V1', 'W1', 'U1'])
  }
  if (key === 'diagnostico') c.wires = c.wires.filter((w) => w.b !== 'm.W')
  return c
}
export function benchTest(c: Circuit, key: string) {
  // References are resolved by the labels used on the construction sheet, including free-built boards.
  const ref: Record<string, string> = {}
  const standard = template(key)
  standard.parts.forEach((p) => {
    const match = c.parts.find(
      (x) => x.tag.toUpperCase() === p.tag.toUpperCase() && x.kind === p.kind,
    )
    if (match) ref[p.id] = match.id
  })
  const checks: { label: string; ok: boolean }[] = []
  const check = (label: string, value: unknown) => checks.push({ label, ok: !!value })
  const input: Inputs = { active: {}, load: 1 }
  let s = initial()
  const set = (id: string, on: boolean) => {
    if (ref[id]) input.active[ref[id]] = on
  }
  const tick = (n = 1) => {
    for (let i = 0; i < n; i++) s = step(c, s, input, 0.1)
  }
  const coil = (id: string) => !!s.coils[ref[id]],
    motor = () => s.motors[ref.m]
  set('q', true)
  tick()
  check('Reposo sin orden', !!ref.km && !coil('km'))
  set('start', true)
  tick()
  check('La marcha energiza la bobina', coil('km'))
  set('start', false)
  tick()
  if (key === 'pulso') check('La bobina cae al soltar', !coil('km'))
  else check('Retención al soltar marcha', coil('km'))
  if (ref.m || !['pulso', 'retencion', 'tiempo', 'piloto'].includes(key))
    check('Tres fases alimentan el motor', !!motor()?.target)
  if (key === 'mando') {
    set('q', false)
    tick()
    check('Fuerza aislada con mando activo', coil('km') && !motor()?.target)
    set('q', true)
    tick()
  }
  if (key === 'piloto') check('El auxiliar confirma marcha', s.lamps[ref.lamp])
  if (key === 'tiempo') {
    check('Piloto apagado antes del retardo', !s.lamps[ref.lamp])
    tick(35)
    check('Piloto tras el retardo', s.lamps[ref.lamp])
  }
  if (key === 'estrella') {
    check('Arranque en estrella', motor()?.mode === 'Estrella' && !coil('kd'))
    tick(35)
    check('Conmutación a triángulo', motor()?.mode === 'Triángulo' && !coil('ky'))
  }
  if (key === 'inversion' || key === 'enclavamiento') {
    const dir = motor()?.direction
    set('back', true)
    tick()
    check('Retroceso bloqueado en avance', coil('km') && !coil('km2'))
    set('back', false)
    set('stop', true)
    tick()
    set('stop', false)
    set('back', true)
    tick()
    set('back', false)
    tick()
    check(
      'Secuencia invertida tras el paro',
      coil('km2') && !coil('km') && !!dir && motor()?.direction === -dir,
    )
  }
  if (key === 'termico') {
    tick(50)
    input.load = 2.2
    tick(90)
    check('El térmico abre y cae la bobina', s.tripped[ref.fr] && !coil('km') && !motor()?.target)
    input.load = 1
    input.reset = [ref.fr]
    tick()
    delete input.reset
    check('Rearme sin arranque espontáneo', !s.tripped[ref.fr] && !coil('km'))
  }
  if (key === 'emergencia') {
    set('em', true)
    tick()
    check('Emergencia corta el mando', !coil('km'))
    set('em', false)
    tick()
    check('Liberación sin rearranque', !coil('km'))
  }
  if (key === 'variador')
    check(
      'Consigna de 25 Hz y 720 rpm previstos',
      motor()?.frequency === 25 && Math.abs(motor()?.target || 0) === 720,
    )
  if (key === 'pulso') {
    set('start', true)
    tick()
  }
  set('stop', true)
  tick()
  check('El paro abre las bobinas de marcha', !coil('km') && !coil('km2') && !motor()?.target)
  if (key === 'piloto' || key === 'tiempo')
    check('Piloto apagado tras parar', !!ref.lamp && !s.lamps[ref.lamp])
  return checks
}
