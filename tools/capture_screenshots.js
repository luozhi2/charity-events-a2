/**
 * tools/capture_screenshots.js
 * ---------------------------------------------------------------------
 * Launches the real Express server against the in-memory sample data and
 * uses Microsoft Edge (Chromium) to capture genuine screenshots of the
 * running website. The images are written to tools/screenshots/ and are
 * then embedded in the project report.
 *
 *   node tools/capture_screenshots.js
 * ---------------------------------------------------------------------
 */

'use strict';

const path = require('path');
const fs = require('fs');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(__dirname, 'screenshots');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

// 1. Swap in the in-memory MySQL driver so no database server is needed.
const fake = require(path.join(ROOT, 'api', 'test', 'fake_driver.js'));
fake.install();

const puppeteer = require(path.join(__dirname, 'node_modules', 'puppeteer-core'));
const app = require(path.join(ROOT, 'api', 'server.js'));

fs.mkdirSync(OUT_DIR, { recursive: true });

/** Waits until the page has finished its fetch-driven rendering. */
async function waitForRender(page, selector) {
    await page.waitForSelector(selector, { timeout: 20000 });
    // Give CSS transitions and the progress-bar animation time to settle.
    await new Promise((resolve) => setTimeout(resolve, 1200));
}

(async () => {
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(3123, '127.0.0.1', resolve));
    const base = 'http://127.0.0.1:3123';

    const browser = await puppeteer.launch({
        executablePath: EDGE,
        headless: 'new',
        // This environment blocks piped stdio for spawned processes, so the
        // browser's own output is discarded instead of captured through a pipe.
        stdio: ['ignore', 'ignore', 'ignore'],
        args: ['--no-sandbox', '--disable-gpu', '--force-device-scale-factor=1', '--hide-scrollbars']
    });

    const shots = [];

    /** Captures a full-page screenshot at the given width. */
    async function capture(name, url, width, options = {}) {
        const page = await browser.newPage();
        await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
        await page.goto(`${base}${url}`, { waitUntil: 'networkidle2', timeout: 30000 });

        if (options.waitFor) await waitForRender(page, options.waitFor);
        if (options.before) await options.before(page);

        // Measure the real content height so nothing is cut off.
        const height = await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight));
        const cappedHeight = Math.min(height, 7000);
        await page.setViewport({ width, height: cappedHeight, deviceScaleFactor: 1 });
        await new Promise((resolve) => setTimeout(resolve, 500));

        const file = path.join(OUT_DIR, `${name}.jpg`);
        // Screenshots are stored as high-quality JPEGs: at 1440 px wide they
        // stay perfectly legible in the report but the document stays small
        // enough to email.
        await page.screenshot({ path: file, fullPage: false, type: 'jpeg', quality: 88 });
        shots.push({ name, file, url, width, height: cappedHeight });
        console.log(`  captured ${name}.jpg  ${width}x${cappedHeight}`);

        await page.close();
        return file;
    }

    console.log('\nCapturing screenshots from the running website...\n');

    // ---- Home page -------------------------------------------------
    await capture('01-home-desktop', '/index.html', 1440, { waitFor: '.event-card' });
    await capture('02-home-mobile', '/index.html', 420, { waitFor: '.event-card' });

    // ---- Search page -----------------------------------------------
    await capture('03-search-default', '/search.html', 1440, { waitFor: '.event-card' });

    // With criteria applied: category 1 (Fun Run) + upcoming
    await capture('04-search-filtered', '/search.html?categoryId=1&status=upcoming', 1440,
        { waitFor: '.event-card' });

    // Empty result state with validation-style feedback
    await capture('05-search-no-results', '/search.html?city=Reykjavik', 1440,
        { waitFor: '.empty-state' });

    // ---- Event detail page -----------------------------------------
    await capture('06-event-detail', '/event.html?eventId=1', 1440, { waitFor: '#detail-layout:not([hidden])' });

    // The Register modal with the required "under construction" message
    await capture('07-event-modal', '/event.html?eventId=2', 1440, {
        waitFor: '#detail-layout:not([hidden])',
        before: async (page) => {
            await page.click('#register-button');
            await page.waitForSelector('.modal-backdrop.is-open', { timeout: 5000 });
            await new Promise((resolve) => setTimeout(resolve, 600));
        }
    });

    // ---- API responses as JSON (for the API design section) ---------
    const apiPage = await browser.newPage();
    await apiPage.setViewport({ width: 1100, height: 1000 });
    await apiPage.goto(`${base}/api/events/search?city=Sydney&categoryId=1&status=upcoming`,
        { waitUntil: 'networkidle2' });
    await apiPage.screenshot({
        path: path.join(OUT_DIR, '08-api-search-json.jpg'),
        fullPage: true,
        type: 'jpeg',
        quality: 88
    });
    shots.push({ name: '08-api-search-json', width: 1100 });
    console.log('  captured 08-api-search-json.jpg (API response)');
    await apiPage.close();

    await browser.close();
    server.close();

    fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(shots, null, 2));
    console.log(`\n${shots.length} screenshots written to tools/screenshots/`);
})().catch((error) => {
    console.error('Screenshot capture failed:', error);
    process.exit(1);
});
