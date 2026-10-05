/**
 * test/api_test.js
 * ---------------------------------------------------------------------
 * Automated test suite for the Charity Events REST API.
 *
 * It boots the SAME Express routers used by server.js, but replaces the
 * MySQL driver with the in-memory fake in test/fake_driver.js so the tests
 * run without a database server. Every endpoint, status code and response
 * field that the client-side website depends on is checked here.
 *
 *   node test/api_test.js
 * ---------------------------------------------------------------------
 */

'use strict';

const path = require('path');
const http = require('http');

// Swap in the fake database driver BEFORE event_db.js is loaded.
const fake = require('./fake_driver.js');
fake.install();

const { iso } = fake;

/* ---------------------------------------------------------------------
 * Boot the real routers inside a minimal Express app
 * ------------------------------------------------------------------- */
const express = require('express');
const eventsRouter = require(path.join(__dirname, '..', 'routes', 'events.js'));
const categoriesRouter = require(path.join(__dirname, '..', 'routes', 'categories.js'));
const organisationsRouter = require(path.join(__dirname, '..', 'routes', 'organisations.js'));
const { testConnection } = require(path.join(__dirname, '..', 'event_db.js'));

const app = express();
app.use(express.json());
app.use('/api/events', eventsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/organisations', organisationsRouter);

app.get('/api/health', async (req, res) => {
    try {
        const info = await testConnection();
        res.json({
            success: true,
            message: 'Charity Events API is running.',
            database: info.database,
            eventsInDatabase: info.eventCount
        });
    } catch (error) {
        res.status(503).json({ success: false, message: error.message });
    }
});

app.use('/api', (req, res) => res.status(404).json({
    success: false,
    message: 'Endpoint not found.',
    availableEndpoints: []
}));

app.use((error, req, res, next) => { // eslint-disable-line no-unused-vars
    res.status(500).json({ success: false, message: error.message });
});

/* ---------------------------------------------------------------------
 * Tiny test runner
 * ------------------------------------------------------------------- */
let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, detail) {
    if (condition) {
        passed += 1;
        console.log(`  PASS  ${name}`);
    } else {
        failed += 1;
        failures.push(name);
        console.log(`  FAIL  ${name}${detail ? `  -> ${detail}` : ''}`);
    }
}

