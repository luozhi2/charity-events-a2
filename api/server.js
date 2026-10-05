/**
 * server.js
 * ---------------------------------------------------------------------
 * PROG2002 Web Development II - Assessment 2
 * Charity Events website - RESTful API + static client-side website.
 *
 * Run with:   npm install      (first time only)
 *             node server.js
 *
 * Then open:  http://localhost:3000              -> Home page
 *             http://localhost:3000/search.html  -> Search events page
 *             http://localhost:3000/event.html?eventId=3
 *             http://localhost:3000/api/events   -> REST API
 *
 * The API and the website are separate deliverables in the submission
 * (usernameA2-api.zip and usernameA2-clientside.zip), but serving the
 * static website from the same Express process makes local testing easy
 * and is exactly how the marker will run it.
 * ---------------------------------------------------------------------
 */

'use strict';

require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const { testConnection } = require('./event_db');
const eventsRouter = require('./routes/events');
const categoriesRouter = require('./routes/categories');
const organisationsRouter = require('./routes/organisations');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

/* ---------------------------------------------------------------------
 * 1. Application-level middleware
 * ------------------------------------------------------------------- */
app.use(cors());                          // allow the client-side site to call the API
app.use(express.json());                  // parse JSON request bodies (needed in A3)
app.use(express.urlencoded({ extended: true }));

// Small request logger so the terminal shows which endpoint was used.
app.use((req, res, next) => {
    const started = Date.now();
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - started} ms)`);
    });
    next();
});

/* ---------------------------------------------------------------------
 * 2. REST API routes
 *    Mounting the routers keeps server.js short and each resource in its
 *    own file, which is the structure expected for a RESTful API.
 * ------------------------------------------------------------------- */
app.use('/api/events', eventsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/organisations', organisationsRouter);

// Small health-check endpoint - handy while marking and while recording
// the demo video.
app.get('/api/health', async (req, res) => {
    try {
        const info = await testConnection();
        res.json({
            success: true,
            message: 'Charity Events API is running.',
            database: info.database,
            eventsInDatabase: info.eventCount,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            message: 'API is running but the database is not reachable.',
            detail: error.message
        });
    }
});

/* ---------------------------------------------------------------------
 * 3. Static files for the client-side website
 * ------------------------------------------------------------------- */
const CLIENT_DIR = path.join(__dirname, '..', 'client');

// Event images are stored with the API so that the same relative
// "assets/images/..." path keeps working wherever the images are hosted.
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(CLIENT_DIR));

/* ---------------------------------------------------------------------
 * 4. 404 handler for unknown API paths
 * ------------------------------------------------------------------- */
app.use('/api', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint not found: ${req.method} ${req.originalUrl}. See the available endpoints below.`,
        availableEndpoints: [
            'GET /api/health',
            'GET /api/events',
            'GET /api/events/search?city=&categoryId=&dateFrom=&dateTo=&status=',
            'GET /api/events/:id',
            'GET /api/categories',
            'GET /api/organisations'
        ]
    });
});

/* ---------------------------------------------------------------------
 * 5. Central error handler
 *    Any error passed to next() ends up here and is returned as JSON,
 *    which keeps the API responses consistent.
 * ------------------------------------------------------------------- */
app.use((error, req, res, next) => { // eslint-disable-line no-unused-vars
    console.error('[API ERROR]', error);

    // MySQL connection problems (wrong password, server down, missing db)
    if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR') {
        return res.status(503).json({
            success: false,
            message: 'The API could not connect to MySQL. Check api/.env and make sure the MySQL server is running.',
            detail: error.code
        });
    }
    if (error.code === 'ER_NO_SUCH_TABLE' || error.code === 'ER_BAD_DB_ERROR') {
        return res.status(503).json({
            success: false,
            message: 'The charityevents_db database or its tables were not found. Import database/charityevents_db.sql first.',
            detail: error.code
        });
    }

    res.status(500).json({
        success: false,
        message: 'An unexpected server error occurred.',
        detail: error.message
    });
});

/* ---------------------------------------------------------------------
 * 6. Start the server
 * ------------------------------------------------------------------- */
if (require.main === module) {
    app.listen(PORT, async () => {
        console.log('=====================================================');
        console.log(' PROG2002 A2 - Charity Events API');
        console.log('=====================================================');
        console.log(` Server      : http://localhost:${PORT}`);
        console.log(` Home page   : http://localhost:${PORT}/index.html`);
        console.log(` Search page : http://localhost:${PORT}/search.html`);
        console.log(` API sample  : http://localhost:${PORT}/api/events`);
        console.log('-----------------------------------------------------');

        try {
            const info = await testConnection();
            console.log(` [OK] MySQL connected. Database "${info.database}" has ${info.eventCount} events.`);
        } catch (error) {
            console.warn(` [WARN] MySQL not reachable: ${error.code || error.message}`);
            console.warn('        Import database/charityevents_db.sql and check api/.env, then restart.');
        }
        console.log(' Press Ctrl + C to stop.');
    });
}

module.exports = app;
