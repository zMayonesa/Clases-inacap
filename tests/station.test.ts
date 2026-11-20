import test from 'node:test'
import assert from 'node:assert/strict'
import { freshStation, stationStep, stationReading, type StationInputs } from '../src/core/station'
import { crc16 } from '../src/core/calculations'
const normal: StationInputs = { enable: false, emergency: false, overload: false, drain: 2 }
test('Estación completa: permiso, llenado, paro alto y rearranque por nivel bajo', () => {
  let s = freshStation()
  s = stationStep(s, { ...normal, enable: true }, 0)
  assert.equal(s.sim.coils.ka, true)
  assert.equal(s.sim.coils.km, true)
  let highStop = false,
    restart = false
  for (let i = 0; i < 600; i++) {
    s = stationStep(s, normal)
    if (!s.sim.coils.km && s.level >= 69) highStop = true
    if (highStop && s.sim.coils.km) {
      restart = true
      break
    }
  }
  assert.ok(highStop)
  assert.ok(restart)
  assert.equal(s.sim.coils.ka, true)
})
test('Disparo térmico elimina el permiso y rearme exige una nueva habilitación', () => {
  let s = stationStep(freshStation(), { ...normal, enable: true }, 0)
  for (let i = 0; i < 60; i++) s = stationStep(s, { ...normal, overload: true })
  assert.equal(s.sim.tripped.fr, true)
  assert.equal(s.sim.coils.ka, false)
  assert.equal(s.sim.coils.km, false)
  s = stationStep(s, { ...normal, reset: true })
  assert.equal(s.sim.coils.ka, false)
  assert.ok(!s.sim.tripped.fr)
})
test('La HMI lee el nivel escalado y detecta pérdida de enlace sin modificar el proceso', () => {
  const s = { ...freshStation(), level: 35.7 }
  assert.equal(stationReading(s, true).word, 357)
  assert.equal(stationReading(s, true).hmi, '35,7 L')
  assert.equal(stationReading(s, false).hmi, 'Sin enlace físico')
  assert.equal(s.level, 35.7)
})
test('CRC Modbus RTU de la lectura de un holding register', () => {
  assert.equal(crc16([1, 3, 0, 0, 0, 1]), 0x0a84)
})
