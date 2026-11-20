import { initial, step, type Simulation } from '../board/engine'
import { template } from '../board/practices'
import { scale, network } from './calculations'
import type { Part } from '../board/components'

export function stationCircuit() {
  const circuit = template('directo')
  circuit.parts.find((p) => p.id === 'hold')!.link = 'ka'
  for (const wire of circuit.wires) {
    if (wire.a === 'km.A2') wire.a = 'ka.A2'
    if (wire.b === 'km.A1') wire.b = 'ka.A1'
  }
  const parts: Part[] = [
    { id: 'ka', kind: 'relay', tag: 'KA1 permiso', x: 805, y: 180, value: 24 },
    { id: 'ready', kind: 'auxNO', tag: 'KA1 NA', x: 425, y: 325, link: 'ka' },
    { id: 'demand', kind: 'select', tag: 'LIC-101', x: 615, y: 325 },
  ]
  circuit.parts.push(...parts)
  for (const [a, b] of [
    ['fr.96', 'ready.13'],
    ['ready.14', 'demand.13'],
    ['demand.14', 'km.A1'],
    ['km.A2', 'ps.0'],
  ]) {
    circuit.wires.push({ id: 'auto-' + a, a, b, layer: 'mando' })
  }
  return circuit
}
const circuit = stationCircuit()
export type StationState = { level: number; demand: boolean; sim: Simulation }
export const freshStation = (): StationState => ({ level: 25, demand: true, sim: initial() })
export type StationInputs = {
  enable: boolean
  emergency: boolean
  overload: boolean
  drain: number
  reset?: boolean
}
export function stationStep(s: StationState, input: StationInputs, dt = 0.1): StationState {
  const demand = s.level <= 30 ? true : s.level >= 70 ? false : s.demand
  const sim = step(
    circuit,
    s.sim,
    {
      active: { q: true, start: input.enable, em: input.emergency, demand },
      load: input.overload ? 2.2 : 1,
      reset: input.reset ? ['fr'] : [],
    },
    dt,
  )
  const fill = (5 * Math.max(0, sim.motors.m.speed)) / 1440
  const level = Math.min(100, Math.max(0, s.level + (fill - input.drain) * dt))
  return { sim, level, demand }
}
export function stationReading(s: StationState, link: boolean) {
  const current = scale(s.level, 0, 100, 4, 20),
    word = Math.round(scale(current, 4, 20, 0, 100) * 10)
  return { current, word, hmi: network('192.168.1.75', '192.168.1.105', 26, true, link, 0, word) }
}
