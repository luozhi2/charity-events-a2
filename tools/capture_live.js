/**
 * tools/capture_live.js
 * ---------------------------------------------------------------------
 * Captures a screenshot of the REAL running site with the REAL MySQL
 * database, as final proof that the whole stack works end to end.
 *
 * The API must already be running on http://localhost:3000.
 *
 *   node tools/capture_live.js
 * ---------------------------------------------------------------------
 */

'use strict';

const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(__dirname, 'node_modules', 'puppeteer-core'));

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT = path.join(__dirname, 'live-verification');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
    const browser = await puppeteer.launch({
        executablePath: EDGE,
        headless: 'new',
        stdio: ['ignore', 'ignore', 'ignore'],
        args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });

    console.log('Checking the live site served from real MySQL...\n');

    // ---- Home page -------------------------------------------------
    await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('.event-card', { timeout: 20000 });
    await new Promise((r) => setTimeout(r, 1200));

    const homeCards = await page.$$eval('.event-card', (els) =>
        els.map((e) => e.querySelector('.event-card__title')?.textContent.trim()));
    const counters = await page.$$eval('.hero-stat', (els) =>
        els.map((e) => `${e.querySelector('.hero-stat__label').textContent.trim()}=${e.querySelector('.hero-stat__value').textContent.trim()}`));

    console.log(`Home page      : ${homeCards.length} event cards rendered from MySQL`);
    console.log(`Hero counters  : ${counters.join(', ')}`);
    console.log(`First three    : ${homeCards.slice(0, 3).join(' | ')}`);

    await page.screenshot({ path: path.join(OUT, 'live-home.png'), fullPage: true });

    // ---- API response ---------------------------------------------
    const api = await page.evaluate(async () => {
        const r = await fetch('/api/events');
        return r.json();
    });
    console.log(`API /api/events: success=${api.success}, count=${api.count}`);

    // ---- Search page with a real filter ---------------------------
    await page.goto('http://localhost:3000/search.html?categoryId=1&status=upcoming',
        { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('.event-card, .empty-state', { timeout: 20000 });
    await new Promise((r) => setTimeout(r, 1000));
    const searchCount = await page.$eval('#results-count', (e) => e.textContent.trim());
    const chips = await page.$$eval('.filter-chip', (els) => els.map((e) => e.textContent.trim()));
    console.log(`Search page    : ${searchCount}  chips: ${chips.join(', ')}`);
    await page.screenshot({ path: path.join(OUT, 'live-search.png'), fullPage: true });

    // ---- Event detail page ----------------------------------------
    await page.goto('http://localhost:3000/event.html?eventId=1',
        { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('#detail-layout:not([hidden])', { timeout: 20000 });
    await new Promise((r) => setTimeout(r, 800));
    const title = await page.$eval('#event-title', (e) => e.textContent.trim());
    const goal = await page.$eval('#goal-raised', (e) => e.textContent.trim());
    const pct = await page.$eval('#goal-percent', (e) => e.textContent.trim());
    console.log(`Event detail   : "${title}"  raised ${goal} (${pct})`);
    await page.screenshot({ path: path.join(OUT, 'live-event.png'), fullPage: true });

    // ---- Suspended event must 404 ---------------------------------
    await page.goto('http://localhost:3000/event.html?eventId=14',
        { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1500));
    const hiddenTitle = await page.$eval('#event-title', (e) => e.textContent.trim());
    const message = await page.$eval('#detail-message', (e) => e.textContent.trim().slice(0, 90));
    console.log(`Suspended (14) : page says "${hiddenTitle}" - ${message}...`);

    await browser.close();
    console.log(`\nScreenshots written to tools/live-verification/`);
})().catch((error) => {
    console.error('Live capture failed:', error.message);
    process.exit(1);
});
