import {courses,lessonId,lessonRoute} from '../content/catalog'
import {labs,projectStages} from '../content/labs'
import type {Attempt,Work} from './grading'
type Records=Record<string,unknown>
export type Activity={id:string;title:string;link:string;minutes:number;week:number;kind:string}
export const weekGoals=['Diagnosticar y nivelar magnitudes, coordenadas y lectura de circuitos.','Relacionar mandos, funciones y cadenas de medición.','Resolver redes, presupuestar recursos y comprobar componentes.','Aplicar calibración, protecciones y modelos de proceso.','Ensayar inversión, sistemas de ecuaciones y comunicación industrial.','Integrar temporización, matrices, control y documentación.','Diagnosticar fallas, contrastar resultados y cerrar las unidades.','Ensayar el proyecto integrador, repasar y rendir los exámenes de práctica.']
const studyWeeks=[[1,2,3,5,6,7],[1,2,3,4,5,7],[1,2,3,4,5,7],[1,2,3,4,6,7],[1,2,3,4,6,7],[1,2,3,5,6,7]]
export const activities:Activity[]=[{id:'diag',title:'Diagnóstico inicial de las seis asignaturas',link:'#/prueba/diagnostico',minutes:12,week:1,kind:'Diagnóstico'},
 ...courses.map(c=>({id:'foundation-'+c.id,title:'Nivelación · '+c.short,link:'#/base/'+c.id,minutes:5,week:1,kind:'Nivelación'})),
 ...courses.flatMap((c,ci)=>c.lessons.map((l,i)=>({id:lessonId(c.id,i),title:l.title,link:lessonRoute(c.id,i),minutes:20,week:studyWeeks[ci][i],kind:'Clase'}))),
 ...labs.map(l=>{const ci=courses.findIndex(c=>c.id===l.course);return {id:'lab-'+l.id,title:l.title,link:'#/lab/'+l.id,minutes:l.minutes,week:ci<0?Math.min(7,3+l.lesson):studyWeeks[ci][l.lesson],kind:'Laboratorio'}}),
 ...courses.flatMap((c,ci)=>c.units.map((u,i)=>({id:'unit-'+c.id+'-'+i,title:u,link:'#/prueba/unidad/'+c.id+'/'+i,minutes:8,week:studyWeeks[ci][i*2+1],kind:'Evaluación'}))),
 ...projectStages.map((s,i)=>({id:'stage-'+i,title:s[0],link:'#/trabajo/proyecto-'+i,minutes:25,week:[2,4,5,6,7,8][i],kind:'Proyecto'})),
 ...courses.map(c=>({id:'exam-'+c.id,title:'Examen · '+c.short,link:'#/prueba/final/'+c.id,minutes:18,week:8,kind:'Examen'}))
].sort((a,b)=>a.week-b.week)
export const dateKey=(d:Date)=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')
export function shiftDay(day:string,n:number){const d=new Date(day+'T12:00:00');d.setDate(d.getDate()+n);return dateKey(d)}
export function passed(data:Records,key:string){return ((data['attempt:'+key]||[]) as Attempt[]).some(a=>a.passed)}
export function isDone(a:Activity,d:Records){
 if(a.id==='diag')return !!(d['attempt:diagnostico'] as Attempt[])?.length
 if(a.id.startsWith('lab-'))return (d['work:'+a.id.slice(4)] as Work)?.state==='Autoevaluado'
 if(a.id.startsWith('stage-'))return (d['work:proyecto-'+a.id.slice(6)] as Work)?.state==='Autoevaluado'
 if(a.id.startsWith('foundation-'))return !!d['plan:'+a.id]
 return passed(d,a.id)
}
export function schedule(d:Records,minutes:number,start:string,today:string){
 const cap=Math.min(120,Math.max(30,Math.round(minutes)));let cursor=today>start?today:start,used=0
 const days:{date:string;entries:{a:Activity;mins:number;offset:number}[]}[]=[]
 for(const a of activities){
  if(isDone(a,d))continue
  const earliest=shiftDay(start,(a.week-1)*7)
  if(cursor<earliest){cursor=earliest;used=0}
  let offset=Math.min(a.minutes-1,Number(d['plan:'+a.id])||0)
  while(offset<a.minutes){
   let day=days.at(-1);if(day?.date!==cursor){day={date:cursor,entries:[]};days.push(day)}
   const take=Math.min(a.minutes-offset,cap-used);day.entries.push({a,mins:take,offset});offset+=take;used+=take
   if(used>=cap){cursor=shiftDay(cursor,1);used=0}
  }
 }
 return days
}
export function nextReview(day:string,stage:number,remembered:boolean){const next=remembered?Math.min(stage+1,4):0;return {stage:next,due:shiftDay(day,[1,3,7,14,28][next])}}

