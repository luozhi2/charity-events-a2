/**
 * routes/events.js
 * ---------------------------------------------------------------------
 * RESTful endpoints for the "events" resource.
 *
 *   GET /api/events              Home page   - active + upcoming events
 *   GET /api/events/search       Search page - filter by date / city / category
 *   GET /api/events/:id          Event detail page - one event, full detail
 *
 * REST notes:
 *   * "events" is the resource, so the URL is a noun, not a verb.
 *   * GET is used because every operation here only READS data. GET is
 *     safe (no side effects) and idempotent (calling it twice returns the
 *     same result), which is exactly what a read-only A2 API needs.
 *   * Filtering is expressed with query-string parameters rather than a
 *     new URL path, so /api/events remains the single collection resource.
 * ---------------------------------------------------------------------
 */

'use strict';

const express = require('express');
const { query } = require('../event_db');
const { mapEvents, mapEvent } = require('../utils/eventMapper');
const { isValidDateParam, todayString } = require('../utils/dateUtils');

/* =====================================================================
 * Query-parameter design for GET /api/events/search
 * ---------------------------------------------------------------------
 * The Search page offers three criteria - date, location and category -
 * and the user may apply any combination of them, so none of the
 * parameters can be mandatory. They are therefore all optional, and the
 * route assembles its WHERE clause from whichever ones arrive:
 *
 *   ?city=Sydney              partial match on city, suburb or venue
 *   ?categoryId=1             exact match on the category
 *   ?dateFrom=2026-10-01      inclusive lower bound on the event date
 *   ?dateTo=2026-12-31        inclusive upper bound on the event date
 *   ?status=upcoming|past|all defaults to "all"; suspended stays hidden
 *
 * Two rules keep this safe and predictable:
 *   1. Every value is bound as a "?" parameter, and the ORDER BY clause is
 *      chosen from fixed strings inside this file, so no user text is ever
 *      concatenated into the SQL.
 *   2. Validation happens BEFORE the query runs. Malformed dates, a
 *      reversed date range, a non-numeric categoryId or an unknown status
 *      are collected and returned together as HTTP 400 with a list of
 *      problems, so the form can report all of them at once.
 * ===================================================================== */

const router = express.Router();

/* ---------------------------------------------------------------------
 * Shared SELECT: joins events to its category and its organisation so
 * that one row already contains everything the website needs.
 * ------------------------------------------------------------------- */
const BASE_SELECT = `
    SELECT
        e.event_id, e.event_name, e.short_summary, e.full_description, e.purpose,
        e.event_date, e.start_time, e.end_time,
        e.location_name, e.address, e.suburb, e.city,
        e.ticket_price, e.is_free, e.goal_amount, e.raised_amount, e.capacity,
        e.image_url, e.status,
        c.category_id, c.category_name,
        o.organisation_id, o.name AS organisation_name, o.mission_statement,
        o.email AS organisation_email, o.phone AS organisation_phone,
        o.website AS organisation_website
    FROM events e
    INNER JOIN categories c    ON c.category_id = e.category_id
    INNER JOIN organisations o ON o.organisation_id = e.organisation_id
`;

/* Statuses that may be shown to the public. 'suspended' events break the
   fundraising policy and must never reach the client-side website. */
const PUBLIC_STATUSES = ['active', 'cancelled'];

/* ---------------------------------------------------------------------
 * GET /api/events
 * Home page feed.
 *
 * Query parameters (all optional):
 *   status = upcoming | past | all      (default: upcoming)
 *   limit  = 1..100                     (default: 50)
 *
 * The Home page calls this endpoint without parameters, so it receives
 * every active, non-suspended event dated today or later.
 * ------------------------------------------------------------------- */
