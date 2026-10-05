/**
 * js/api.js
 * ---------------------------------------------------------------------
 * The single place where the client-side website talks to the REST API
 * (Part 2 of the assessment).
 *
 * Everything here is built on the browser Fetch API and Promises:
 *
 *   API.get('/api/events')
 *        .then(response => render(response.data))
 *        .catch(showError);
 *
 * or, with async/await (used by the page scripts):
 *
 *   const response = await API.get('/api/events');
 *
 * The API keeps a single consistent response envelope:
 *   { success: true,  count: n, data: [...] }
 *   { success: false, message: '...', errors: [...] }
 * ---------------------------------------------------------------------
 */

'use strict';

const API = (() => {
    /**
     * Base URL of the API.
     * When the website is served by the Express server in api/server.js the
     * API is on the same origin, so a relative path is enough. If the pages
     * are opened some other way, fall back to the local API address.
     */
    const BASE_URL = (window.location.protocol === 'file:' || window.location.port === '')
        ? 'http://localhost:3000'
        : window.location.origin;

    /**
     * Error type that carries the HTTP status so callers can react to a
     * 404 (event not found) differently from a 500.
     */
    class ApiError extends Error {
        constructor(message, status, details) {
            super(message);
            this.name = 'ApiError';
            this.status = status;
            this.details = details || [];
        }
    }

    /**
     * Turns a plain object into a query string, skipping empty values so we
     * never send "?city=&categoryId=" to the server.
     *
     * @param {object} params
     * @returns {string} e.g. "?city=Sydney&categoryId=2"
     */
    function buildQueryString(params = {}) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            if (typeof value === 'string' && value.trim() === '') return;
            searchParams.append(key, value);
        });
        const query = searchParams.toString();
        return query ? `?${query}` : '';
    }

    /**
     * Core request helper.
     *
     * @param {string} path    API path beginning with "/api/".
     * @param {object} options Optional fetch options.
     * @returns {Promise<object>} Parsed JSON response body.
     * @throws {ApiError} When the network fails or the server returns >= 400.
     */
    async function request(path, options = {}) {
        const url = `${BASE_URL}${path}`;

        let response;
        try {
            // Promise-based fetch: await resolves once the response headers
            // arrive, then we await the JSON body below.
            response = await fetch(url, {
                headers: { Accept: 'application/json' },
                ...options
            });
        } catch (networkError) {
            throw new ApiError(
                'Could not reach the API server. Make sure it is running (node server.js in the api folder) and try again.',
                0
            );
        }

        let body = null;
        try {
            body = await response.json();
        } catch (parseError) {
            body = null;
        }

        if (!response.ok) {
            throw new ApiError(
                (body && body.message) || `The API returned an error (HTTP ${response.status}).`,
                response.status,
                (body && body.errors) || []
            );
        }

        return body;
    }

    /* ---- Public, endpoint-specific helpers ---- */

    return {
        BASE_URL,
        ApiError,
        buildQueryString,
        request,

        /** GET /api/health */
        health: () => request('/api/health'),

        /**
         * GET /api/events
         * @param {{status?: string, limit?: number}} [params]
         */
        getEvents: (params = {}) => request(`/api/events${buildQueryString(params)}`),

        /**
         * GET /api/events/search
         * @param {{city?: string, categoryId?: number|string, dateFrom?: string, dateTo?: string, status?: string}} criteria
         */
        searchEvents: (criteria = {}) => request(`/api/events/search${buildQueryString(criteria)}`),

        /**
         * GET /api/events/:id
         * @param {number|string} eventId
         */
        getEventById: (eventId) => request(`/api/events/${encodeURIComponent(eventId)}`),

        /** GET /api/categories */
        getCategories: () => request('/api/categories'),

        /** GET /api/organisations */
        getOrganisations: () => request('/api/organisations')
    };
})();
