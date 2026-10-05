/**
 * js/ui.js
 * ---------------------------------------------------------------------
 * Shared DOM helpers used by all three pages.
 *
 * Everything in this file is plain JavaScript + DOM manipulation, as the
 * assessment requires (no frameworks, no AngularJS):
 *
 *   escapeHtml()        - safety when inserting API text into HTML
 *   renderEventCard()   - one reusable event summary card
 *   insertEventCards()  - renders a whole list into a container
 *   showMessage()       - error / success / info message via DOM
 *   showLoading()       - loading placeholder
 *   showEmpty()         - "no results" placeholder
 *   openModal()/closeModal() - the "under construction" dialog
 *   buildEventUrl()     - passes the event id between pages
 * ---------------------------------------------------------------------
 */

'use strict';

/* =====================================================================
   Escaping
   ===================================================================== */

/**
 * Escapes text that came from the database before it is written into
 * innerHTML, so an event description containing "<" cannot break the page.
 *
 * @param {*} value
 * @returns {string}
 */
function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* =====================================================================
   Formatting helpers
   ===================================================================== */

/**
 * Formats a number as Australian dollars, e.g. 28450 -> "$28,450".
 *
 * @param {number} amount
 * @returns {string}
 */
function formatMoney(amount) {
    const value = Number(amount) || 0;
    return value.toLocaleString('en-AU', {
        style: 'currency',
        currency: 'AUD',
        minimumFractionDigits: value % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2
    });
}

/**
 * Returns a short countdown label for an upcoming event.
 *
 * @param {number} days
 * @returns {string}
 */
function countdownLabel(days) {
    const value = Number(days);
    if (Number.isNaN(value)) return '';
    if (value === 0) return 'Happening today';
    if (value === 1) return 'Tomorrow';
    if (value < 0) return `${Math.abs(value)} days ago`;
    if (value < 14) return `In ${value} days`;
    const weeks = Math.round(value / 7);
    return `In about ${weeks} week${weeks === 1 ? '' : 's'}`;
}

/* =====================================================================
   Event cards
   ===================================================================== */

/**
 * Builds the URL of the Event detail page for one event.
 *
 * THE ASSESSMENT REQUIRES the event id to be passed between pages using a
 * URL query string or localStorage, so we do BOTH:
 *   * the query string makes the page shareable and bookmarkable, and
 *   * localStorage lets the detail page still work if the id is missing.
 *
 * @param {object} event Event object returned by the API.
 * @returns {string} e.g. "event.html?eventId=3"
 */
function buildEventUrl(event) {
    const eventId = event && (event.eventId || event.event_id);
    return `event.html?eventId=${encodeURIComponent(eventId)}`;
}

/**
 * Renders one event as a summary card (HTML string).
 * Shared by the Home page and the Search page so both look identical.
 *
 * @param {object} event Event object returned by the API.
 * @param {{showGoal?: boolean}} [options]
 * @returns {string} HTML string
 */
function renderEventCard(event, options = {}) {
    const showGoal = options.showGoal !== false;
    const isPast = event.displayStatus === 'past';
    const detailUrl = buildEventUrl(event);

    const statusBadge = isPast
        ? '<span class="badge badge--past">Past event</span>'
        : `<span class="badge badge--upcoming">${escapeHtml(countdownLabel(event.daysUntil) || 'Upcoming')}</span>`;

    const freeBadge = event.ticket.isFree
        ? '<span class="badge badge--free">Free</span>'
        : '';

    const priceClass = event.ticket.isFree ? 'price-tag price-tag--free' : 'price-tag';

    const goalBlock = showGoal && event.goal.amount > 0
        ? `
            <div class="progress">
                <div class="progress__head">
                    <span>Fundraising progress</span>
                    <strong>${event.goal.progressPercent}%</strong>
                </div>
                <div class="progress__track">
                    <div class="progress__fill" style="width: ${event.goal.progressPercent}%"></div>
                </div>
            </div>`
        : '';

    return `
        <article class="event-card" data-event-id="${escapeHtml(event.eventId)}">
            <div class="event-card__media">
                <img src="${escapeHtml(event.imageUrl || 'assets/images/hero-home.svg')}"
                     alt="${escapeHtml(event.eventName)}"
                     loading="lazy">
                ${statusBadge}
            </div>
            <div class="event-card__body">
                <h3 class="event-card__title">
                    <a href="${detailUrl}">${escapeHtml(event.eventName)}</a>
                </h3>
                <p class="event-card__summary">${escapeHtml(event.shortSummary)}</p>

                <ul class="event-card__meta">
                    <li><span class="icon" aria-hidden="true">📅</span>
                        <span>${escapeHtml(event.date.displayDate)} · ${escapeHtml(event.date.startTime)}</span></li>
                    <li><span class="icon" aria-hidden="true">📍</span>
                        <span>${escapeHtml(event.location.venue)}, ${escapeHtml(event.location.suburb)}</span></li>
                    <li><span class="icon" aria-hidden="true">🏷️</span>
                        <span>${escapeHtml(event.category.categoryName)} ${freeBadge}</span></li>
                </ul>

                ${goalBlock}

                <div class="event-card__footer">
                    <span class="${priceClass}">${escapeHtml(event.ticket.priceLabel)}</span>
                    <a class="btn btn--secondary" href="${detailUrl}">
                        View details <span aria-hidden="true">→</span>
                    </a>
                </div>
            </div>
        </article>
    `;
}

