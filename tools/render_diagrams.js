/**
 * tools/render_diagrams.js
 * ---------------------------------------------------------------------
 * Renders each SVG diagram in tools/diagrams/ to a PNG so the diagrams can
 * be proof-read and (optionally) used in slides or the video.
 *
 *   node tools/render_diagrams.js
 * ---------------------------------------------------------------------
 */

'use strict';

const path = require('path');
const fs = require('fs');

const DIR = path.join(__dirname, 'diagrams');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const puppeteer = require(path.join(__dirname, 'node_modules', 'puppeteer-core'));

(async () => {
    const browser = await puppeteer.launch({
        executablePath: EDGE,
        headless: 'new',
        stdio: ['ignore', 'ignore', 'ignore'],
        args: ['--no-sandbox', '--disable-gpu', '--force-device-scale-factor=2', '--hide-scrollbars']
    });

    const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.svg'));
    for (const file of files) {
        const page = await browser.newPage();

        // Read the SVG's own width/height from its viewBox.
        const svg = fs.readFileSync(path.join(DIR, file), 'utf-8');
        const m = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
        const w = Math.ceil(Number(m[1]));
        const h = Math.ceil(Number(m[2]));

        await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
        await page.goto('file:///' + path.join(DIR, file).replace(/\\/g, '/'), { waitUntil: 'load' });
        await new Promise((r) => setTimeout(r, 300));
        await page.screenshot({ path: path.join(DIR, file.replace('.svg', '.png')), fullPage: false });
        console.log(`  rendered ${file}  (${w}x${h})`);
        await page.close();
    }

    await browser.close();
})().catch((error) => {
    console.error('Diagram rendering failed:', error);
    process.exit(1);
});
