import type {Question} from '../content/schema'
export function grade(q:Question,input:string){const cleaned=input.trim().replace(',','.');if(!cleaned)return false;if(typeof q.answer==='string')return q.answer===input;return /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(cleaned)&&Number.isFinite(Number(cleaned))&&Math.abs(Number(cleaned)-q.answer)<=(q.tolerance??.015)+1e-10}
export type Answer={lesson:string;prompt:string;value:string;ok:boolean;explanation:string}
export type Attempt={id:string;date:string;items:Answer[];passed:boolean}
export type Work={fields:Record<string,string>;files:string[];checks:number[];state:string;updated?:string}
export const emptyWork:Work={fields:{},files:[],checks:[],state:'Pendiente'}