/**
 * Renders a list of events into a container element using DOM APIs.
 *
 * @param {HTMLElement} container
 * @param {Array<object>} events
 * @param {{showGoal?: boolean, emptyMessage?: string}} [options]
 */
function insertEventCards(container, events, options = {}) {
    if (!container) return;

    if (!Array.isArray(events) || events.length === 0) {
        showEmpty(container, options.emptyMessage || 'No events to show yet.');
        return;
    }

    // Build the markup, then write it once - one reflow instead of many.
    container.innerHTML = events.map((event) => renderEventCard(event, options)).join('');
}

/* =====================================================================
   Page-state helpers (basic DOM manipulation)
   ===================================================================== */

/**
 * Displays a message box (error / success / info / warning) inside a
 * container element using DOM manipulation.
 *
 * @param {HTMLElement} container
 * @param {string} text
 * @param {{type?: 'error'|'success'|'info'|'warning', title?: string, list?: string[]}} [options]
 */
function showMessage(container, text, options = {}) {
    if (!container) return;

    const type = options.type || 'info';
    const icons = { error: '⚠️', success: '✅', info: 'ℹ️', warning: '🔔' };

    container.innerHTML = '';
    container.hidden = false;

    const box = document.createElement('div');
    box.className = `message message--${type}`;
    box.setAttribute('role', type === 'error' ? 'alert' : 'status');

    const icon = document.createElement('span');
    icon.className = 'message__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = icons[type] || icons.info;
    box.appendChild(icon);

    const body = document.createElement('div');

    if (options.title) {
        const strong = document.createElement('strong');
        strong.textContent = options.title;
        body.appendChild(strong);
        body.appendChild(document.createElement('br'));
    }

    const paragraph = document.createElement('span');
    paragraph.textContent = text;
    body.appendChild(paragraph);

    if (Array.isArray(options.list) && options.list.length) {
        const ul = document.createElement('ul');
        options.list.forEach((item) => {
            const li = document.createElement('li');
            li.textContent = item;
            ul.appendChild(li);
        });
        body.appendChild(ul);
    }

    box.appendChild(body);
    container.appendChild(box);
}

/**
 * Clears a message container.
 *
 * @param {HTMLElement} container
 */
function clearMessages(container) {
    if (!container) return;
    container.innerHTML = '';
    container.hidden = true;
}

/**
 * Shows a loading placeholder while an API request is in flight.
 *
 * @param {HTMLElement} container
 * @param {string} [message]
 * @param {number} [skeletonCount]  When > 0, skeleton cards are shown instead.
 */
function showLoading(container, message = 'Loading events…', skeletonCount = 0) {
    if (!container) return;
    container.hidden = false;

    if (skeletonCount > 0) {
        let cards = '';
        for (let i = 0; i < skeletonCount; i += 1) {
            cards += `
                <div class="skeleton" aria-hidden="true">
                    <div class="skeleton__media"></div>
                    <div class="skeleton__line skeleton__line--mid"></div>
                    <div class="skeleton__line"></div>
                    <div class="skeleton__line skeleton__line--short"></div>
                </div>`;
        }
        container.className = 'skeleton-grid';
        container.innerHTML = cards;
    } else {
        container.className = 'event-grid';
        container.innerHTML = `
            <div class="loading-state" role="status" aria-live="polite">
                <span class="spinner" aria-hidden="true"></span>
                <span>${escapeHtml(message)}</span>
            </div>`;
    }
}

