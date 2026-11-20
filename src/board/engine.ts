import {library,type Circuit,type Part} from './components'
export type Inputs = {active:Record<string,boolean>; load:number; reset?:string[]}
export type Motor = {speed:number; target:number; frequency:number; direction:number; current:number; mode:string; state:string}
export type Simulation = {time:number; coils:Record<string,boolean>; timers:Record<string,number>; tripped:Record<string,boolean>; heat:Record<string,number>; motors:Record<string,Motor>; lamps:Record<string,boolean>; meters:Record<string,string>; live:string[]; issues:string[]}
export function initial():Simulation{return {time:0,coils:{},timers:{},tripped:{},heat:{},motors:{},lamps:{},meters:{},live:[],issues:[]}}
class Nodes{
  parents=new Map<string,string>()
  root(k:string):string{let r=k;while(this.parents.has(r))r=this.parents.get(r)!;while(this.parents.has(k)){const n=this.parents.get(k)!;this.parents.set(k,r);k=n}return r}
  join(a:string,b:string){const x=this.root(a),y=this.root(b);if(x!==y)this.parents.set(x,y)}
}
type Signal={bus:string;phase:string;volts:number;hz:number}
type Graph={n:Nodes;sig:Map<string,Signal[]>;shorts:Set<string>}
const pairs=[['1','2'],['3','4'],['5','6']]
function graph(c:Circuit,keys:Inputs,s:Simulation,drive:Set<string>,omit?:string):Graph{
 const n=new Nodes(),sig=new Map<string,Signal[]>(),shorts=new Set<string>()
 for(const w of c.wires)n.join(w.a,w.b)
 for(const p of c.parts){
  if(p.id===omit)continue
  const k=p.kind,down=!!keys.active[p.id], tripped=s.tripped[p.id],linked=!!s.coils[p.link||'']
  const join=(a:string,b:string)=>n.join(p.id+'.'+a,p.id+'.'+b)
  if(k==='terminal'||(k==='fuse'&&!tripped))join('1','2')
  if(k==='amp')join('IN','OUT')
  if((k==='isolator'||k==='breaker')&&down&&!tripped || k==='contactor'&&s.coils[p.id] || k==='thermal')pairs.forEach(([a,b])=>join(a,b))
  if(k==='rcd'&&!tripped){join('L','Ls');join('N','Ns')}
  if(k==='thermal'&&!tripped)join('95','96')
  if((k==='start'||k==='select')&&down||k==='auxNO'&&linked)join('13','14')
  if((k==='stop'||k==='emergency')&&!down)join('11','12')
  if(k==='auxNC'&&!linked&&c.parts.some(x=>x.id===p.link&&['contactor','relay','timer'].includes(x.kind)))join('21','22')
  if(k==='limit')join('11',down?'14':'12')
 }
 const mark=(p:Part,pin:string,phase:string,volts:number,hz:number)=>{const root=n.root(p.id+'.'+pin),arr=sig.get(root)||[];arr.push({bus:p.id,phase,volts,hz});sig.set(root,arr);if(arr.some(x=>x.phase!==phase||x.bus!==p.id))shorts.add(root)}
 for(const p of c.parts){
  if(p.kind==='dc'){mark(p,'+','+',24,0);mark(p,'0','0',0,0)}
  if(p.kind==='mono'){mark(p,'L','L',230,50);mark(p,'N','N',0,50)}
  if(p.kind==='three') ['L1','L2','L3'].forEach((v,i)=>mark(p,v,String(i),400,50))
  if(p.kind==='drive'&&drive.has(p.id)) ['U','V','W'].forEach((v,i)=>mark(p,v,String(i),400*Math.min((p.value??50)/50,1),p.value??50))
 }
 return {n,sig,shorts}
}
function signal(g:Graph,pin:string){const r=g.n.root(pin);return g.shorts.has(r)?undefined:g.sig.get(r)?.[0]}
function voltage(g:Graph,a:string,b:string){if(g.n.root(a)===g.n.root(b))return 0;const x=signal(g,a),y=signal(g,b);if(!x||!y||x.bus!==y.bus)return undefined;return x.phase===y.phase?0:/^[012]$/.test(x.phase)?x.volts:Math.abs(x.volts-y.volts)}
function sequence(g:Graph,p:Part,pins:string[]){
 const all=pins.map(i=>signal(g,p.id+'.'+i)),x=all[0]
 if(!x||!all.every(y=>y&&y.bus===x.bus&&/^[012]$/.test(y.phase))||new Set(all.map(y=>y?.phase)).size!==3)return undefined
 return {dir:(Number(all[1]!.phase)-Number(x.phase)+3)%3===1?1:-1,hz:x.hz}
}
function motorFeed(g:Graph,p:Part){
 if(p.kind==='motor'){const v=sequence(g,p,['U','V','W']);return v&&{...v,mode:'Línea'}}
 const a=['U1','V1','W1'],b=['U2','V2','W2']
 for(const [src,end] of [[a,b],[b,a]]){
  const v=sequence(g,p,src);if(!v)continue
  const roots=end.map(i=>g.n.root(p.id+'.'+i))
  if(new Set(roots).size===1&&!g.sig.has(roots[0]))return {...v,mode:'Estrella'}
  const start=src.map(i=>g.n.root(p.id+'.'+i))
  if([1,2].some(off=>roots.every((r,i)=>r===start[(i+off)%3])))return {...v,mode:'Triángulo'}
 }
}
function powered(g:Graph,p:Part,a='A1',b='A2'){const v=voltage(g,p.id+'.'+a,p.id+'.'+b);const rating=p.kind==='timer'?24:(p.value??24);return v!==undefined&&Math.abs(v-rating)<rating*.1}
export function step(c:Circuit,prev:Simulation,input:Inputs,dt:number):Simulation{
 dt=Math.max(0,Math.min(1,dt));const s:Simulation={...initial(),time:prev.time+dt,tripped:{...prev.tripped},heat:{...prev.heat},coils:{...prev.coils}}
 const notes=new Set<string>()
 for(const id of input.reset||[]){delete s.tripped[id];delete s.heat[id]}
 for(const p of c.parts){if(p.kind==='rcd'&&input.active[p.id])s.tripped[p.id]=true}
 let drives=new Set<string>(),g=graph(c,input,s,drives),settled=false
 for(let round=0;round<32;round++){
  g=graph(c,input,s,drives)
  if(g.shorts.size){
   notes.add('Cortocircuito o fuentes incompatibles en el mismo nodo.')
   let opened=false
   for(const p of c.parts.filter(p=>['breaker','fuse'].includes(p.kind)&&!s.tripped[p.id])){
    const isolated=graph(c,input,s,drives,p.id)
    if(isolated.shorts.size<g.shorts.size){s.tripped[p.id]=true;opened=true;notes.add(p.tag+' abrió la rama en falla.');break}
   }
   if(opened)continue
  }
  const next:Record<string,boolean>={},d=new Set<string>()
  for(const p of c.parts){
   if(['contactor','relay','timer'].includes(p.kind)){
    const feed=powered(g,p)
    if(p.kind==='timer'){s.timers[p.id]=feed?(prev.timers[p.id]||0)+dt:0;next[p.id]=feed&&s.timers[p.id]+1e-8>=(p.value??3)}
    else next[p.id]=feed
   }
   if(p.kind==='drive'&&sequence(g,p,['R','S','T'])&&g.n.root(p.id+'.RUN')===g.n.root(p.id+'.COM')&&(p.value??50)>0)d.add(p.id)
  }
  const same=Object.keys(next).every(k=>!!s.coils[k]===next[k])&&d.size===drives.size&&[...d].every(x=>drives.has(x))
  s.coils=next;drives=d
  if(same){settled=true;break}
 }
 if(!settled){notes.add('Mando inestable. Revise realimentación y enclavamientos.');s.coils={};drives.clear()}
 g=graph(c,input,s,drives)
 for(const p of c.parts){
  if((p.kind==='auxNO'||p.kind==='auxNC')&&!c.parts.some(q=>q.id===p.link&&['contactor','relay','timer'].includes(q.kind)))notes.add(p.tag+' requiere una bobina asociada.')
  if(p.kind==='lamp')s.lamps[p.id]=powered(g,p,'X1','X2')
  if(p.kind==='motor'||p.kind==='motor6'){
   const feed=settled&&!g.shorts.size?motorFeed(g,p):undefined, old=prev.motors[p.id]?.speed||0, hz=feed?.hz||0,dir=feed?.dir||0
   const target=60*hz/Math.max(1,p.value??2)*.96*dir
   let speed=target+(old-target)*Math.exp(-dt/(feed?.mode==='Estrella'?.9:feed?.55:.8))
   if(Math.abs(speed-target)<1)speed=target
   const current=feed?4*input.load*(1+4*Math.min(1,Math.abs(target-old)/Math.max(1,Math.abs(target))))*(feed.mode==='Estrella'?1/3:1):0
   s.motors[p.id]={speed,target,frequency:hz,direction:dir,current,mode:feed?.mode||'Sin alimentación',state:!feed?(Math.abs(speed)>1?'En parada':'Detenido'):(Math.abs(target-speed)>Math.abs(target)*.05?'Arrancando':'En régimen')}
   if(!feed)notes.add(p.tag+' requiere tres fases distintas y devanados conectados.')
  }
 }
 for(const p of c.parts){
  if(p.kind==='thermal'||p.kind==='amp'){
   const isolated=graph(c,input,s,drives,p.id)
   const current=c.parts.filter(m=>(m.kind==='motor'||m.kind==='motor6')&&s.motors[m.id].current>0&&!motorFeed(isolated,m)).reduce((a,m)=>a+s.motors[m.id].current,0)
   if(p.kind==='amp')s.meters[p.id]=current.toFixed(2)+' A'
   else if(!s.tripped[p.id]){
    s.heat[p.id]=Math.max(0,(s.heat[p.id]||0)+dt*(current>5?Math.min(4,(current/4)**2-1):-1))
    if(s.heat[p.id]>=8){s.tripped[p.id]=true;const safe=step(c,{...s,time:s.time},input.reset?{...input,reset:[]}:input,0);safe.issues.push(p.tag+' disparó por sobrecarga acumulada.');return safe}
   }
  }
  if(p.kind==='volt'){const v=voltage(g,p.id+'.V',p.id+'.COM');s.meters[p.id]=v===undefined?'Indeterminado':v.toFixed(1)+' V'}
  if(p.kind==='continuity'){const a=p.id+'.P',b=p.id+'.Q';s.meters[p.id]=signal(g,a)||signal(g,b)?'Aísle las fuentes':g.n.root(a)===g.n.root(b)?'Continuidad':'Abierto'}
  if(s.tripped[p.id])notes.add(p.tag+' está disparado. Corrija la causa y rearme.')
 }
 s.live=c.wires.filter(w=>(signal(g,w.a)?.volts||0)>0).map(w=>w.id);s.issues=[...notes];return s
}

