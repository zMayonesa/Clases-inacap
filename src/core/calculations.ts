export const fmt = (n: number, d = 2) =>
  Number.isFinite(n) ? n.toLocaleString('es-CL', { maximumFractionDigits: d }) : 'Indefinido'
export function scale(value: number, fromLo: number, fromHi: number, toLo: number, toHi: number) {
  if (fromHi === fromLo || ![value, fromLo, fromHi, toLo, toHi].every(Number.isFinite)) return NaN
  return toLo + ((value - fromLo) * (toHi - toLo)) / (fromHi - fromLo)
}
export function ohm(v: number, r1: number, r2 = 0, mode = 'one') {
  if (r1 <= 0 || (mode !== 'one' && r2 <= 0)) return null
  const req = mode === 'series' ? r1 + r2 : mode === 'parallel' ? (r1 * r2) / (r1 + r2) : r1
  const current = v / req
  const v1 = mode === 'series' ? current * r1 : v
  const v2 = mode === 'series' ? current * r2 : mode === 'parallel' ? v : 0
  return { req, current, v1, v2, i1: v1 / r1, i2: r2 ? v2 / r2 : 0, p: v * current }
}
export function rc(volts: number, ohms: number, microfarads: number, time: number) {
  const tau = (ohms * microfarads) / 1e6
  return { tau, voltage: volts * (1 - Math.exp(-time / tau)) }
}
export function pwm(v: number, hz: number, duty: number) {
  const d = duty / 100
  return { mean: v * d, rms: v * Math.sqrt(d), on: (1000 * d) / hz, period: 1000 / hz }
}
export type Matrix = [number, number, number, number]
export function matrix(a: Matrix, b: Matrix) {
  const [p, q, r, s] = a,
    [u, v, w, x] = b
  const det = p * s - q * r
  return {
    det,
    sum: [p + u, q + v, r + w, s + x],
    product: [p * u + q * w, p * v + q * x, r * u + s * w, r * v + s * x],
    inverse: det ? [s / det, -q / det, -r / det, p / det] : null,
  }
}
export function tank(
  level: number,
  on: boolean,
  fill: number,
  drain: number,
  lo: number,
  hi: number,
  dt = 1,
) {
  if (level <= lo) on = true
  if (level >= hi) on = false
  const next = Math.max(0, Math.min(100, level + dt * ((on ? fill : 0) - drain)))
  return { level: next, on: next <= lo ? true : next >= hi ? false : on }
}
export function ipNumber(s: string) {
  const p = s.trim().split('.')
  if (p.length !== 4 || p.some((v) => !/^\d{1,3}$/.test(v) || Number(v) > 255)) return null
  return p.reduce((a, x) => a * 256 + Number(x), 0)
}
export function ipString(v: number) {
  return [24, 16, 8, 0].map((n) => (v >>> n) & 255).join('.')
}
export function subnet(s: string, prefix: number) {
  const ip = ipNumber(s)
  if (ip === null || !Number.isInteger(prefix) || prefix < 1 || prefix > 30) return null
  const size = 2 ** (32 - prefix),
    base = Math.floor(ip / size) * size
  return {
    ip,
    base,
    last: base + size - 1,
    mask: ipString(2 ** 32 - size),
    host: ip > base && ip < base + size - 1,
  }
}
export function network(
  plc: string,
  hmi: string,
  prefix: number,
  linkP: boolean,
  linkH: boolean,
  address: number,
  raw: number,
) {
  const p = subnet(plc, prefix),
    h = subnet(hmi, prefix)
  if (!linkP || !linkH) return 'Sin enlace físico'
  if (!p || !h) return 'IPv4 o prefijo inválido'
  if (!p.host || !h.host) return 'Dirección reservada de red o difusión'
  if (p.ip === h.ip) return 'Direcciones duplicadas'
  if (p.base !== h.base) return 'Subredes distintas sin router'
  if (address !== 0) return 'Excepción Modbus 02 · dirección no asignada'
  if (!Number.isInteger(raw) || raw < 0 || raw > 65535) return 'Registro fuera del rango de 16 bits'
  return fmt(raw / 10, 1) + ' L'
}
export type Row = { label: string; qty: number; price: number }
export function budget(rows: Row[], reserve: number) {
  const base = rows.reduce((a, r) => a + r.qty * r.price, 0)
  return { base, reserve: (base * reserve) / 100, total: base * (1 + reserve / 100) }
}
export function evaluateFunction(mode: string, x: number, a: number, b: number, k: number) {
  return mode === 'quadratic' ? a * (x - b) ** 2 + k : a * x + b
}

export function crc16(bytes: number[]) {
  let crc = 65535
  for (const b of bytes) {
    crc ^= b
    for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? (crc >>> 1) ^ 0xa001 : crc >>> 1
  }
  return crc
}
