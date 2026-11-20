import {openDB,type DBSchema,type IDBPDatabase} from 'idb'
import {validateCircuit} from '../board/components'
import type {Attempt,Work} from './grading'
export type Attachment={id:string;name:string;blob:Blob}
interface AcademyDB extends DBSchema{records:{key:string;value:unknown};files:{key:string;value:Attachment}}
type Table=Record<string,unknown>
export type Backup={format:'academia-ar';version:1;records:Table;files:{id:string;name:string;type:string;base64:string}[]}
let db:IDBPDatabase<AcademyDB>, snapshot:Table={},pending:Promise<unknown>=Promise.resolve()
const subscribers=new Set<()=>void>()
let channel:BroadcastChannel|undefined
export const getSnapshot=()=>snapshot
export const subscribe=(fn:()=>void)=>{subscribers.add(fn);return ()=>{subscribers.delete(fn)}}
const notify=()=>subscribers.forEach(f=>f())
export let failure=''
function enqueue<T>(fn:()=>Promise<T>){const job=pending.then(fn);pending=job.catch((err:Error)=>{failure='No se pudo guardar el cambio. '+err.message;notify()});return job}
async function reload(){const tx=db.transaction('records');const [keys,values]=await Promise.all([tx.store.getAllKeys(),tx.store.getAll()]);snapshot=Object.fromEntries(keys.map((k,i)=>[k,values[i]]));notify()}
export async function boot(legacy?:Pick<Storage,'getItem'>,broadcast=true){
 db=await openDB<AcademyDB>('academia-ar-v2',1,{upgrade(d){d.createObjectStore('records');d.createObjectStore('files')}})
 if(!await db.get('records','migrated')){
  const weeks:number[]=[];let diagnostic:Record<string,boolean>={}
  try{const data=JSON.parse(legacy?.getItem('ar_done')||'{}');if(data&&typeof data==='object')diagnostic=Object.fromEntries(Object.keys(data).filter(k=>/^[0-5]$/.test(k)&&data[k]===true).map(k=>[k,true]));for(let i=0;i<8;i++)if(legacy?.getItem('ar_w'+i)==='1')weeks.push(i+1)}catch{/* El historial previo puede estar incompleto. */}
  const tx=db.transaction('records','readwrite');await tx.store.put({weeks,diagnostic},'legacy');await tx.store.put(true,'migrated');await tx.done
 }
 if(broadcast&&typeof BroadcastChannel!=='undefined'){channel=new BroadcastChannel('academia-ar-storage');channel.onmessage=()=>{void enqueue(reload)}}
 await reload()
}
export function change<T>(key:string,base:T,update:T|((v:T)=>T)){return enqueue(async()=>{
 const tx=db.transaction('records','readwrite');const prior=await tx.store.get(key) as T|undefined
 const next=typeof update==='function'?(update as (v:T)=>T)(prior??base):update
 await tx.store.put(next,key);await tx.done;snapshot={...snapshot,[key]:next};failure='';notify();channel?.postMessage(key)
})}
export async function fileById(id:string){await pending;return db.get('files',id)}
export function attach(key:string,files:File[]){return enqueue(async()=>{
 const tx=db.transaction(['files','records'],'readwrite');const store=tx.objectStore('records')
 const w=(await store.get(key)||{fields:{},files:[],checks:[],state:'Pendiente'}) as Work
 for(const file of files){const id=crypto.randomUUID();await tx.objectStore('files').put({id,name:file.name,blob:file},id);w.files.push(id)}
 if(w.state==='Pendiente')w.state='En curso';w.updated=new Date().toISOString()
 await store.put(w,key);await tx.done;snapshot={...snapshot,[key]:w};notify();channel?.postMessage(key)
})}
export function detach(key:string,id:string){return enqueue(async()=>{
 const tx=db.transaction(['files','records'],'readwrite'),st=tx.objectStore('records'),w=await st.get(key) as Work
 if(w&&w.files.includes(id)){w.files=w.files.filter(x=>x!==id);await st.put(w,key);await tx.objectStore('files').delete(id)}
 await tx.done;await reload();channel?.postMessage(key)
})}
const enc=(bytes:Uint8Array)=>{let content='';for(let i=0;i<bytes.length;i+=16384)content+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(content)}
export async function backup():Promise<Backup>{await pending;const tx=db.transaction(['records','files']);const s=tx.objectStore('records');const [keys,values,files]=await Promise.all([s.getAllKeys(),s.getAll(),tx.objectStore('files').getAll()]);return {format:'academia-ar',version:1,records:Object.fromEntries(keys.map((k,i)=>[k,values[i]])),files:await Promise.all(files.map(async f=>({id:f.id,name:f.name,type:f.blob.type,base64:enc(new Uint8Array(await f.blob.arrayBuffer()))})))}}
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)
const finite=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)
function validRecord(k:string,v:unknown,ids:Set<string>){
 if(k==='migrated')return v===true
 if(k==='legacy')return obj(v)&&Array.isArray(v.weeks)&&v.weeks.every(n=>Number.isInteger(n)&&n>=1&&n<=8)&&obj(v.diagnostic)
 if(k==='theme')return v==='dark'||v==='light'
 if(k==='minutes')return finite(v)&&Number(v)>=30&&Number(v)<=120
 if(k==='startDate')return typeof v==='string'&&/^\d{4}-\d\d-\d\d$/.test(v)&&!isNaN(Date.parse(v))
 if(k==='lastLesson')return typeof v==='string'&&/^#\/clase\/[a-z]+\/\d+$/.test(v)
 if(k.startsWith('board:'))return obj(v)&&typeof v.name==='string'&&typeof v.practice==='string'&&validateCircuit(v.circuit)
 if(k.startsWith('attempt:'))return Array.isArray(v)&&v.every((a:Attempt)=>obj(a)&&typeof a.id==='string'&&typeof a.date==='string'&&typeof a.passed==='boolean'&&Array.isArray(a.items)&&a.items.every(i=>obj(i)&&typeof i.ok==='boolean'&&[i.lesson,i.prompt,i.value,i.explanation].every(f=>typeof f==='string')))
 if(k.startsWith('work:'))return obj(v)&&obj(v.fields)&&Object.values(v.fields).every(x=>typeof x==='string')&&Array.isArray(v.files)&&v.files.every(id=>ids.has(id))&&Array.isArray(v.checks)&&v.checks.every(n=>Number.isInteger(n)&&n>=0&&n<4)&&['Pendiente','En curso','Autoevaluado'].includes(String(v.state))
 if(k.startsWith('review:'))return obj(v)&&typeof v.due==='string'&&!isNaN(Date.parse(v.due))&&Number.isInteger(v.stage)&&Number(v.stage)>=0&&Number(v.stage)<=4
 if(k.startsWith('boardResult:'))return obj(v)&&typeof v.date==='string'&&Array.isArray(v.checks)&&v.checks.every(c=>obj(c)&&typeof c.label==='string'&&typeof c.ok==='boolean')
 if(k==='cadSheet')return obj(v)&&typeof v.title==='string'&&Array.isArray(v.items)&&v.items.every(s=>obj(s)&&['line','rect','coil','no','nc','motor','text','dim'].includes(String(s.kind))&&['x','y','x2','y2'].every(f=>finite(s[f]))&&typeof s.text==='string'&&typeof s.id==='string'&&['Mando','Fuerza','Cotas'].includes(String(s.layer)))
 if(k==='budgetRows')return Array.isArray(v)&&v.every(r=>obj(r)&&typeof r.label==='string'&&finite(r.qty)&&finite(r.price))
 if(k==='budgetReserve')return finite(v)&&Number(v)>=0&&Number(v)<=100
 if(k.startsWith('plan:'))return finite(v)&&Number(v)>=0&&Number(v)<=999
 return false
}
export function restore(data:unknown){return enqueue(async()=>{
 if(!obj(data)||data.format!=='academia-ar'||data.version!==1||!obj(data.records)||!Array.isArray(data.files))throw Error('Formato o versión de respaldo incompatible.')
 const files:Attachment[]=[],ids=new Set<string>()
 for(const f of data.files){if(!obj(f)||typeof f.id!=='string'||typeof f.name!=='string'||typeof f.type!=='string'||typeof f.base64!=='string'||ids.has(f.id))throw Error('Adjunto inválido o repetido.');ids.add(f.id);const bytes=Uint8Array.from(atob(f.base64),c=>c.charCodeAt(0));files.push({id:f.id,name:f.name,blob:new Blob([bytes],{type:f.type})})}
 for(const [k,v] of Object.entries(data.records))if(!validRecord(k,v,ids))throw Error('Registro inválido: '+k)
 const tx=db.transaction(['files','records'],'readwrite'),fstore=tx.objectStore('files'),rstore=tx.objectStore('records')
 await Promise.all([fstore.clear(),rstore.clear()]);for(const f of files)await fstore.put(f,f.id);for(const [k,v] of Object.entries(data.records))await rstore.put(v,k)
 await tx.done;failure='';await reload();channel?.postMessage('import')
})}
export const flushStorage=()=>pending

