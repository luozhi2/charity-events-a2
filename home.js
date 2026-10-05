/**
 * js/home.js
 * ---------------------------------------------------------------------
 * Home page behaviour.
 *
 * What this script does (all data comes from the REST API):
 *   1. GET /api/events            -> upcoming, active events for the listing
 *   2. GET /api/categories        -> category count + categories used
 *   3. GET /api/organisations     -> the organisations panel and hero figures
 *   4. "Show past events" button  -> loads GET /api/events?status=past
 *
 * Suspended events never appear because the API excludes them, which is
 * the "suspend events that violate the policy" requirement from the brief.
 * ---------------------------------------------------------------------
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    /* ---------- element references ---------- */
    const eventsContainer = document.getElementById('events-container');
    const eventsMessage = document.getElementById('events-message');
    const organisationsContainer = document.getElementById('organisations-container');
    const organisationsMessage = document.getElementById('organisations-message');
    const togglePastButton = document.getElementById('toggle-past-events');

    const heroStats = document.getElementById('hero-stats');
    const statUpcoming = document.getElementById('stat-upcoming');
    const statCategories = document.getElementById('stat-categories');
    const statOrganisations = document.getElementById('stat-organisations');
    const statRaised = document.getElementById('stat-raised');

    let pastEventsVisible = false;
    let upcomingEvents = [];
    let pastEvents = [];

    highlightCurrentNavLink();
    initNavToggle();
    insertCurrentYear();

    /* =================================================================
       1. Upcoming events  ->  GET /api/events
       ================================================================= */
    async function loadUpcomingEvents() {
        resetGrid(eventsContainer);
        showLoading(eventsContainer, 'Loading upcoming events…', 3);

        try {
            const response = await API.getEvents({ status: 'upcoming' });
            upcomingEvents = response.data || [];

            if (upcomingEvents.length === 0) {
                showEmpty(eventsContainer,
                    'There are no upcoming events at the moment. Please check back soon or search past events.',
                    {
                        heading: 'No upcoming events',
                        actionLabel: 'Search all events',
                        onAction: () => { window.location.href = 'search.html'; }
                    });
                return;
            }

            insertEventCards(eventsContainer, upcomingEvents);
            updateHeroRaised(upcomingEvents);
        } catch (error) {
            resetGrid(eventsContainer);
            eventsContainer.innerHTML = '';
            showMessage(eventsMessage, error.message, {
                type: 'error',
                title: 'Could not load the event list.',
                list: error.details
            });
            showEmpty(eventsContainer, 'The event list is unavailable right now.', {
                heading: 'Something went wrong',
                icon: '⚠️',
                actionLabel: 'Try again',
                onAction: () => { clearMessages(eventsMessage); loadUpcomingEvents(); }
            });
        }
    }

    /* =================================================================
       2. Past events -> GET /api/events?status=past (toggled by the user)
       ================================================================= */
    async function loadPastEvents() {
        resetGrid(eventsContainer);
        showLoading(eventsContainer, 'Loading past events…', 3);

        try {
            const response = await API.getEvents({ status: 'past' });
            pastEvents = response.data || [];
            renderCombinedListing();
        } catch (error) {
            renderCombinedListing();
            showMessage(eventsMessage, error.message, {
                type: 'error',
                title: 'Could not load past events.'
            });
        }
    }

    /**
     * Renders upcoming events, plus the past events section when the user
     * has asked to see them.
     */
    function renderCombinedListing() {
        resetGrid(eventsContainer);

        const upcomingHtml = upcomingEvents.map((event) => renderEventCard(event)).join('');

        if (!pastEventsVisible) {
            eventsContainer.innerHTML = upcomingHtml;
            return;
        }

        const pastHtml = pastEvents.length
            ? pastEvents.map((event) => renderEventCard(event)).join('')
            : '<div class="empty-state" style="grid-column:1/-1;"><h3>No past events</h3><p>Past events will appear here once an event date has passed.</p></div>';

        eventsContainer.innerHTML = `
            ${upcomingHtml}
            <div style="grid-column: 1 / -1; margin-top: 18px;">
                <h2 style="margin-bottom:.2em;">Past events</h2>
                <p class="text-muted" style="margin:0;">
                    These events have already taken place and are marked as <strong>past</strong>
                    automatically by comparing the event date with today's date.
                </p>
            </div>
            ${pastHtml}
        `;
    }

    if (togglePastButton) {
        togglePastButton.addEventListener('click', async () => {
            pastEventsVisible = !pastEventsVisible;
            togglePastButton.setAttribute('aria-expanded', String(pastEventsVisible));
            togglePastButton.textContent = pastEventsVisible ? 'Hide past events' : 'Show past events';
            clearMessages(eventsMessage);

            if (pastEventsVisible && pastEvents.length === 0) {
                await loadPastEvents();
            } else {
                renderCombinedListing();
            }
        });
    }

    /* =================================================================
       3. Hero statistics - derived from the API data already loaded
       ================================================================= */
    function updateHeroRaised(events) {
        const totalRaised = events.reduce((sum, event) => sum + (event.goal.raised || 0), 0);
        if (statRaised) statRaised.textContent = formatMoney(totalRaised);
    }

    async function loadSummaryFigures() {
        try {
            // Promise.all runs the three requests in parallel instead of
            // waiting for each one in turn.
            const [eventsResponse, categoriesResponse, organisationsResponse] = await Promise.all([
                API.getEvents({ status: 'upcoming' }),
                API.getCategories(),
                API.getOrganisations()
            ]);

            if (statUpcoming) statUpcoming.textContent = String(eventsResponse.count ?? (eventsResponse.data || []).length);
            if (statCategories) statCategories.textContent = String(categoriesResponse.count ?? (categoriesResponse.data || []).length);
            if (statOrganisations) statOrganisations.textContent = String(organisationsResponse.count ?? (organisationsResponse.data || []).length);
            if (heroStats) heroStats.hidden = false;

            renderOrganisations(organisationsResponse.data || []);
        } catch (error) {
            showMessage(organisationsMessage, error.message, {
                type: 'warning',
                title: 'Organisation details are unavailable.'
            });
        }
    }

    /* =================================================================
       4. Organisations panel -> GET /api/organisations
       ================================================================= */
    function renderOrganisations(organisations) {
        if (!organisationsContainer) return;

        if (organisations.length === 0) {
            showEmpty(organisationsContainer, 'No organisations are registered yet.', { heading: 'No organisations' });
            return;
        }

        organisationsContainer.innerHTML = organisations.map((organisation) => `
            <article class="card" style="margin:0;">
                <div class="org-card">
                    <div class="org-card__head">
                        <img class="org-card__logo"
                             src="${escapeHtml(organisation.logoUrl || 'assets/images/logo-harbour-lights.svg')}"
                             alt="${escapeHtml(organisation.name)} logo">
                        <div>
                            <h3 style="margin-bottom:.15em;">${escapeHtml(organisation.name)}</h3>
                            <span class="badge badge--category">
                                ${organisation.upcomingEventCount} upcoming event${organisation.upcomingEventCount === 1 ? '' : 's'}
                            </span>
                        </div>
                    </div>
                    <p class="text-muted" style="margin:0;"><em>${escapeHtml(organisation.missionStatement)}</em></p>
                    <ul class="org-card__contact">
                        <li>📧 <a href="mailto:${escapeHtml(organisation.email)}">${escapeHtml(organisation.email)}</a></li>
                        <li>📞 ${escapeHtml(organisation.phone)}</li>
                    </ul>
                </div>
            </article>
        `).join('');
    }

    /* =================================================================
       5. Start
       ================================================================= */
    loadUpcomingEvents();
    loadSummaryFigures();
});
