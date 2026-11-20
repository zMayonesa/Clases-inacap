export type Kind = keyof typeof library
export type Part = {id:string; kind:Kind; tag:string; x:number; y:number; link?:string; value?:number}
export type Wire = {id:string; a:string; b:string; layer:'mando'|'fuerza'; bend?:number}
export type Circuit = {parts:Part[]; wires:Wire[]}
type Definition = {name:string; pins:string[]; category:string; glyph:string; description:string}
function part(name:string,pins:string,category:string,glyph:string,description:string):Definition {
  return {name,pins:pins.split(' '),category,glyph,description}
}
const supply='Alimentación y protección', control='Mando', power='Fuerza', measure='Medición'
export const library={
  dc:part('Fuente de mando 24 V','+ 0',supply,'⎓','Suministra dos potenciales separados de 24 V y 0 V.'),
  mono:part('Red monofásica 230 V','L N',supply,'1~','Fuente ideal para una bobina o piloto ajustado a 230 V.'),
  three:part('Red trifásica 400 V','L1 L2 L3',supply,'3~','Tres fases equilibradas, 400 V entre líneas y 50 Hz.'),
  isolator:part('Interruptor general','1 3 5 2 4 6',supply,'Q','Tres polos accionados juntos. Abierto en reposo.'),
  breaker:part('Termomagnético','1 3 5 2 4 6',supply,'QF','Tres polos. El modelo abre ante un cortocircuito aguas abajo.'),
  fuse:part('Fusible','1 2',supply,'FU','Abre la rama en cortocircuito. Reponer después de corregir la causa.'),
  rcd:part('Diferencial monofásico','L N Ls Ns',supply,'IΔ','Dos polos. El botón de ensayo simula corriente residual y dispara.'),
  terminal:part('Bornera de paso','1 2',supply,'X','Une sus dos bornes de manera permanente.'),
  start:part('Pulsador NA · marcha','13 14',control,'NA','Cierra mientras se pulsa.'),
  stop:part('Pulsador NC · parada','11 12',control,'NC','Abre mientras se pulsa.'),
  emergency:part('Parada de emergencia','11 12',control,'EM','Contacto NC con retención y liberación manual.'),
  select:part('Selector mantenido','13 14',control,'SA','Conserva la posición seleccionada.'),
  limit:part('Final de carrera','11 12 14',control,'SQ','En reposo une 11–12. Al actuar une 11–14.'),
  contactor:part('Contactor tripolar','1 3 5 A1 2 4 6 A2',control,'KM','La bobina acciona tres polos. Ajustar su tensión nominal.'),
  relay:part('Relé auxiliar','A1 A2',control,'KA','Bobina que acciona contactos asociados por referencia.'),
  auxNO:part('Contacto auxiliar NA','13 14',control,'NO','Cierra al energizar su bobina asociada.'),
  auxNC:part('Contacto auxiliar NC','21 22',control,'NC','Abre al energizar su bobina asociada.'),
  timer:part('Temporizador a la conexión','A1 A2',control,'KT','El contacto asociado cambia al cumplirse el retardo en segundos.'),
  thermal:part('Relé térmico','1 3 5 95 2 4 6 96',supply,'FR','Tres vías de fuerza y contacto NC 95–96. El disparo abre el mando.'),
  lamp:part('Lámpara piloto','X1 X2',control,'H','Se ilumina cuando recibe su tensión nominal.'),
  motor:part('Motor trifásico','U V W',power,'M','Tres bornes con devanados conectados internamente.'),
  motor6:part('Motor de seis bornes','U1 V1 W1 U2 V2 W2',power,'M6','Tres devanados independientes para estrella y triángulo.'),
  drive:part('Variador de frecuencia','R S T RUN U V W COM',power,'VFD','Habilitación por contacto seco RUN–COM. Frecuencia consignada en Hz.'),
  volt:part('Voltímetro ideal','V COM',measure,'V','Conectar en paralelo. Una entrada flotante carece de lectura definida.'),
  amp:part('Amperímetro ideal','IN OUT',measure,'A','Insertar en serie con un conductor de fuerza. Modelo para un motor por rama.'),
  continuity:part('Indicador de continuidad','P Q',measure,'Ω','Comprueba si las puntas pertenecen al mismo nodo conductor con las fuentes aisladas.')
}
export function initialValue(kind:Kind){
  if(kind==='timer')return 3
  if(kind==='drive')return 50
  if(kind==='motor'||kind==='motor6')return 2
  if(['contactor','relay','lamp'].includes(kind))return 24
  return undefined
}
export function validPin(c:Circuit, pin:string){const [id,p]=pin.split('.');const item=c.parts.find(x=>x.id===id);return !!item&&library[item.kind].pins.includes(p)&&pin.split('.').length===2}
export function validateCircuit(v:unknown):v is Circuit{
  if(!v||typeof v!=='object')return false
  const c=v as Circuit
  if(!Array.isArray(c.parts)||!Array.isArray(c.wires)||c.parts.length>400||c.wires.length>1800)return false
  const ids=new Set<string>()
  for(const p of c.parts){if(!p||!Object.hasOwn(library,p.kind)||typeof p.tag!=='string'||typeof p.id!=='string'||!/^[-\w]+$/.test(p.id)||ids.has(p.id)||!Number.isFinite(p.x)||!Number.isFinite(p.y)||(p.value!==undefined&&!Number.isFinite(p.value)))return false;ids.add(p.id)}
  const wires=new Set<string>()
  return c.wires.every(w=>{if(!w||typeof w.id!=='string'||wires.has(w.id)||typeof w.a!=='string'||typeof w.b!=='string'||w.a===w.b||!validPin(c,w.a)||!validPin(c,w.b)||!['mando','fuerza'].includes(w.layer)||w.bend!==undefined&&!Number.isFinite(w.bend))return false;wires.add(w.id);return true})
}
export function newPart(kind:Kind,tag:string,x:number,y:number):Part{return {id:crypto.randomUUID(),kind,tag,x,y,value:initialValue(kind)}}

