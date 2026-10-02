/**
 * utils/eventMapper.js
 * ---------------------------------------------------------------------
 * Turns raw MySQL rows into the JSON shape that the client-side website
 * consumes. Keeping this in one place means the Home, Search and Event
 * Detail endpoints all return exactly the same event object, so the
 * front-end only needs one rendering function.
 *
 * IMPORTANT CONCEPT FOR THE REPORT
 * The "display_status" field is calculated on the SERVER, not in the
 * browser: an event is 'past' when its date is before today, otherwise
 * it is 'upcoming'. Suspended events are filtered out by the SQL layer
 * and never reach the public website.
 * ---------------------------------------------------------------------
 */

'use strict';

const {
    toDateString,
    classifyEvent,
    daysUntil,
    formatDate,
    formatTime,
    progressPercent
} = require('./dateUtils');

/**
 * Maps one event row to a public API event object.
 *
 * @param {object} row Row from the events table joined with categories and organisations.
 * @returns {object}
 */
function mapEvent(row) {
    const ticketPrice = Number(row.ticket_price) || 0;
    const isFree = Boolean(row.is_free) || ticketPrice === 0;
    const raised = Number(row.raised_amount) || 0;
    const goal = Number(row.goal_amount) || 0;

    return {
        eventId: row.event_id,
        eventName: row.event_name,
        shortSummary: row.short_summary,
        fullDescription: row.full_description,
        purpose: row.purpose,

        category: {
            categoryId: row.category_id,
            categoryName: row.category_name
        },
        organisation: {
            organisationId: row.organisation_id,
            name: row.organisation_name,
            missionStatement: row.mission_statement,
            email: row.organisation_email,
            phone: row.organisation_phone,
            website: row.organisation_website
        },

        date: {
            isoDate: toDateString(row.event_date),
            displayDate: formatDate(row.event_date),
            startTime: formatTime(row.start_time),
            endTime: formatTime(row.end_time)
        },
        displayStatus: classifyEvent(row.event_date),
        daysUntil: daysUntil(row.event_date),

        location: {
            venue: row.location_name,
            address: row.address,
            suburb: row.suburb,
            city: row.city,
            full: `${row.location_name}, ${row.suburb} ${row.city}`
        },

        ticket: {
            price: ticketPrice,
            isFree,
            priceLabel: isFree ? 'Free entry' : `$${ticketPrice.toFixed(2)}`,
            capacity: Number(row.capacity) || 0
        },

        goal: {
            amount: goal,
            raised: raised,
            progressPercent: progressPercent(raised, goal),
            remaining: Math.max(0, goal - raised)
        },

        imageUrl: row.image_url,
        status: row.status
    };
}

/**
 * Maps an array of event rows.
 *
 * @param {Array<object>} rows
 * @returns {Array<object>}
 */
function mapEvents(rows) {
    return rows.map(mapEvent);
}

/**
 * Builds a small category object for the /api/categories endpoint.
 *
 * @param {object} row
 * @returns {object}
 */
function mapCategory(row) {
    return {
        categoryId: row.category_id,
        categoryName: row.category_name,
        description: row.description,
        eventCount: row.event_count === undefined ? undefined : Number(row.event_count)
    };
}

module.exports = { mapEvent, mapEvents, mapCategory };
