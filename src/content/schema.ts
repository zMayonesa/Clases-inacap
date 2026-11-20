export type Question={prompt:string;answer:string|number;explanation:string;options?:string[];unit?:string;tolerance?:number}
export const numberQ=(prompt:string,answer:number,unit:string,explanation:string,tolerance=.015):Question=>({prompt,answer,unit,explanation,tolerance})
export const choose=(prompt:string,options:string[],correct:number,explanation:string):Question=>({prompt,options,answer:options[correct],explanation})
export type Lesson={title:string;goal:string;theory:string[];diagram:string[];example:string[];guided:string[];exercise:Question;check:Question;industry:string;review:string}
export function lesson(title:string,goal:string,theory:string,diagram:string,example:string,guided:string,exercise:Question,check:Question,industry:string,review:string):Lesson{
 return {title,goal,theory:theory.split('|'),diagram:diagram.split('|'),example:example.split('|'),guided:guided.split('|'),exercise,check,industry,review}
}
export type Course={id:string;name:string;short:string;color:string;intro:string;units:string[];lessons:Lesson[];foundation:string;}

