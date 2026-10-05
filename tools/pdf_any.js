/**
 * tools/pdf_any.js <pdf-file> <page> [<page> ...]
 * Renders pages of any PDF to PNG using PDF.js (CDN) inside Edge.
 */
'use strict';

const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(__dirname, 'node_modules', 'puppeteer-core'));

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const [, , pdfArg, ...pageArgs] = process.argv;
const PDF = path.resolve(pdfArg);
const OUT = path.join(__dirname, 'pdfpages');
fs.mkdirSync(OUT, { recursive: true });

const wanted = pageArgs.map(Number).filter(Number.isFinite);
const b64 = fs.readFileSync(PDF).toString('base64');
const tag = path.basename(PDF, '.pdf');

const HTML = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body{margin:0;background:#fff}canvas{display:block}</style></head><body>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>
window.rendered=[];window.ready=false;window.fail=null;
pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
try{
 const raw=atob("${b64}");const bytes=new Uint8Array(raw.length);
 for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
 (async()=>{
  const pdf=await pdfjsLib.getDocument({data:bytes}).promise;
  window.pageCount=pdf.numPages;
  for(const n of ${JSON.stringify(wanted)}){
    if(n>pdf.numPages)continue;
    const page=await pdf.getPage(n);
    const vp=page.getViewport({scale:1.6});
    const c=document.createElement('canvas');c.width=vp.width;c.height=vp.height;c.id='p'+n;
    document.body.appendChild(c);
    await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;
    const t=await page.getTextContent();
    window.rendered.push({page:n,strings:t.items.map(i=>i.str).join(' ').replace(/\\s+/g,' ')});
  }
  window.ready=true;
 })().catch(e=>{window.fail=String(e);window.ready=true;});
}catch(e){window.fail=String(e);window.ready=true;}
</script></body></html>`;

(async () => {
    const browser = await puppeteer.launch({
        executablePath: EDGE, headless: 'new',
        stdio: ['ignore', 'ignore', 'ignore'],
        args: ['--no-sandbox', '--disable-gpu']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 1400, deviceScaleFactor: 2 });
    await page.setContent(HTML, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForFunction('window.ready === true', { timeout: 90000 });
    const fail = await page.evaluate(() => window.fail);
    if (fail) throw new Error(fail);

    for (const item of await page.evaluate(() => window.rendered)) {
        const el = await page.$('#p' + item.page);
        const file = path.join(OUT, `${tag}-${String(item.page).padStart(2, '0')}.png`);
        await el.screenshot({ path: file });
        console.log(`page ${item.page} -> ${path.basename(file)}`);
        console.log('  TEXT: ' + item.strings.slice(0, 600));
    }
    await browser.close();
})().catch((e) => { console.error('failed:', e.message); process.exit(1); });
