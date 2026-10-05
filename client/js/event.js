/**
 * js/event.js
 * ---------------------------------------------------------------------
 * Event detail page behaviour.
 *
 * Requirements covered here:
 *   * the page shows ONLY the event that was selected on the Home or
 *     Search page - the id arrives through the URL query string
 *     (event.html?eventId=3), with localStorage as a fallback, and the
 *     data is fetched from  GET /api/events/:id
 *   * all event details are displayed in a structured layout
 *   * a "Register" button opens a modal dialog that states
 *     "This feature is currently under construction."
 *   * invalid ids and missing events produce a friendly error message
 * ---------------------------------------------------------------------
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    /* ---------- element references ---------- */
    const messageArea = document.getElementById('detail-message');
    const layout = document.getElementById('detail-layout');
    const loading = document.getElementById('detail-loading');

    const breadcrumbCurrent = document.getElementById('breadcrumb-current');
    const badges = document.getElementById('detail-badges');
    const title = document.getElementById('event-title');
    const quickMeta = document.getElementById('event-quick-meta');

    const eventImage = document.getElementById('event-image');
    const description = document.getElementById('event-description');
    const purpose = document.getElementById('event-purpose');

    const goalPercent = document.getElementById('goal-percent');
    const goalFill = document.getElementById('goal-fill');
    const goalRaised = document.getElementById('goal-raised');
    const goalTarget = document.getElementById('goal-target');
    const goalRemaining = document.getElementById('goal-remaining');
    const goalProgressbar = document.getElementById('goal-progressbar');

    const detailDatetime = document.getElementById('detail-datetime');
    const detailVenue = document.getElementById('detail-venue');
    const detailAddress = document.getElementById('detail-address');
    const detailCategory = document.getElementById('detail-category');
    const detailTickets = document.getElementById('detail-tickets');

    const ticketPrice = document.getElementById('ticket-price');
    const ticketNote = document.getElementById('ticket-note');
    const registerButton = document.getElementById('register-button');

    const orgLogo = document.getElementById('org-logo');
    const orgName = document.getElementById('org-name');
    const orgMission = document.getElementById('org-mission');
    const orgEmail = document.getElementById('org-email');
    const orgPhone = document.getElementById('org-phone');
    const orgWebsite = document.getElementById('org-website');

    const modal = document.getElementById('register-modal');
    const modalOrgLink = document.getElementById('modal-org-link');

    highlightCurrentNavLink();
    initNavToggle();
    insertCurrentYear();
    initModal(modal, registerButton);

    /* =================================================================
       1. Work out which event to show
          Query string first (shareable URL), localStorage second.
       ================================================================= */
    const eventIdFromUrl = getEventIdFromQueryString();
    const eventId = eventIdFromUrl || getRememberedEventId();

    /* =================================================================
       2. Load that one event -> GET /api/events/:id
       ================================================================= */
    async function loadEvent(id) {
        try {
            const response = await API.getEventById(id);
            renderEvent(response.data);
        } catch (error) {
            loading.hidden = true;

            if (error.status === 404) {
                title.textContent = 'Event not found';
                breadcrumbCurrent.textContent = 'Not found';
                showMessage(messageArea, error.message, {
                    type: 'warning',
                    title: 'We could not find that event.',
                    list: ['It may have been removed by the organisation, or it may have been suspended for breaching our fundraising policy.']
                });
            } else if (error.status === 400) {
                title.textContent = 'Invalid event link';
                breadcrumbCurrent.textContent = 'Invalid link';
                showMessage(messageArea, error.message, {
                    type: 'error',
                    title: 'That event link is not valid.'
                });
            } else {
                title.textContent = 'Event unavailable';
                showMessage(messageArea, error.message, {
                    type: 'error',
                    title: 'The event details could not be loaded.'
                });
            }
        }
    }

    /* =================================================================
       3. Render the event into the page
       ================================================================= */
    function renderEvent(event) {
        // Remember the id for the localStorage fallback method.
        rememberEventId(event.eventId);

        document.title = `${event.eventName} | Charity Events Sydney`;
        breadcrumbCurrent.textContent = event.eventName;

        /* ---- badges: category, upcoming/past, free ---- */
        const statusBadge = event.displayStatus === 'past'
            ? '<span class="badge badge--past">Past event</span>'
            : `<span class="badge badge--upcoming">${escapeHtml(countdownLabel(event.daysUntil))}</span>`;

        badges.innerHTML = `
            <span class="badge badge--category">${escapeHtml(event.category.categoryName)}</span>
            ${statusBadge}
            ${event.ticket.isFree ? '<span class="badge badge--free">Free entry</span>' : ''}
        `;

        /* ---- heading and quick meta ---- */
        title.textContent = event.eventName;
        quickMeta.innerHTML = `
            <span>📅 ${escapeHtml(event.date.displayDate)}</span>
            <span>🕒 ${escapeHtml(event.date.startTime)} – ${escapeHtml(event.date.endTime)}</span>
            <span>📍 ${escapeHtml(event.location.venue)}, ${escapeHtml(event.location.suburb)}</span>
            <span>💚 ${event.goal.progressPercent}% of goal raised</span>
        `;

        /* ---- image ---- */
        eventImage.src = event.imageUrl || 'assets/images/hero-home.svg';
        eventImage.alt = `${event.eventName} at ${event.location.venue}`;

        /* ---- description and purpose ---- */
        description.textContent = event.fullDescription;
        purpose.textContent = event.purpose;

        /* ---- fundraising progress ---- */
        goalPercent.textContent = `${event.goal.progressPercent}%`;
        goalFill.style.width = `${event.goal.progressPercent}%`;
        goalProgressbar.setAttribute('aria-valuenow', String(event.goal.progressPercent));
        goalRaised.textContent = formatMoney(event.goal.raised);
        goalTarget.textContent = formatMoney(event.goal.amount);
        goalRemaining.textContent = event.goal.remaining > 0
            ? `${formatMoney(event.goal.remaining)} still needed to reach the goal of ${formatMoney(event.goal.amount)}.`
            : 'This event has reached its fundraising goal. Thank you to everyone who donated!';

        /* ---- fact list ---- */
        detailDatetime.textContent = `${event.date.displayDate}, ${event.date.startTime} – ${event.date.endTime}`;
        detailVenue.textContent = event.location.venue;
        detailAddress.textContent = `${event.location.address}, ${event.location.suburb} ${event.location.city}`;
        detailCategory.textContent = event.category.categoryName;
        detailTickets.textContent = event.ticket.isFree
            ? 'Free entry — donations welcome'
            : `${event.ticket.priceLabel} per person · capacity ${event.ticket.capacity} attendees`;

        /* ---- ticket box ---- */
        ticketPrice.textContent = event.ticket.isFree ? 'Free' : event.ticket.priceLabel;
        ticketNote.textContent = event.ticket.isFree
            ? 'Entry is free. Donations on the day support the fundraising goal.'
            : `Each ${event.ticket.priceLabel} ticket is a donation towards the ${formatMoney(event.goal.amount)} goal.`;

        /* ---- host organisation ---- */
        orgLogo.src = event.organisation.logoUrl || 'assets/images/logo-harbour-lights.svg';
        orgLogo.alt = `${event.organisation.name} logo`;
        orgName.textContent = event.organisation.name;
        orgMission.textContent = event.organisation.missionStatement;
        orgEmail.textContent = event.organisation.email;
        orgEmail.href = `mailto:${event.organisation.email}`;
        orgPhone.textContent = event.organisation.phone;

        if (event.organisation.website) {
            orgWebsite.href = event.organisation.website;
            orgWebsite.hidden = false;
        } else {
            orgWebsite.hidden = true;
        }

        modalOrgLink.href = `mailto:${event.organisation.email}?subject=${encodeURIComponent('Question about ' + event.eventName)}`;

        /* ---- show the loaded layout ---- */
        loading.hidden = true;
        layout.hidden = false;
    }

    /* =================================================================
       4. Register button -> modal with the required message
       ================================================================= */
    registerButton.addEventListener('click', () => {
        openModal(modal, modal.querySelector('button'));
    });

    /* =================================================================
       5. Start
       ================================================================= */
    if (!eventId) {
        loading.hidden = true;
        title.textContent = 'No event selected';
        showMessage(messageArea,
            'Please choose an event from the Home page or the Search page to see its full details.',
            { type: 'info', title: 'No event was selected.' });
        document.querySelector('.detail-layout')?.setAttribute('hidden', 'hidden');
    } else {
        loadEvent(eventId);
    }
});
