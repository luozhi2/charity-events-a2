/**
 * test/smoke_test.js
 * ---------------------------------------------------------------------
 * End-to-end smoke test.
 *
 * It installs the in-memory fake MySQL driver and then boots the REAL
 * api/server.js, so every middleware, router and static file path is
 * exercised exactly as it will be when the marker runs the project.
 *
 *   node test/smoke_test.js
 *
 * Checks the three website pages, the stylesheet, the client scripts, the
 * SVG artwork, every API endpoint and the API's error handling.
 * ---------------------------------------------------------------------
 */

'use strict';

const http = require('http');
const path = require('path');

// 1. Swap in the fake database driver BEFORE anything requires event_db.js.
const fake = require('./fake_driver.js');
fake.install();

// 2. Require the genuine Express application.
const app = require(path.join(__dirname, '..', 'server.js'));

const results = [];

async function main() {
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;

    /**
     * @param {string} label
     * @param {string} url
     * @param {number} expectStatus
     * @param {string} [expectText]
     */
    async function probe(label, url, expectStatus, expectText) {
        try {
            const response = await fetch(base + url);
            const text = await response.text();
            const okStatus = response.status === expectStatus;
            const okText = expectText ? text.includes(expectText) : true;
            const ok = okStatus && okText;
            results.push({ label, ok });
            console.log(`${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(38)} HTTP ${response.status}  ${text.length} bytes`);
        } catch (error) {
            results.push({ label, ok: false });
            console.log(`FAIL  ${label.padEnd(38)} ${error.message}`);
        }
    }

    console.log('\n=== PROG2002 A2 - end-to-end smoke test ===\n');

    console.log('-- Client-side website (static files) --');
    await probe('Home page', '/index.html', 200, 'Upcoming charity events');
    await probe('Home page at site root', '/', 200, '<title>Home');
    await probe('Search page', '/search.html', 200, 'Search charity events');
    await probe('Event detail page', '/event.html?eventId=1', 200, 'register-modal');
    await probe('Stylesheet', '/css/styles.css', 200, '--navy');
    await probe('api.js', '/js/api.js', 200, 'searchEvents');
    await probe('ui.js', '/js/ui.js', 200, 'renderEventCard');
    await probe('home.js', '/js/home.js', 200, 'loadUpcomingEvents');
    await probe('search.js', '/js/search.js', 200, 'validateCriteria');
    await probe('event.js', '/js/event.js', 200, 'renderEvent');
    await probe('Event image (SVG)', '/assets/images/event-twilight-run.svg', 200, '<svg');
    await probe('Organisation logo (SVG)', '/assets/images/logo-harbour-lights.svg', 200, '<svg');

    console.log('\n-- REST API --');
    await probe('GET /api/health', '/api/health', 200, 'charityevents_db');
    await probe('GET /api/events', '/api/events', 200, '"success":true');
    await probe('GET /api/events?status=past', '/api/events?status=past', 200, '"displayStatus":"past"');
    await probe('GET /api/events/search', '/api/events/search?city=Bondi', 200, 'Coastline Silent Auction');
    await probe('GET /api/events/:id', '/api/events/3', 200, 'Coastline Silent Auction');
    await probe('GET /api/categories', '/api/categories', 200, 'Fun Run');
    await probe('GET /api/organisations', '/api/organisations', 200, 'Harbour Lights Foundation');

    console.log('\n-- Error handling --');
    await probe('Suspended event is hidden', '/api/events/14', 404, 'No event was found');
    await probe('Unknown event id', '/api/events/9999', 404, 'No event was found');
    await probe('Invalid event id', '/api/events/abc', 400, 'not a valid event id');
    await probe('Invalid search date', '/api/events/search?dateFrom=31-12-2025', 400, 'not valid');
    await probe('Unknown API endpoint', '/api/not-a-route', 404, 'Endpoint not found');

    console.log('\n-- Data contract consumed by the event cards --');
    const events = await (await fetch(`${base}/api/events`)).json();
    const first = events.data[0];
    const required = ['eventId', 'eventName', 'shortSummary', 'imageUrl', 'displayStatus', 'daysUntil'];
    const missing = required.filter((key) => first[key] === undefined);
    const nestedOk = Boolean(first.category?.categoryName && first.organisation?.name
        && first.date?.displayDate && first.location?.venue && first.ticket?.priceLabel
        && typeof first.goal?.progressPercent === 'number');
    const payloadOk = missing.length === 0 && nestedOk;
    results.push({ label: 'Event payload completeness', ok: payloadOk });
    console.log(`${payloadOk ? 'PASS' : 'FAIL'}  Event payload completeness${payloadOk ? '' : ` (missing: ${missing.join(', ')})`}`);
    console.log(`      sample: #${first.eventId} "${first.eventName}" | ${first.category.categoryName} | ${first.date.displayDate} | ${first.ticket.priceLabel} | ${first.goal.progressPercent}% of goal`);

    const failures = results.filter((r) => !r.ok);
    console.log('\n=====================================================');
    console.log(failures.length === 0
        ? ` RESULT: all ${results.length} smoke checks passed`
        : ` RESULT: ${results.length - failures.length} passed, ${failures.length} FAILED`);
    if (failures.length) failures.forEach((f) => console.log(`   - ${f.label}`));
    console.log('=====================================================');

    server.close();
    process.exitCode = failures.length ? 1 : 0;
}

main().catch((error) => {
    console.error('Smoke test crashed:', error);
    process.exitCode = 1;
});
