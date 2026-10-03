/**
 * routes/organisations.js
 * ---------------------------------------------------------------------
 * GET /api/organisations
 *
 * Returns the charitable organisations that host the events. The Home
 * page uses this endpoint to describe the organisations behind the
 * campaign. The static welcome text on the Home page is hard-coded as the
 * brief allows, but the organisation list itself is served from the
 * database so it stays in step with the events.
 * ---------------------------------------------------------------------
 */

'use strict';

const express = require('express');
const { query } = require('../event_db');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const sql = `
            SELECT
                o.organisation_id,
                o.name,
                o.mission_statement,
                o.about_text,
                o.email,
                o.phone,
                o.website,
                o.city,
                o.logo_url,
                COUNT(e.event_id) AS upcoming_event_count
            FROM organisations o
            LEFT JOIN events e
                   ON e.organisation_id = o.organisation_id
                  AND e.status = 'active'
                  AND e.event_date >= CURDATE()
            GROUP BY o.organisation_id, o.name, o.mission_statement, o.about_text,
                     o.email, o.phone, o.website, o.city, o.logo_url
            ORDER BY o.name ASC
        `;

        const rows = await query(sql);

        const organisations = rows.map((row) => ({
            organisationId: row.organisation_id,
            name: row.name,
            missionStatement: row.mission_statement,
            aboutText: row.about_text,
            email: row.email,
            phone: row.phone,
            website: row.website,
            city: row.city,
            logoUrl: row.logo_url,
            upcomingEventCount: Number(row.upcoming_event_count) || 0
        }));

        res.json({ success: true, count: organisations.length, data: organisations });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