async function main() {
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;

    const get = async (url) => {
        const response = await fetch(`${base}${url}`);
        let json = null;
        try { json = await response.json(); } catch (error) { json = null; }
        return { status: response.status, json };
    };

    console.log('\n=== PROG2002 A2 - Charity Events API test suite ===\n');

    console.log('GET /api/health');
    const health = await get('/api/health');
    check('responds 200', health.status === 200, `got ${health.status}`);
    check('reports the database name', health.json?.database === 'charityevents_db');

    console.log('\nGET /api/events  (Home page feed)');
    const events = await get('/api/events');
    const feed = events.json?.data || [];
    check('responds 200', events.status === 200, `got ${events.status}`);
    check('returns only upcoming events', feed.every((e) => e.displayStatus === 'upcoming'));
    check('returns at least 8 events (brief requirement: min 8)', feed.length >= 8, `got ${feed.length}`);
    check('excludes the suspended event', !feed.some((e) => e.eventId === 14));
    check('includes the category name on every event', feed.every((e) => Boolean(e.category?.categoryName)));
    check('includes the organisation on every event', feed.every((e) => Boolean(e.organisation?.name)));
    check('includes ticket information', feed.every((e) => typeof e.ticket?.priceLabel === 'string'));
    check('includes goal progress between 0 and 100', feed.every((e) => e.goal.progressPercent >= 0 && e.goal.progressPercent <= 100));
    check('marks past/upcoming automatically from the date', feed.every((e) => e.daysUntil >= 0));
    check('is sorted by date ascending', (() => {
        const dates = feed.map((e) => e.date.isoDate);
        return dates.every((value, index) => index === 0 || dates[index - 1] <= value);
    })());

    console.log('\nGET /api/events?status=past');
    const past = await get('/api/events?status=past');
    check('responds 200', past.status === 200);
    check('returns only past events', (past.json?.data || []).length > 0
        && (past.json?.data || []).every((e) => e.displayStatus === 'past'));

    console.log('\nGET /api/events?status=all');
    const all = await get('/api/events?status=all');
    check('responds 200', all.status === 200);
    check('returns upcoming and past together', (all.json?.data || []).some((e) => e.displayStatus === 'past')
        && (all.json?.data || []).some((e) => e.displayStatus === 'upcoming'));

    console.log('\nGET /api/events  (validation and paging)');
    const badStatus = await get('/api/events?status=banana');
    check('rejects an unknown status with 400', badStatus.status === 400, `got ${badStatus.status}`);
    check('explains the problem in the response body', Boolean(badStatus.json?.message));
    const limited = await get('/api/events?limit=3');
    check('applies the limit parameter', (limited.json?.data || []).length === 3, `got ${(limited.json?.data || []).length}`);

    console.log('\nGET /api/events/search  (the three required criteria)');
    const byCity = await get('/api/events/search?city=Bondi');
    check('filters by location', byCity.status === 200
        && (byCity.json?.data || []).length > 0
        && (byCity.json?.data || []).every((e) => /bondi/i.test(`${e.location.suburb} ${e.location.city} ${e.location.venue}`)));

    const byCategory = await get('/api/events/search?categoryId=1');
    check('filters by category', byCategory.status === 200
        && (byCategory.json?.data || []).length > 0
        && (byCategory.json?.data || []).every((e) => e.category.categoryId === 1));

    const byDate = await get(`/api/events/search?dateFrom=${iso(0)}&dateTo=${iso(30)}`);
    check('filters by date range', byDate.status === 200
        && (byDate.json?.data || []).every((e) => e.date.isoDate >= iso(0) && e.date.isoDate <= iso(30)));

    const combined = await get('/api/events/search?city=Sydney&categoryId=1&status=upcoming');
    check('combines several criteria at once', combined.status === 200, `got ${combined.status}`);
    check('a combined search returns a subset of the single-criterion search',
        (combined.json?.data || []).length <= (byCategory.json?.data || []).length);

    const noMatch = await get('/api/events/search?city=Reykjavik');
    check('returns an empty result set (not an error) when nothing matches',
        noMatch.status === 200 && noMatch.json?.count === 0, `status ${noMatch.status}, count ${noMatch.json?.count}`);

    check('never returns the suspended event from search',
        !(all.json?.data || []).some((e) => e.eventId === 14));

    console.log('\nGET /api/events/search  (validation)');
    const badDate = await get('/api/events/search?dateFrom=31-12-2025');
    check('rejects a malformed date with 400', badDate.status === 400, `got ${badDate.status}`);
    check('returns a list of validation errors', Array.isArray(badDate.json?.errors) && badDate.json.errors.length > 0);
    const reversed = await get(`/api/events/search?dateFrom=${iso(30)}&dateTo=${iso(5)}`);
    check('rejects a reversed date range with 400', reversed.status === 400, `got ${reversed.status}`);
    const badCategory = await get('/api/events/search?categoryId=abc');
    check('rejects a non-numeric category with 400', badCategory.status === 400, `got ${badCategory.status}`);

    console.log('\nGET /api/events/:id  (Event detail page)');
    const detail = await get('/api/events/1');
    check('responds 200 for a real event', detail.status === 200, `got ${detail.status}`);
    check('returns the full description', Boolean(detail.json?.data?.fullDescription));
    check('returns the purpose statement for Goal vs Progress', Boolean(detail.json?.data?.purpose));
    check('returns goal and raised amounts', detail.json?.data?.goal?.amount > 0
        && typeof detail.json?.data?.goal?.raised === 'number');
    check('returns the host organisation contact details', Boolean(detail.json?.data?.organisation?.email));
    check('returns the event location details', Boolean(detail.json?.data?.location?.venue));

    const suspended = await get('/api/events/14');
    check('hides a suspended event with 404', suspended.status === 404, `got ${suspended.status}`);
    const missing = await get('/api/events/9999');
    check('responds 404 for an unknown id', missing.status === 404, `got ${missing.status}`);
    const invalid = await get('/api/events/abc');
    check('responds 400 for a non-numeric id', invalid.status === 400, `got ${invalid.status}`);

    console.log('\nGET /api/categories  (search page filter)');
    const categories = await get('/api/categories');
    check('responds 200', categories.status === 200);
    check('returns 5 categories', categories.json?.count === 5, `got ${categories.json?.count}`);
    check('includes an upcoming event count per category',
        (categories.json?.data || []).every((c) => typeof c.eventCount === 'number'));
    check('includes a description for each category',
        (categories.json?.data || []).every((c) => Boolean(c.description)));

    console.log('\nGET /api/organisations');
    const organisations = await get('/api/organisations');
    check('responds 200', organisations.status === 200);
    check('returns 3 organisations', organisations.json?.count === 3, `got ${organisations.json?.count}`);
    check('includes a mission statement', (organisations.json?.data || []).every((o) => Boolean(o.missionStatement)));

    console.log('\nUnknown endpoint handling');
    const unknown = await get('/api/does-not-exist');
    check('responds 404 with a list of valid endpoints',
        unknown.status === 404 && Array.isArray(unknown.json?.availableEndpoints));

    /* -----------------------------------------------------------------
       Static guard for a bug that ONLY appears against a real server:
       mysql2's callback-style pool.execute() returns a Query object that
       happens to have a .then() method, so "await pool.execute()" resolves
       to the Query instead of [rows, fields]. event_db.js must therefore go
       through pool.promise().
       ----------------------------------------------------------------- */
    console.log('\nConnection layer (real-database compatibility)');
    const fs = require('fs');
    const apiRoot = path.join(__dirname, '..');
    const dbSource = fs.readFileSync(path.join(apiRoot, 'event_db.js'), 'utf8');
    const routeFiles = fs.readdirSync(path.join(apiRoot, 'routes')).filter((f) => f.endsWith('.js'));

    // Strip comments first, otherwise the code's own explanation of the bug
    // would match the pattern that guards against it.
    const stripComments = (src) => src
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
    const dbCode = stripComments(dbSource);

    check('event_db.js uses the mysql2 promise API', /\.promise\(\)/.test(dbCode));
    check('event_db.js never awaits the callback-style pool directly',
        !/await\s+pool\.(execute|query)\s*\(/.test(dbCode));
    check('no route queries the pool directly (all go through query())',
        routeFiles.every((f) => !/await\s+pool\./.test(
            stripComments(fs.readFileSync(path.join(apiRoot, 'routes', f), 'utf8')))));

    server.close();

    console.log('\n=====================================================');
    console.log(` RESULT: ${passed} passed, ${failed} failed`);
    console.log('=====================================================');

    if (failed) {
        console.log(' Failed checks:');
        failures.forEach((name) => console.log(`   - ${name}`));
        process.exitCode = 1;
    } else {
        console.log('\n Manual endpoint examples for Postman / the browser:');
        console.log('   GET http://localhost:3000/api/events');
        console.log('   GET http://localhost:3000/api/events?status=past');
        console.log('   GET http://localhost:3000/api/events/search?city=Sydney&categoryId=1&status=upcoming');
        console.log('   GET http://localhost:3000/api/events/search?dateFrom=2025-01-01&dateTo=2025-12-31');
        console.log('   GET http://localhost:3000/api/events/3');
        console.log('   GET http://localhost:3000/api/categories');
        console.log('   GET http://localhost:3000/api/organisations');
    }
}

main().catch((error) => {
    console.error('\nTest harness crashed:', error);
    process.exitCode = 1;
});
