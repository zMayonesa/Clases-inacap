import {useRef,useState} from 'react'
import {Head,NumberField} from '../ui/common'
import {useRecord,download} from '../ui/hooks'
type Kind='line'|'rect'|'coil'|'no'|'nc'|'motor'|'text'|'dim'
type Layer='Mando'|'Fuerza'|'Cotas'
type Shape={id:string;kind:Kind;x:number;y:number;x2:number;y2:number;text:string;layer:Layer}
type Sheet={title:string;items:Shape[]}
const names:Record<Kind,string>={line:'Conductor',rect:'Envolvente',coil:'Bobina',no:'Contacto NA',nc:'Contacto NC',motor:'Motor',text:'Texto',dim:'Cota horizontal'}
const layers:Layer[]=['Mando','Fuerza','Cotas']
function Glyph({s}:{s:Shape}){const {x,y,x2,y2,kind,text}=s
 if(kind==='line')return <line x1={x} y1={y} x2={x2} y2={y2}/>
 if(kind==='rect')return <rect x={Math.min(x,x2)} y={Math.min(y,y2)} width={Math.abs(x2-x)} height={Math.abs(y2-y)}/>
 if(kind==='text')return <text x={x} y={y}>{text}</text>
 if(kind==='dim')return <><path d={'M'+x+' '+(y+5)+'v-14 M'+x+' '+y+'H'+x2+' M'+x2+' '+(y+5)+'v-14'}/><text x={(x+x2)/2} y={y-5} textAnchor="middle">{Math.abs(x2-x)} mm</text></>
 return <g transform={'translate('+x+' '+y+')'}><path d="M0 0H10 M36 0H48"/>{kind==='coil'?<rect x="10" y="-9" width="26" height="18"/>:kind==='motor'?<><circle cx="23" cy="0" r="14"/><text x="23" y="5" textAnchor="middle">M</text></>:<><path d={kind==='no'?'M10 0l24 -10':'M10 0h26 M17 6l12 -14'}/><circle cx="35" cy="0" r="2"/></>}<text x="21" y="-17" textAnchor="middle">{text}</text></g>
}
export function CadEditor(){
 const [sheet,put]=useRecord<Sheet>('cadSheet',{title:'Plano de mando',items:[]}),svg=useRef<SVGSVGElement>(null)
 const [kind,K]=useState<Kind>('line'),[layer,L]=useState<Layer>('Mando'),[title,T]=useState('KM1'),[x,X]=useState(40),[y,Y]=useState(100),[x2,X2]=useState(160),[y2,Y2]=useState(100),[pt,P]=useState<{x:number;y:number}|null>(null),[selected,S]=useState(''),[shown,V]=useState<Layer[]>([...layers]),[history,U]=useState<Sheet[]>([]),[msg,M]=useState('')
 const selectedShape=sheet.items.find(s=>s.id===selected)
 function save(s:Sheet){U(h=>[...h.slice(-24),sheet]);void put(s);M('Plano guardado.')}
 function add(ax=x,ay=y,bx=x2,by=y2){if(!shown.includes(layer))V([...shown,layer]);save({...sheet,items:[...sheet.items,{id:crypto.randomUUID(),kind,layer,text:title,x:ax,y:ay,x2:bx,y2:by}]});P(null)}
 function tap(e:React.MouseEvent<SVGSVGElement>){const mat=svg.current?.getScreenCTM();if(!mat)return;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(mat.inverse());const ax=Math.round(p.x/5)*5,ay=Math.round(p.y/5)*5;if(['line','rect','dim'].includes(kind)&&!pt){P({x:ax,y:ay});M('Elige el segundo punto.');return}add(pt?.x??ax,pt?.y??ay,ax,ay)}
 function exportSVG(){if(!svg.current)return;const clone=svg.current.cloneNode(true) as SVGSVGElement;clone.querySelectorAll('[data-ui]').forEach(n=>n.remove());clone.setAttribute('xmlns','http://www.w3.org/2000/svg');clone.setAttribute('width','720mm');clone.setAttribute('height','430mm');download('plano-tablero.svg',new XMLSerializer().serializeToString(clone),'image/svg+xml')}
 return <><Head title="Editor de diagramas" back="#/curso/autocad" where="Dibujo técnico" desc="Dibuja en milímetros, organiza capas y exporta la vista a SVG o PDF."/><section className="panel"><div className="fields"><label>Título del plano<input value={sheet.title} onChange={e=>void put({...sheet,title:e.target.value})}/></label><label>Herramienta<select value={kind} onChange={e=>{K(e.target.value as Kind);P(null)}}>{Object.entries(names).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label><label>Capa activa<select value={layer} onChange={e=>L(e.target.value as Layer)}>{layers.map(l=><option key={l}>{l}</option>)}</select></label><label>Etiqueta del símbolo<input value={title} onChange={e=>T(e.target.value)}/></label></div>
 <p>Toca dos puntos para un conductor, rectángulo o cota. Toca una vez para colocar un símbolo. El origen del editor está arriba a la izquierda y la retícula ajusta a 5 mm.</p><div className="inline">{layers.map(l=><label key={l}><input type="checkbox" checked={shown.includes(l)} onChange={()=>V(v=>v.includes(l)?v.filter(x=>x!==l):[...v,l])}/> {l}</label>)}</div></section>
 <section className="cad-paper print-document"><h2>{sheet.title}</h2><svg ref={svg} viewBox="0 0 720 430" role="img" aria-label={'Plano eléctrico '+sheet.title} onClick={tap}><title>{sheet.title}</title><rect width="720" height="430" fill="white"/><g data-ui="true" fill="#cbd5df">{Array.from({length:36*21},(_,i)=><circle key={i} cx={(i%36)*20} cy={Math.floor(i/36)*20} r=".9"/>)}</g>{sheet.items.filter(s=>shown.includes(s.layer)).map(s=><g key={s.id} fill="none" stroke={s.layer==='Fuerza'?'#a33b13':s.layer==='Cotas'?'#35527a':'#154c4f'} strokeWidth={s.layer==='Fuerza'?2.5:1.6} fontFamily="sans-serif" fontSize="11"><style>{'text{stroke:none;fill:#162d40}'}</style><Glyph s={s}/></g>)}{pt&&<circle data-ui="true" cx={pt.x} cy={pt.y} r="5" fill="#dc582a"/>}</svg><p>{shown.join(' · ')} · Coordenadas en mm</p></section>
 <section className="panel"><h3>Edición por coordenadas</h3><div className="fields"><NumberField label="X inicial" value={x} on={X} min={0} max={720}/><NumberField label="Y inicial" value={y} on={Y} min={0} max={430}/><NumberField label="X final" value={x2} on={X2} min={0} max={720}/><NumberField label="Y final" value={y2} on={Y2} min={0} max={430}/></div><div className="inline"><button onClick={()=>add()}>Insertar por coordenadas</button><button disabled={!history.length} onClick={()=>{void put(history.at(-1)!);U(history.slice(0,-1));P(null)}}>Deshacer</button>{pt&&<button onClick={()=>P(null)}>Cancelar primer punto</button>}</div>
 <label>Elemento del plano<select value={selected} onChange={e=>{const s=sheet.items.find(s=>s.id===e.target.value);S(e.target.value);if(s){X(s.x);Y(s.y);X2(s.x2);Y2(s.y2);T(s.text);K(s.kind);L(s.layer)}}}><option value="">Elegir elemento para editar</option>{sheet.items.map((s,i)=><option key={s.id} value={s.id}>{i+1} · {names[s.kind]} · {s.text} ({s.x}, {s.y})</option>)}</select></label>
 {selectedShape&&<div className="inline"><button onClick={()=>save({...sheet,items:sheet.items.map(s=>s.id===selected?{...s,kind,layer,text:title,x,y,x2,y2}:s)})}>Aplicar cambios al elemento</button><button onClick={()=>{save({...sheet,items:sheet.items.filter(s=>s.id!==selected)});S('')}}>Retirar elemento</button></div>}
 <div className="inline"><button onClick={exportSVG}>Exportar SVG</button><button onClick={()=>window.print()}>Imprimir / guardar PDF</button></div><p role="status">{msg}</p></section></>
}

