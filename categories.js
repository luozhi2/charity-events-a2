/**
 * routes/categories.js
 * ---------------------------------------------------------------------
 * GET /api/categories
 *
 * Returns the list of event categories together with the number of public
 * upcoming events in each one. The Search page uses this endpoint to
 * build its category filter drop-down, and the Home page uses it for the
 * category quick-filter chips.
 * ---------------------------------------------------------------------
 */

'use strict';

const express = require('express');
const { query } = require('../event_db');
const { mapCategory } = require('../utils/eventMapper');
const { todayString } = require('../utils/dateUtils');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const includeCounts = String(req.query.withCounts || 'true') !== 'false';

        /* LEFT JOIN keeps a category in the list even when it currently
           has no upcoming events. The date/status test sits in the JOIN
           condition (not in WHERE) so it does not filter the categories
           themselves out. */
        const sql = includeCounts
            ? `
                SELECT
                    c.category_id,
                    c.category_name,
                    c.description,
                    COUNT(e.event_id) AS event_count
                FROM categories c
                LEFT JOIN events e
                       ON e.category_id = c.category_id
                      AND e.status = 'active'
                      AND e.event_date >= ?
                GROUP BY c.category_id, c.category_name, c.description
                ORDER BY c.category_name ASC
            `
            : `
                SELECT category_id, category_name, description
                FROM categories
                ORDER BY category_name ASC
            `;

        const rows = includeCounts ? await query(sql, [todayString()]) : await query(sql);
        const categories = rows.map(mapCategory);

        res.json({ success: true, count: categories.length, data: categories });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
