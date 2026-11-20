import test from 'node:test'
import assert from 'node:assert/strict'
import { allCourses, courses, extras, lessonId } from '../src/content/catalog'
import { labs, projectStages } from '../src/content/labs'
import { finalQuestions } from '../src/content/finals'
import { software } from '../src/content/software'
import { grade } from '../src/core/grading'
import {
  budget,
  evaluateFunction,
  ipNumber,
  matrix,
  network,
  ohm,
  pwm,
  rc,
  scale,
  subnet,
  tank,
} from '../src/core/calculations'
import { activities, schedule, nextReview, isDone } from '../src/core/plan'
test('Catálogo enlazado con lecciones, laboratorios y rúbricas', () => {
  assert.equal(courses.length, 6)
  assert.equal(extras.length, 2)
  assert.equal(allCourses.flatMap((c) => c.lessons).length, 44)
  assert.equal(labs.length, 47)
  assert.equal(new Set(labs.map((l) => l.id)).size, labs.length)
  for (const l of labs) {
    assert.ok(allCourses.find((c) => c.id === l.course)?.lessons[l.lesson])
    assert.ok(l.steps.length >= 2 && l.criteria.length === 3 && l.evidence.length)
  }
  for (const s of software) assert.ok(labs.some((l) => l.id === s.activity))
  for (const s of projectStages) assert.ok(labs.some((l) => l.id === s[2]))
})
test('Cada clase contiene teoría, figura, ejemplo, transferencia y evaluación', () => {
  for (const c of allCourses) {
    assert.equal(c.units.length * 2, c.lessons.length)
    for (const l of c.lessons) {
      assert.ok(l.theory.length >= 3 && l.theory.join(' ').length >= 520)
      assert.ok(l.diagram.length >= 3 && l.example.length >= 3 && l.guided.length >= 2)
      for (const q of [l.exercise, l.check]) assert.ok(grade(q, String(q.answer)))
      assert.ok(l.review && l.industry)
    }
  }
})
test('Seis exámenes finales con casos distintos a los de clase', () => {
  for (const c of courses) {
    const exam = finalQuestions[c.id]
    assert.equal(exam.length, 6)
    for (const q of exam) {
      assert.ok(grade(q, String(q.answer)))
      assert.ok(!c.lessons.some((l) => [l.exercise.prompt, l.check.prompt].includes(q.prompt)))
    }
  }
})
test('Corrección numérica en español, cero, signo y tolerancia', () => {
  const q = { prompt: '', answer: -2.5, explanation: '', tolerance: 0.01 }
  for (const v of ['-2,5', '-2.50', '-2.49']) assert.ok(grade(q, v))
  for (const v of ['', ' ', '2.5', '-2.48', 'Infinity', '0xf', '-2,5 A'])
    assert.equal(grade(q, v), false)
  assert.equal(grade({ ...q, answer: 0 }, ''), false)
})
test('Ohm, Kirchhoff, constante RC y valores PWM', () => {
  assert.equal(ohm(12, 600)!.current, 0.02)
  assert.equal(ohm(12, 100, 200, 'series')!.v2, 8)
  assert.ok(Math.abs(ohm(12, 100, 200, 'parallel')!.current - 0.18) < 1e-8)
  assert.equal(ohm(1, 0), null)
  assert.equal(rc(5, 10000, 100, 1).tau, 1)
  assert.ok(Math.abs(rc(5, 10000, 100, 1).voltage - 3.1606) < 0.001)
  assert.deepEqual(pwm(12, 100, 25), { mean: 3, rms: 6, on: 2.5, period: 10 })
})
test('4–20 mA, offset, saturación y cero span', () => {
  assert.equal(scale(4, 4, 20, -20, 80), -20)
  assert.equal(scale(12, 4, 20, 0, 10), 5)
  assert.equal(scale(20, 4, 20, -20, 80), 80)
  assert.equal(scale(8, 2, 10, 4, 20), 16)
  assert.ok(Number.isNaN(scale(0, 1, 1, 0, 5)))
})
test('Funciones, matrices, determinantes y singularidad', () => {
  assert.equal(evaluateFunction('line', 2, 2, 3, 0), 7)
  assert.equal(evaluateFunction('quadratic', 2, 1, 2, -1), -1)
  const m = matrix([1, 2, 3, 4], [5, 6, 7, 8])
  assert.deepEqual(m.product, [19, 22, 43, 50])
  assert.deepEqual(m.sum, [6, 8, 10, 12])
  assert.equal(m.det, -2)
  assert.equal(matrix([1, 2, 2, 4], [1, 0, 0, 1]).inverse, null)
})
test('IPv4, registro, límites y topología', () => {
  for (const v of ['', '256.0.0.1', '1.2.3', '-1.0.0.0', '1e1.0.0.0'])
    assert.equal(ipNumber(v), null)
  assert.equal(subnet('192.168.1.127', 26)?.host, false)
  const read = (h: string, a = 0) => network('192.168.1.75', h, 26, true, true, a, 357)
  assert.equal(read('192.168.1.105'), '35,7 L')
  assert.match(read('192.168.1.130'), /Subredes/)
  assert.match(read('192.168.1.75'), /duplicadas/)
  assert.match(read('192.168.1.105', 4), /02/)
})
test('Balance de tanque e histéresis, presupuesto y reserva', () => {
  assert.deepEqual(tank(25, false, 5, 2, 30, 70), { level: 28, on: true })
  assert.deepEqual(tank(69, true, 5, 2, 30, 70), { level: 72, on: false })
  assert.deepEqual(tank(50, false, 5, 2, 30, 70), { level: 48, on: false })
  assert.equal(
    Math.round(
      budget(
        [
          { label: 'C', qty: 2, price: 18000 },
          { label: 'h', qty: 3, price: 8000 },
        ],
        10,
      ).total,
    ),
    66000,
  )
})
test('Plan reprograma días perdidos, limita carga y conserva clases acreditadas', () => {
  const start = '2026-11-20',
    today = '2026-11-26',
    id = lessonId('maquinas', 0),
    d = { ['attempt:' + id]: [{ passed: true }] }
  for (const min of [30, 60, 120]) {
    const plan = schedule(d, min, start, today)
    assert.ok(
      plan.every((day) => day.date >= today && day.entries.reduce((s, e) => s + e.mins, 0) <= min),
    )
    assert.ok(plan.every((day) => day.entries.every((e) => e.a.id !== id)))
    const expected = activities.filter((a) => !isDone(a, d)).reduce((s, a) => s + a.minutes, 0)
    assert.equal(
      plan.flatMap((d) => d.entries).reduce((s, e) => s + e.mins, 0),
      expected,
    )
  }
  assert.deepEqual(nextReview(start, 0, true), { stage: 1, due: '2026-11-23' })
  assert.equal(nextReview(start, 3, false).due, '2026-11-21')
})

test('Ruta esencial abarca el semestre en ocho semanas a 30 min diarios', () => {
  const d = schedule({}, 30, '2026-11-20', '2026-11-20', 'core')
  assert.ok(d.at(-1)!.date <= '2027-01-14')
  assert.equal(
    new Set(
      d
        .flatMap((day) => day.entries)
        .filter((e) => e.a.kind === 'Clase')
        .map((e) => e.a.id),
    ).size,
    36,
  )
})
