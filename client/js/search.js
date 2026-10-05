/**
 * js/search.js
 * ---------------------------------------------------------------------
 * Search page behaviour.
 *
 * Requirements covered here:
 *   * an intuitive filtering form with the three criteria required by the
 *     brief - date, location and event category - using the input control
 *     that best suits each data type:
 *         date     -> date pickers plus quick "next 30 / 90 days" radios
 *         location -> text field with a datalist of known suburbs
 *         category -> drop-down loaded from GET /api/categories
 *   * one or several criteria can be combined
 *   * a "Clear filters" button that resets every field with DOM manipulation
 *   * submission calls  GET /api/events/search  and displays the matches
 *   * error messages are rendered with DOM manipulation
 *   * every result links to the Event detail page
 * ---------------------------------------------------------------------
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    /* ---------- element references ---------- */
    const form = document.getElementById('search-form');
    const messageArea = document.getElementById('search-message');
    const resultsContainer = document.getElementById('results-container');
    const resultsHeading = document.getElementById('results-heading');
    const resultsCount = document.getElementById('results-count');
    const activeFilters = document.getElementById('active-filters');
    const clearButton = document.getElementById('clear-filters');

    const dateFrom = document.getElementById('date-from');
    const dateTo = document.getElementById('date-to');
    const cityInput = document.getElementById('city');
    const categorySelect = document.getElementById('category');
    const categoryHint = document.getElementById('category-hint');
    const quickDateRadios = form.querySelectorAll('input[name="quickDate"]');
    const statusRadios = form.querySelectorAll('input[name="status"]');
    const filterPanel = document.querySelector('.filter-panel');

    highlightCurrentNavLink();
    initNavToggle();
    insertCurrentYear();
    holdPanelOnScreen();

    /**
     * Keeps the filter panel on screen while the user works through the form.
     *
     * The panel holds more fields than fit on a laptop screen, so moving to a
     * field near the bottom makes the browser scroll it into view. That scroll
     * also carries the sticky panel up and out of sight, taking the Search
     * button with it - so after changing the location the user had to scroll
     * back before they could search again.
     *
     * When a field inside the panel takes focus and the page has scrolled, the
     * scroll is simply undone, leaving the panel exactly where it was. The
     * field the user clicked is still focused, and the panel keeps its own
     * internal scrolling for anything that does not fit.
     */
    function holdPanelOnScreen() {
        if (!filterPanel) return;

        const fields = filterPanel.querySelectorAll('input, select, textarea');
        fields.forEach((field) => {
            field.addEventListener('focus', () => {
                const before = window.scrollY;
                if (before === 0) return;
                // undo whatever the browser scrolled in order to show the field
                window.requestAnimationFrame(() => {
                    if (window.scrollY !== before) window.scrollTo(0, before);
                });
            });
        });
    }

    /* =================================================================
       Helpers
       ================================================================= */

    /**
     * Returns today's date as YYYY-MM-DD (local time, not UTC).
     * @returns {string}
     */
    function todayIso() {
        const now = new Date();
        return [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0')
        ].join('-');
    }

    /**
     * Returns today's date plus n days as YYYY-MM-DD.
     * @param {number} days
     * @returns {string}
     */
    function isoDaysFromToday(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0')
        ].join('-');
    }

    /**
     * Reads the current criteria from the form fields.
     * @returns {{city: string, categoryId: string, dateFrom: string, dateTo: string, status: string}}
     */
    function readCriteria() {
        const checkedStatus = form.querySelector('input[name="status"]:checked');
        return {
            city: cityInput.value.trim(),
            categoryId: categorySelect.value,
            dateFrom: dateFrom.value,
            dateTo: dateTo.value,
            status: checkedStatus ? checkedStatus.value : 'upcoming'
        };
    }

    /**
     * Validates the criteria BEFORE calling the API, and marks the invalid
     * field with aria-invalid so the user can see what needs fixing.
     *
     * @param {object} criteria
     * @returns {string[]} list of problems (empty array = valid)
     */
    function validateCriteria(criteria) {
        const problems = [];
        [dateFrom, dateTo, cityInput].forEach((field) => field.setAttribute('aria-invalid', 'false'));

        if (criteria.dateFrom && criteria.dateTo && criteria.dateFrom > criteria.dateTo) {
            problems.push('The "From" date must be earlier than or the same as the "To" date.');
            dateFrom.setAttribute('aria-invalid', 'true');
            dateTo.setAttribute('aria-invalid', 'true');
        }

        if (criteria.city && criteria.city.length < 2) {
            problems.push('Please enter at least two characters for the location.');
            cityInput.setAttribute('aria-invalid', 'true');
        }

        if (criteria.city && !/^[A-Za-z\s'.-]+$/.test(criteria.city)) {
            problems.push('The location may only contain letters, spaces, hyphens and apostrophes.');
            cityInput.setAttribute('aria-invalid', 'true');
        }

        return problems;
    }

    /**
     * Describes the criteria currently applied, as chips under the heading.
     * @param {object} criteria
     * @param {Array<object>} categories
     */
    function renderActiveFilters(criteria, categories) {
        const chips = [];

        if (criteria.dateFrom || criteria.dateTo) {
            const from = criteria.dateFrom || 'any date';
            const to = criteria.dateTo || 'any date';
            chips.push(`📅 ${from} → ${to}`);
        }
        if (criteria.city) chips.push(`📍 ${criteria.city}`);
        if (criteria.categoryId) {
            const match = categories.find((category) => String(category.categoryId) === String(criteria.categoryId));
            chips.push(`🏷️ ${match ? match.categoryName : 'Category ' + criteria.categoryId}`);
        }
        if (criteria.status === 'past') chips.push('🕘 Past events only');
        if (criteria.status === 'all') chips.push('📚 Including past events');

        activeFilters.innerHTML = chips
            .map((chip) => `<span class="filter-chip">${escapeHtml(chip)}</span>`)
            .join('');
        activeFilters.hidden = chips.length === 0;
    }

    /**
     * Copies the criteria into the page URL so a filtered search can be
     * bookmarked or shared.
     * @param {object} criteria
     */
    function syncUrlWithCriteria(criteria) {
        const params = new URLSearchParams();
        if (criteria.city) params.set('city', criteria.city);
        if (criteria.categoryId) params.set('categoryId', criteria.categoryId);
        if (criteria.dateFrom) params.set('dateFrom', criteria.dateFrom);
        if (criteria.dateTo) params.set('dateTo', criteria.dateTo);
        if (criteria.status && criteria.status !== 'upcoming') params.set('status', criteria.status);

        const query = params.toString();
        window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
    }

    /* =================================================================
       1. Category drop-down -> GET /api/categories
       ================================================================= */
    let categories = [];

    async function loadCategories() {
        try {
            const response = await API.getCategories();
            categories = response.data || [];

            categorySelect.innerHTML = '<option value="">All categories</option>' +
                categories.map((category) => {
                    const countLabel = category.eventCount === undefined ? '' : ` (${category.eventCount})`;
                    return `<option value="${escapeHtml(category.categoryId)}">${escapeHtml(category.categoryName)}${countLabel}</option>`;
                }).join('');

            categoryHint.textContent = `${categories.length} categories available · loaded from GET /api/categories`;
        } catch (error) {
            categoryHint.textContent = 'Categories could not be loaded - you can still search by date and location.';
            showMessage(messageArea, error.message, {
                type: 'warning',
                title: 'Category filter unavailable.'
            });
        }
    }

    /* =================================================================
       2. Run a search -> GET /api/events/search
       ================================================================= */
    async function runSearch(criteria) {
        clearMessages(messageArea);

        const problems = validateCriteria(criteria);
        if (problems.length) {
            showMessage(messageArea, 'Please correct the highlighted fields and search again.', {
                type: 'error',
                title: 'Check your search criteria.',
                list: problems
            });
            return;
        }

        showLoading(resultsContainer, 'Searching events…', 3);
        resultsCount.textContent = '';

        try {
            const response = await API.searchEvents({
                city: criteria.city,
                categoryId: criteria.categoryId,
                dateFrom: criteria.dateFrom,
                dateTo: criteria.dateTo,
                status: criteria.status
            });

            const events = response.data || [];

            resetGrid(resultsContainer);

            if (events.length === 0) {
                showEmpty(resultsContainer,
                    'No charity events match the criteria you selected. Try widening the date range, choosing a different location, or clearing a filter.',
                    {
                        heading: 'No matching events',
                        icon: '🔍',
                        actionLabel: 'Clear all filters',
                        onAction: () => clearFilters()
                    });
                resultsHeading.textContent = 'Search results';
                resultsCount.textContent = '0 events found';
                renderActiveFilters(criteria, categories);
                return;
            }

            insertEventCards(resultsContainer, events);

            resultsHeading.textContent = 'Search results';
            resultsCount.textContent = `${events.length} event${events.length === 1 ? '' : 's'} found`;
            renderActiveFilters(criteria, categories);
        } catch (error) {
            resetGrid(resultsContainer);
            resultsContainer.innerHTML = '';
            showMessage(messageArea, error.message, {
                type: 'error',
                title: 'The search could not be completed.',
                list: error.details
            });
            resultsCount.textContent = '';
            showEmpty(resultsContainer, 'Search results are unavailable right now.', {
                heading: 'Something went wrong',
                icon: '⚠️',
                actionLabel: 'Try again',
                onAction: () => runSearch(readCriteria())
            });
        }
    }

    /* =================================================================
       3. Load the default listing when the page opens
          GET /api/events?status=upcoming
       ================================================================= */
    async function loadDefaultListing() {
        showLoading(resultsContainer, 'Loading upcoming events…', 3);

        try {
            const response = await API.getEvents({ status: 'upcoming' });
            const events = response.data || [];

            resetGrid(resultsContainer);

            if (events.length === 0) {
                showEmpty(resultsContainer, 'There are no upcoming events at the moment.', { heading: 'No upcoming events' });
                resultsCount.textContent = '0 events found';
                return;
            }

            insertEventCards(resultsContainer, events);
            resultsHeading.textContent = 'Upcoming events';
            resultsCount.textContent = `${events.length} event${events.length === 1 ? '' : 's'} available — use the filters to narrow them down`;
            activeFilters.hidden = true;
        } catch (error) {
            resetGrid(resultsContainer);
            resultsContainer.innerHTML = '';
            showMessage(messageArea, error.message, { type: 'error', title: 'Could not load events.' });
        }
    }

    /* =================================================================
       4. Clear filters - basic DOM manipulation, required by the brief
       ================================================================= */
    function clearFilters() {
        // Reset every input back to its default value.
        dateFrom.value = '';
        dateTo.value = '';
        cityInput.value = '';
        categorySelect.value = '';
        cityInput.setAttribute('aria-invalid', 'false');
        dateFrom.setAttribute('aria-invalid', 'false');
        dateTo.setAttribute('aria-invalid', 'false');

        // Put the quick-date choice and time frame back to their defaults.
        quickDateRadios.forEach((radio) => { radio.checked = radio.value === 'anytime'; });
        statusRadios.forEach((radio) => { radio.checked = radio.value === 'upcoming'; });

        // Clear the messages and the URL query string, then reload the list.
        clearMessages(messageArea);
        activeFilters.innerHTML = '';
        activeFilters.hidden = true;
        window.history.replaceState(null, '', window.location.pathname);

        loadDefaultListing();
        cityInput.focus();
    }

    /* =================================================================
       5. Event listeners
       ================================================================= */

    // Quick date radios fill the date fields.
    quickDateRadios.forEach((radio) => {
        radio.addEventListener('change', () => {
            if (!radio.checked) return;

            if (radio.value === 'anytime') {
                dateFrom.value = '';
                dateTo.value = '';
            } else if (radio.value === 'next30') {
                dateFrom.value = todayIso();
                dateTo.value = isoDaysFromToday(30);
            } else if (radio.value === 'next90') {
                dateFrom.value = todayIso();
                dateTo.value = isoDaysFromToday(90);
            }
        });
    });

    // Typing a custom date switches the quick options back to "Anytime"
    // so the form never holds two contradicting date settings.
    [dateFrom, dateTo].forEach((field) => {
        field.addEventListener('change', () => {
            quickDateRadios.forEach((radio) => { radio.checked = radio.value === 'anytime'; });
        });
    });

    // Submit the form -> call the API.
    form.addEventListener('submit', (event) => {
        // Stop the browser from reloading the page so the search can be
        // performed with fetch() and the DOM.
        event.preventDefault();

        const criteria = readCriteria();
        syncUrlWithCriteria(criteria);
        runSearch(criteria);
    });

    // The reset button is handled entirely in JavaScript (DOM manipulation).
    clearButton.addEventListener('click', clearFilters);

    /* =================================================================
       6. Start-up: read any criteria already in the URL, then act
       ================================================================= */
    async function init() {
        await loadCategories();

        const params = new URLSearchParams(window.location.search);

        // Coming from a category "quick search" link on another page?
        if (params.toString() !== '') {
            if (params.get('city')) cityInput.value = params.get('city');
            if (params.get('dateFrom')) dateFrom.value = params.get('dateFrom');
            if (params.get('dateTo')) dateTo.value = params.get('dateTo');
            if (params.get('categoryId')) categorySelect.value = params.get('categoryId');
            if (params.get('status')) {
                statusRadios.forEach((radio) => { radio.checked = radio.value === params.get('status'); });
            }

            const criteria = readCriteria();
            resultsHeading.textContent = 'Search results';
            renderActiveFilters(criteria, categories);
            await runSearch(criteria);
            return;
        }

        await loadDefaultListing();
    }

    init();
});
