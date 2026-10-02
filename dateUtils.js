/**
 * utils/dateUtils.js
 * ---------------------------------------------------------------------
 * Shared date helpers.
 *
 * The Home page has to mark every event as "past" or "upcoming" based on
 * the event date and the current date, and the Search page filters by
 * date. All of that logic lives here as small, testable functions.
 * ---------------------------------------------------------------------
 */

'use strict';

/**
 * Returns today's date as a "YYYY-MM-DD" string in local time.
 * (toISOString() would convert to UTC and could shift the date by a day.)
 *
 * @returns {string}
 */
function todayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Converts a MySQL DATE value (string or Date) into "YYYY-MM-DD".
 *
 * @param {string|Date} value
 * @returns {string}
 */
function toDateString(value) {
    if (value instanceof Date) {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    return String(value).slice(0, 10);
}

/**
 * Classifies an event as "upcoming" or "past".
 * An event happening today counts as upcoming.
 *
 * @param {string|Date} eventDate
 * @returns {'upcoming'|'past'}
 */
function classifyEvent(eventDate) {
    return toDateString(eventDate) >= todayString() ? 'upcoming' : 'past';
}

/**
 * Whole days between today and the event date.
 * Positive = in the future, 0 = today, negative = in the past.
 *
 * @param {string|Date} eventDate
 * @returns {number}
 */
function daysUntil(eventDate) {
    const target = new Date(`${toDateString(eventDate)}T00:00:00`);
    const today = new Date(`${todayString()}T00:00:00`);
    return Math.round((target - today) / 86400000);
}

/**
 * Human-friendly date, e.g. "Sun 12 Oct 2025".
 *
 * @param {string|Date} eventDate
 * @returns {string}
 */
function formatDate(eventDate) {
    const date = new Date(`${toDateString(eventDate)}T00:00:00`);
    return date.toLocaleDateString('en-AU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

/**
 * Trims "HH:MM:SS" to "HH:MM" and converts to 12-hour time, e.g. "4:30 pm".
 *
 * @param {string} time
 * @returns {string}
 */
function formatTime(time) {
    if (!time) return '';
    const [hoursRaw, minutes] = String(time).split(':');
    const hours = Number(hoursRaw);
    const suffix = hours >= 12 ? 'pm' : 'am';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHour}:${minutes} ${suffix}`;
}

/**
 * Percentage of the fundraising goal that has been raised, capped at 100
 * so the progress bar never overflows.
 *
 * @param {number} raised
 * @param {number} goal
 * @returns {number} integer 0-100
 */
function progressPercent(raised, goal) {
    const raisedAmount = Number(raised) || 0;
    const goalAmount = Number(goal) || 0;
    if (goalAmount <= 0) return 0;
    return Math.min(100, Math.round((raisedAmount / goalAmount) * 100));
}

/**
 * Validates a "YYYY-MM-DD" string coming from a query string.
 * Returns the string when valid, otherwise null.
 *
 * @param {string} value
 * @returns {string|null}
 */
function isValidDateParam(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return null;
    return toDateString(parsed) === value ? value : null;
}

module.exports = {
    todayString,
    toDateString,
    classifyEvent,
    daysUntil,
    formatDate,
    formatTime,
    progressPercent,
    isValidDateParam
};
