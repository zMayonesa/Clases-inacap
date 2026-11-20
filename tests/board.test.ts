import test from 'node:test'
import assert from 'node:assert/strict'
import { benchTest, practices, template } from '../src/board/practices'
import { initial, step, type Inputs } from '../src/board/engine'
import { newPart, validateCircuit, library, type Circuit, type Part } from '../src/board/components'
for (const [id] of practices)
  test('Secuencia de práctica ' + id, () => {
    const c = template(id)
    assert.ok(validateCircuit(c))
    if (id === 'diagnostico') {
      assert.ok(benchTest(c, id).some((x) => !x.ok))
      c.wires.push({ id: 'reparacion', a: 'fr.6', b: 'm.W', layer: 'fuerza' })
    }
    assert.deepEqual(
      benchTest(c, id).filter((x) => !x.ok),
      [],
    )
  })
function rig(c: Circuit) {
  let s = initial()
  const input: Inputs = { active: { q: true }, load: 1 }
  return {
    get state() {
      return s
    },
    input,
    tick(n = 1) {
      for (let i = 0; i < n; i++) s = step(c, s, input, 0.1)
    },
    start() {
      input.active.start = true
      this.tick()
      input.active.start = false
      this.tick()
    },
  }
}
test('Fase ausente y retorno abierto impiden el arranque', () => {
  for (const pin of ['m.U', 'm.V', 'm.W', 'km.A2']) {
    const c = template('directo')
    c.wires = c.wires.filter((w) => w.a !== pin && w.b !== pin)
    const r = rig(c)
    r.start()
    r.tick(50)
    assert.equal(r.state.motors.m.speed, 0)
  }
})
test('Fuerza duplicada en dos bornes no forma campo trifásico', () => {
  const c = template('directo')
  c.wires.find((w) => w.b === 'm.W')!.a = 'fr.4'
  const r = rig(c)
  r.start()
  assert.equal(r.state.motors.m.target, 0)
})
test('Aceleración, giro, variación de Hz en marcha y parada inercial', () => {
  const c = template('variador'),
    r = rig(c)
  r.start()
  assert.ok(r.state.motors.m.speed > 0 && r.state.motors.m.speed < 720)
  r.tick(90)
  assert.equal(r.state.motors.m.speed, 720)
  c.parts.find((x) => x.id === 'vfd')!.value = 50
  r.tick(90)
  assert.equal(r.state.motors.m.speed, 1440)
  r.input.active.em = true
  r.tick()
  assert.equal(r.state.motors.m.target, 0)
  assert.ok(r.state.motors.m.speed > 0)
  r.tick(100)
  assert.equal(r.state.motors.m.speed, 0)
})
test('Sin enclavamientos, el cierre simultáneo genera corto y protección', () => {
  const c = template('inversion')
  c.wires.find((w) => w.a === 'lockA.22' && w.b === 'back.13')!.a = 'fr.96'
  const r = rig(c)
  r.start()
  r.input.active.back = true
  r.tick()
  assert.ok(
    r.state.tripped.q ||
      r.state.issues.some((v) => v.includes('Cortocircuito') || v.includes('inestable')),
  )
  assert.equal(r.state.motors.m.target, 0)
})
test('Temporizador interrumpido borra el tiempo anterior', () => {
  const r = rig(template('tiempo'))
  r.start()
  r.tick(15)
  r.input.active.stop = true
  r.tick()
  assert.equal(r.state.timers.kt, 0)
  r.input.active.stop = false
  r.start()
  r.tick(12)
  assert.equal(r.state.lamps.lamp, false)
  r.tick(20)
  assert.equal(r.state.lamps.lamp, true)
})
test('El térmico detecta únicamente una carga que pasa por sus polos', () => {
  const c = template('termico')
  for (const w of c.wires.filter((w) => w.b.startsWith('m.'))) w.a = w.a.replace('fr.', 'km.')
  const r = rig(c)
  r.start()
  r.input.load = 2.5
  r.tick(130)
  assert.equal(!!r.state.tripped.fr, false)
  assert.ok(r.state.motors.m.target > 0)
})
test('Un térmico con 95–96 puenteado no derriba una bobina mal cableada', () => {
  const c = template('termico')
  c.wires.push({ id: 'puente', a: 'fr.95', b: 'fr.96', layer: 'mando' })
  const r = rig(c)
  r.start()
  r.input.load = 2.3
  r.tick(120)
  assert.equal(r.state.tripped.fr, true)
  assert.equal(r.state.coils.km, true)
  assert.ok(benchTest(c, 'termico').some((x) => !x.ok))
})
test('Voltímetro, amperímetro en serie y borne sin referencia', () => {
  const c = template('directo')
  const add = (p: Part, id: string) => c.parts.push({ ...p, id })
  add(newPart('volt', 'V1', 0, 0), 'v')
  add(newPart('amp', 'A1', 0, 0), 'amp')
  c.wires.find((w) => w.b === 'm.U')!.b = 'amp.IN'
  c.wires.push(
    { id: 'am', a: 'amp.OUT', b: 'm.U', layer: 'fuerza' },
    { id: 'v1', a: 'ps.+', b: 'v.V', layer: 'mando' },
    { id: 'v2', a: 'ps.0', b: 'v.COM', layer: 'mando' },
  )
  const r = rig(c)
  r.start()
  r.tick(90)
  assert.equal(r.state.meters.v, '24.0 V')
  assert.equal(r.state.meters.amp, '4.00 A')
  c.wires.pop()
  r.tick()
  assert.equal(r.state.meters.v, 'Indeterminado')
})
test('Diferen­cial y fusible abren el camino en ensayo y cortocircuito', () => {
  const c: Circuit = { parts: [], wires: [] }
  for (const [kind, id] of [
    ['mono', 'g'],
    ['rcd', 'd'],
    ['fuse', 'fu'],
    ['lamp', 'h'],
  ] as const)
    c.parts.push({ ...newPart(kind, id, 0, 0), id, value: kind === 'lamp' ? 230 : undefined })
  const w = (a: string, b: string) =>
    c.wires.push({ id: String(c.wires.length), a, b, layer: 'mando' })
  w('g.L', 'd.L')
  w('g.N', 'd.N')
  w('d.Ls', 'fu.1')
  w('fu.2', 'h.X1')
  w('d.Ns', 'h.X2')
  const r = rig(c)
  r.tick()
  assert.equal(r.state.lamps.h, true)
  r.input.active.d = true
  r.tick()
  assert.equal(r.state.lamps.h, false)
  r.input.active.d = false
  r.input.reset = ['d']
  r.tick()
  delete r.input.reset
  w('fu.2', 'd.Ns')
  r.tick()
  assert.equal(r.state.tripped.fu, true)
  assert.equal(r.state.lamps.h, false)
})
test('Cableado sin relación entre bobina y auxiliar no consigue retener', () => {
  const c = template('retencion')
  c.parts.find((p) => p.id === 'hold')!.link = 'inexistente'
  assert.ok(benchTest(c, 'retencion').find((x) => x.label.includes('Retención'))?.ok === false)
})
test('Todos los componentes tienen bornes únicos y documentación', () => {
  for (const p of Object.values(library)) {
    assert.ok(p.description.length > 15)
    assert.equal(new Set(p.pins).size, p.pins.length)
  }
  assert.equal(validateCircuit({ parts: [], wires: [{ id: 'w', a: 'x.1', b: 'g.0' }] }), false)
})