/**
 * Shows an empty-state panel, optionally with a call-to-action button.
 *
 * @param {HTMLElement} container
 * @param {string} message
 * @param {{heading?: string, icon?: string, actionLabel?: string, onAction?: Function}} [options]
 */
function showEmpty(container, message, options = {}) {
    if (!container) return;
    container.className = 'event-grid';
    container.hidden = false;

    const icon = options.icon || '🗓️';
    const heading = options.heading || 'Nothing to show here';

    container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
            <span class="empty-state__icon" aria-hidden="true">${icon}</span>
            <h3>${escapeHtml(heading)}</h3>
            <p>${escapeHtml(message)}</p>
            ${options.actionLabel ? `<button type="button" class="btn btn--primary" id="empty-state-action">${escapeHtml(options.actionLabel)}</button>` : ''}
        </div>`;

    if (options.actionLabel && typeof options.onAction === 'function') {
        const button = container.querySelector('#empty-state-action');
        if (button) button.addEventListener('click', options.onAction);
    }
}

/**
 * Sets a container back to the standard event grid class.
 *
 * @param {HTMLElement} container
 */
function resetGrid(container) {
    if (container) container.className = 'event-grid';
}

/* =====================================================================
   Modal dialog
   ===================================================================== */

/**
 * Opens a modal dialog by adding a class (CSS handles the animation) and
 * moves keyboard focus inside it.
 *
 * @param {HTMLElement} modal
 * @param {HTMLElement} [focusTarget]
 */
function openModal(modal, focusTarget) {
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const target = focusTarget || modal.querySelector('button, [href], input');
    if (target) target.focus();
}

/**
 * Closes a modal dialog.
 *
 * @param {HTMLElement} modal
 * @param {HTMLElement} [returnFocusTo]
 */
function closeModal(modal, returnFocusTo) {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (returnFocusTo) returnFocusTo.focus();
}

/**
 * Wires up a modal: close button, backdrop click and the Escape key.
 *
 * @param {HTMLElement} modal
 * @param {HTMLElement} [returnFocusTo]
 */
function initModal(modal, returnFocusTo) {
    if (!modal) return;

    modal.querySelectorAll('[data-modal-close], .modal-backdrop').forEach((element) => {
        element.addEventListener('click', () => closeModal(modal, returnFocusTo));
    });

    modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal(modal, returnFocusTo);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('is-open')) {
            closeModal(modal, returnFocusTo);
        }
    });
}

/* =====================================================================
   Navigation
   ===================================================================== */

/**
 * Marks the link of the page we are currently on with aria-current so the
 * user can see where they are (used by the shared navigation menu).
 */
function highlightCurrentNavLink() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.main-nav a').forEach((link) => {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('http')) return;
        if (href === current) link.setAttribute('aria-current', 'page');
    });
}

/**
 * Mobile navigation toggle (progressive enhancement: the menu is visible
 * by default on desktop).
 */
function initNavToggle() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('primary-navigation');
    if (!toggle || !nav) return;

    const isSmallScreen = () => window.matchMedia('(max-width: 760px)').matches;
    if (isSmallScreen()) nav.hidden = true;

    toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        nav.hidden = expanded;
    });

    window.addEventListener('resize', () => {
        if (!isSmallScreen()) {
            nav.hidden = false;
            toggle.setAttribute('aria-expanded', 'false');
        }
    });
}

/* =====================================================================
   Small shared widgets
   ===================================================================== */

/**
 * Reads the "eventId" value from the page URL query string.
 * This is how the id is passed from the Home / Search pages.
 *
 * @returns {string|null}
 */
function getEventIdFromQueryString() {
    const params = new URLSearchParams(window.location.search);
    const value = params.get('eventId');
    return value && value.trim() !== '' ? value.trim() : null;
}

/**
 * Falls back to localStorage when the query string has no event id, which
 * covers the second method allowed by the brief.
 *
 * @param {number|string} eventId
 */
function rememberEventId(eventId) {
    try {
        window.localStorage.setItem('charityEvents.lastViewedEventId', String(eventId));
    } catch (error) {
        /* localStorage can be blocked in private browsing - the query
           string still works, so this failure is not fatal. */
    }
}

/**
 * @returns {string|null}
 */
function getRememberedEventId() {
    try {
        return window.localStorage.getItem('charityEvents.lastViewedEventId');
    } catch (error) {
        return null;
    }
}

/**
 * Writes the current year into any element marked with data-current-year.
 */
function insertCurrentYear() {
    document.querySelectorAll('[data-current-year]').forEach((element) => {
        element.textContent = String(new Date().getFullYear());
    });
}
