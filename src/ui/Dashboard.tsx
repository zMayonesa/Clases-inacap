import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  FlaskConical,
  BookOpen,
  Layers,
} from 'lucide-react'
import { courses, courseBy, lessonId, lessonRoute } from '../content/catalog'
import { labs } from '../content/labs'
import { dateKey, passed, weekGoals } from '../core/plan'
import { usePlan } from './Planner'
import { CourseCards } from './Study'
import { MotorDrawing } from './MotorDrawing'
import { Icon } from './common'
export function Dashboard() {
  const { data, start, minutes, days } = usePlan(),
    today = dateKey(new Date()),
    week = Math.max(
      1,
      Math.min(8, 1 + Math.floor((Date.parse(today) - Date.parse(start)) / 604800000)),
    )
  const first = courses
    .flatMap((c) => c.lessons.map((l, i) => ({ c, l, i })))
    .find((v) => !passed(data, lessonId(v.c.id, v.i)))!
  const recent = String(data.lastLesson || '').split('/'),
    recentCourse = courseBy(recent[2]),
    recentIndex = Number(recent[3]) - 1
  const next =
    recentCourse &&
    recentCourse.lessons[recentIndex] &&
    !passed(data, lessonId(recentCourse.id, recentIndex))
      ? { c: recentCourse, l: recentCourse.lessons[recentIndex], i: recentIndex }
      : first || { c: courses[0], l: courses[0].lessons[0], i: 0 }
  const count = courses.reduce(
    (a, c) => a + c.lessons.filter((_, i) => passed(data, lessonId(c.id, i))).length,
    0,
  )
  return (
    <>
      <header className="dashboard-heading">
        <div>
          <div className="caldate">
            <CalendarDays size={14} />
            {new Date().toLocaleDateString('es-CL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </div>
          <h1>Panel de estudio</h1>
          <p>Automatización y Robótica · Segundo semestre 2026</p>
        </div>
        <a href="#/plan" className="btn secondary">
          <CalendarDays size={16} /> Mi calendario
        </a>
      </header>
      <div className="dashboard-top">
        <section className="feature">
          <div className="feature-copy">
            <span className="eyebrow">
              <i /> {data.lastLesson ? 'Continuar estudiando' : 'Primera clase'}
            </span>
            <h2>{next.l.title}</h2>
            <p>
              {next.c.short} · Unidad {Math.floor(next.i / 2) + 1}
            </p>
            <a className="btn hero-btn" href={lessonRoute(next.c.id, next.i)}>
              {data.lastLesson ? 'Abrir clase' : 'Comenzar clase'} <ArrowRight size={16} />
            </a>
          </div>
          <div className="drawing-link">
            <MotorDrawing />
            <a href="#/lab/directo">
              Motor trifásico de inducción <ArrowRight size={12} />
            </a>
          </div>
        </section>
        <section className="weekly">
          <div className="section-line">
            <span className="eyebrow">Plan de estudio</span>
            <CalendarDays size={20} />
          </div>
          <h2>
            Semana {String(week).padStart(2, '0')} <small>/ 08</small>
          </h2>
          <div className="week-strip" role="img" aria-label={'Semana ' + week + ' de 8'}>
            {weekGoals.map((_, i) => (
              <i key={i} className={i < week ? 'filled' : ''} />
            ))}
          </div>
          <p>{weekGoals[week - 1]}</p>
          <a href="#/plan">
            <Clock3 size={14} /> {minutes} min diarios <ChevronRight size={16} />
          </a>
        </section>
      </div>
      <div className="section-line section-title">
        <h2>Mis asignaturas</h2>
        <a href="#/asignaturas">
          Ver cursos <ArrowRight size={15} />
        </a>
      </div>
      <CourseCards />
      <div className="section-line section-title">
        <h2>Laboratorio virtual</h2>
        <a href="#/laboratorios">
          Ver {labs.length} prácticas <ArrowRight size={15} />
        </a>
      </div>
      <div className="quick-grid">
        {[
          ['board', 'Tablero eléctrico', 'Construir y probar un circuito', '#/tablero/directo'],
          ['matematicas', 'GeoGebra', 'Explorar funciones y matrices', '#/lab/geo-2'],
          ['autocad', 'Editor de diagramas', 'Dibujar y exportar un plano', '#/dibujo'],
        ].map(([icon, title, detail, href]) => (
          <a className="panel quick" key={href} href={href}>
            <Icon name={icon} />
            <span>
              <b>{title}</b>
              <small>{detail}</small>
            </span>
            <ArrowRight size={16} />
          </a>
        ))}
      </div>
      <div className="dashboard-bottom">
        <section className="panel">
          <div className="section-line">
            <h2>Próxima sesión</h2>
            <a href="#/plan">Calendario →</a>
          </div>
          {days[0]?.entries.slice(0, 3).map(({ a, mins }) => (
            <a href={a.link} className="lesson-row" key={a.id}>
              <Layers size={19} />
              <span>
                <b>{a.title}</b>
                <small>
                  {a.kind} · {mins} min
                </small>
              </span>
              <ChevronRight size={16} />
            </a>
          )) || <p>Ruta de estudio acreditada.</p>}
        </section>
        <section className="panel">
          <h2>Mi avance</h2>
          <p>
            <BookOpen size={18} /> {count} de 36 clases troncales acreditadas
          </p>
          <progress value={count} max={36} aria-label="Clases acreditadas" />
          <p>
            <FlaskConical size={18} /> {labs.length} prácticas disponibles
          </p>
          <a href="#/progreso">Consultar historial →</a>
        </section>
      </div>
    </>
  )
}
