import {chromium} from '@playwright/test'
import {createServer} from 'node:http'
import {geoActivities} from '../src/content/math.ts'
const proxy=process.env.HTTPS_PROXY||process.env.https_proxy
const local=createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta charset=utf-8><div id="applet"></div>')})
await new Promise(r=>local.listen(0,'127.0.0.1',r))
let browser
try{
browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage'],...(proxy?{proxy:{server:new URL(proxy).origin,bypass:'127.0.0.1,localhost'}}:{})})
const page=await browser.newPage({ignoreHTTPSErrors:false})
for(const [index,a] of geoActivities.entries()){
 await page.goto('http://127.0.0.1:'+local.address().port)
 await page.addScriptTag({url:'https://www.geogebra.org/apps/deployggb.js'})
 await page.evaluate(app=>{new window.GGBApplet({id:'testGgb',appName:app,language:'en',width:720,height:440,showAlgebraInput:true,showMenuBar:true,appletOnLoad:g=>{window.testAPI=g}},true).inject('applet')},a.app)
 await page.waitForFunction(()=>!!window.testAPI,undefined,{timeout:100000})
 const result=await page.evaluate(({commands,probe,cas})=>{const g=window.testAPI;const status=commands.map(s=>[s,g.evalCommand(s)]);return {status,value:g.getValue(probe),cas:cas?g.evalCommandCAS(cas):null}},a)
 console.log('GeoGebra',index+1,JSON.stringify(result))
 if(!result.status.every(v=>v[1])||Math.abs(result.value-a.value)>1e-8||(a.cas&&(!result.cas?.includes('3')||!result.cas?.includes('2'))))throw Error('Resultado distinto del previsto en actividad '+(index+1))
}
}finally{await browser?.close();await new Promise(r=>local.close(r))}