router.get('/', async (req, res, next) => {
    try {
        const requestedStatus = String(req.query.status || 'upcoming').toLowerCase();
        const allowedStatuses = ['upcoming', 'past', 'all'];

        if (!allowedStatuses.includes(requestedStatus)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status "${req.query.status}". Allowed values: ${allowedStatuses.join(', ')}.`
            });
        }

        let limit = Number.parseInt(req.query.limit, 10);
        if (Number.isNaN(limit) || limit < 1) limit = 50;
        limit = Math.min(limit, 100);

        const conditions = ['e.status IN (?, ?)'];
        const params = [...PUBLIC_STATUSES];

        if (requestedStatus === 'upcoming') {
            conditions.push('e.event_date >= ?');
            params.push(todayString());
        } else if (requestedStatus === 'past') {
            conditions.push('e.event_date < ?');
            params.push(todayString());
        }

        // ORDER BY is built from a fixed whitelist (never from user text)
        // and LIMIT is bound as a parameter, so the statement stays safe
        // from SQL injection.
        const orderBy = requestedStatus === 'past'
            ? 'e.event_date DESC, e.start_time ASC'
            : 'e.event_date ASC, e.start_time ASC';

        const sql = `
            ${BASE_SELECT}
            WHERE ${conditions.join(' AND ')}
            ORDER BY ${orderBy}
            LIMIT ?
        `;

        const rows = await query(sql, [...params, limit]);
        const events = mapEvents(rows);

        res.json({
            success: true,
            count: events.length,
            filter: { status: requestedStatus, limit },
            data: events
        });
    } catch (error) {
        next(error);
    }
});

/* ---------------------------------------------------------------------
 * GET /api/events/search
 * Search page. All three criteria are optional and can be combined, which
 * satisfies the requirement "allow web users to select one or multiple
 * criteria".
 *
 * Query parameters:
 *   city       = text  (partial match, e.g. "syd" matches "Sydney")
 *   categoryId = integer
 *   dateFrom   = YYYY-MM-DD
 *   dateTo     = YYYY-MM-DD
 *   status     = upcoming | past | all   (default: all, but suspended is
 *                                         always excluded)
 *
 * The route is declared BEFORE "/:id" otherwise Express would treat
 * "search" as an event id.
 * ------------------------------------------------------------------- */
router.get('/search', async (req, res, next) => {
    try {
        const { city, categoryId, dateFrom, dateTo } = req.query;
        const requestedStatus = String(req.query.status || 'all').toLowerCase();

        const errors = [];
        const conditions = ['e.status IN (?, ?)'];
        const params = [...PUBLIC_STATUSES];

        /* -------- criteria 1: city / location -------- */
        if (city && String(city).trim() !== '') {
            const term = String(city).trim();
            conditions.push('(e.city LIKE ? OR e.suburb LIKE ? OR e.location_name LIKE ?)');
            params.push(`%${term}%`, `%${term}%`, `%${term}%`);
        }

        /* -------- criteria 2: category -------- */
        if (categoryId && String(categoryId).trim() !== '') {
            const parsedCategory = Number.parseInt(categoryId, 10);
            if (Number.isNaN(parsedCategory) || parsedCategory < 1) {
                errors.push('categoryId must be a positive integer.');
            } else {
                conditions.push('e.category_id = ?');
                params.push(parsedCategory);
            }
        }

        /* -------- criteria 3: date range -------- */
        if (dateFrom && String(dateFrom).trim() !== '') {
            const validFrom = isValidDateParam(String(dateFrom).trim());
            if (!validFrom) {
                errors.push('dateFrom must be a valid date in YYYY-MM-DD format.');
            } else {
                conditions.push('e.event_date >= ?');
                params.push(validFrom);
            }
        }

        if (dateTo && String(dateTo).trim() !== '') {
            const validTo = isValidDateParam(String(dateTo).trim());
            if (!validTo) {
                errors.push('dateTo must be a valid date in YYYY-MM-DD format.');
            } else {
                conditions.push('e.event_date <= ?');
                params.push(validTo);
            }
        }

        if (dateFrom && dateTo && !errors.length) {
            const from = isValidDateParam(String(dateFrom).trim());
            const to = isValidDateParam(String(dateTo).trim());
            if (from && to && from > to) {
                errors.push('dateFrom cannot be later than dateTo.');
            }
        }

        if (!['upcoming', 'past', 'all'].includes(requestedStatus)) {
            errors.push(`status must be one of: upcoming, past, all.`);
        } else if (requestedStatus === 'upcoming') {
            conditions.push('e.event_date >= ?');
            params.push(todayString());
        } else if (requestedStatus === 'past') {
            conditions.push('e.event_date < ?');
            params.push(todayString());
        }

        // Validation errors are reported with HTTP 400 so the client-side
        // form can display them inside the error message area.
        if (errors.length) {
            return res.status(400).json({
                success: false,
                message: 'The search criteria are not valid.',
                errors
            });
        }

        const sql = `
            ${BASE_SELECT}
            WHERE ${conditions.join(' AND ')}
            ORDER BY e.event_date ASC, e.start_time ASC
        `;

        const rows = await query(sql, params);
        const events = mapEvents(rows);

        res.json({
            success: true,
            count: events.length,
            filter: {
                city: city || null,
                categoryId: categoryId ? Number(categoryId) : null,
                dateFrom: dateFrom || null,
                dateTo: dateTo || null,
                status: requestedStatus
            },
            data: events
        });
    } catch (error) {
        next(error);
    }
});

/* ---------------------------------------------------------------------
 * GET /api/events/:id
 * Event detail page.
 *
 * The id arrives from the URL query string (?eventId=3) or from
 * localStorage on the client side. Only an active (or cancelled) event is
 * returned; a suspended event responds 404 so it can never be displayed.
 * ------------------------------------------------------------------- */
router.get('/:id', async (req, res, next) => {
    try {
        const eventId = Number.parseInt(req.params.id, 10);

        if (Number.isNaN(eventId) || eventId < 1) {
            return res.status(400).json({
                success: false,
                message: `"${req.params.id}" is not a valid event id. Provide a positive integer, for example /api/events/3.`
            });
        }

        const sql = `
            ${BASE_SELECT}
            WHERE e.event_id = ? AND e.status IN (?, ?)
            LIMIT 1
        `;

        const rows = await query(sql, [eventId, ...PUBLIC_STATUSES]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No event was found with id ${eventId}. It may have been removed or suspended.`
            });
        }

        res.json({ success: true, data: mapEvent(rows[0]) });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
