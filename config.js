/**
 * js/config.js
 * ---------------------------------------------------------------------
 * Static, hard-coded site content.
 *
 * The assessment brief says the organisation information shown on the
 * Home page "can be hard-coded", so this file holds that text in one
 * place instead of scattering it through the HTML pages. Changing the
 * charity here updates the header, hero, footer and Contact panel at once.
 *
 * The EVENT data is NOT hard-coded anywhere - it always comes from the
 * REST API built in Part 2.
 * ---------------------------------------------------------------------
 */

'use strict';

const SITE = {
    /* Our fictional client: a Sydney charity running fundraising events */
    name: 'Charity Events Sydney',
    tagline: 'Fundraising events for local causes',
    established: 2009,

    /* Header / brand mark initials */
    brandInitials: 'CE',

    /* ---- Home page hero (hard-coded static content) ---- */
    hero: {
        heading: 'Every ticket tells a story',
        intro:
            'Charity Events Sydney brings together the Harbour Lights Foundation, Green Coast ' +
            'Conservation Trust and Open Table Community Kitchen. Browse their upcoming galas, ' +
            'fun runs, auctions and concerts, then register to turn a night out into real change ' +
            'for families, coastlines and neighbours in our city.',
        primaryAction: { label: 'Browse upcoming events', href: '#events' },
        secondaryAction: { label: 'Search events', href: 'search.html' }
    },

    /* ---- Mission statement (hard-coded static content) ---- */
    mission: {
        heading: 'Our mission',
        statement:
            'We connect people who want to give with the causes that need them most. Every event ' +
            'listed on this website is hosted by a registered charitable organisation, and every ' +
            'ticket purchased is treated as a donation towards a specific, published goal.',
        points: [
            {
                icon: '🎯',
                title: 'Every goal is published',
                text: 'Each event shows exactly how much it is trying to raise and how far it has come, so donors can see where their money is going.'
            },
            {
                icon: '🤝',
                title: 'Local organisations only',
                text: 'All events are hosted by vetted charitable organisations working within our city and its surrounding regions.'
            },
            {
                icon: '🔍',
                title: 'Policy-checked listings',
                text: 'Events that do not meet our fundraising and licensing policy are suspended and are never shown on this website.'
            }
        ]
    },

    /* ---- Contact details (hard-coded static content) ---- */
    contact: {
        heading: 'Contact us',
        intro: 'Questions about an event, a donation or hosting your own fundraiser? Our team replies within two business days.',
        address: 'Level 4, 88 Pitt Street, Sydney NSW 2000',
        phone: '02 5550 1000',
        email: 'hello@charityeventssydney.org.au',
        hours: 'Monday to Friday, 9:00 am – 5:00 pm AEST',
        socials: [
            { label: 'Facebook', href: '#' },
            { label: 'Instagram', href: '#' },
            { label: 'LinkedIn', href: '#' }
        ]
    },

    /* ---- Footer ---- */
    footer: {
        acknowledgement:
            'This website was built as a student assessment project for PROG2002 Web Development II (Assessment 2). ' +
            'The organisations and events shown are fictional sample data.',
        credit: 'Charity Events Sydney · PROG2002 Assessment 2 · Individual submission'
    }
};
