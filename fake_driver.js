/**
 * test/fake_driver.js
 * ---------------------------------------------------------------------
 * An in-memory stand-in for the MySQL driver, used ONLY by the automated
 * tests so they can run without a database server.
 *
 * It exposes the same tiny surface that event_db.js needs:
 *     createPool() -> { execute(sql, params), end() }
 *
 * The real application always uses the genuine mysql2 driver - nothing in
 * server.js, routes/ or event_db.js knows that this file exists.
 *
 *   node test/api_test.js          run the endpoint test suite
 *   node test/smoke_test.js        boot the real server.js against this data
 * ---------------------------------------------------------------------
 */

'use strict';

/* ---------------------------------------------------------------------
 * Sample data - kept in step with database/02_seed_data.sql
 * ------------------------------------------------------------------- */
const TODAY = new Date();

/** Returns a YYYY-MM-DD string offset from today by n days. */
const iso = (offsetDays) => {
    const d = new Date(TODAY);
    d.setDate(d.getDate() + offsetDays);
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
};

const ORGS = [
    { organisation_id: 1, name: 'Harbour Lights Foundation', mission_statement: 'To light the way for families facing childhood illness.', about_text: 'Since 2009.', email: 'hello@harbourlights.org.au', phone: '02 5550 1200', website: 'https://www.harbourlights.org.au', city: 'Sydney', logo_url: 'assets/images/logo-harbour-lights.svg' },
    { organisation_id: 2, name: 'Green Coast Conservation Trust', mission_statement: 'Protecting our coastline and the wildlife that depends on it.', about_text: 'Volunteer restoration.', email: 'contact@greencoast.org.au', phone: '02 5550 4300', website: 'https://www.greencoast.org.au', city: 'Sydney', logo_url: 'assets/images/logo-green-coast.svg' },
    { organisation_id: 3, name: 'Open Table Community Kitchen', mission_statement: 'No one in our city should go to bed hungry.', about_text: 'Free hot meals six nights a week.', email: 'team@opentablekitchen.org.au', phone: '02 5550 7700', website: 'https://www.opentablekitchen.org.au', city: 'Sydney', logo_url: 'assets/images/logo-open-table.svg' }
];

const CATEGORIES = [
    { category_id: 1, category_name: 'Fun Run', description: 'Walk, run or ride events where participants raise funds through sponsorship.' },
    { category_id: 2, category_name: 'Gala Dinner', description: 'Formal evening dinners with auctions, speakers and entertainment.' },
    { category_id: 3, category_name: 'Silent Auction', description: 'Bidding events where donated items are sold to the highest bidder.' },
    { category_id: 4, category_name: 'Concert', description: 'Live music performances donated by artists to raise funds for a cause.' },
    { category_id: 5, category_name: 'Community Drive', description: 'Family-friendly community days, markets and food drives.' }
];

const base = {
    start_time: '18:00:00', end_time: '22:00:00', address: '1 Sample Street',
    suburb: 'Sydney CBD', city: 'Sydney', capacity: 500, status: 'active'
};

const EVENTS = [
    { ...base, event_id: 1, organisation_id: 1, category_id: 1, event_name: 'Harbour Lights Twilight Run 2025', short_summary: 'A 5 km and 10 km sunset run along the harbour foreshore.', full_description: 'A flat, scenic 5 km or 10 km course along the harbour foreshore at sunset.', purpose: 'Fund 12 months of family accommodation near the children\'s hospital.', event_date: iso(21), start_time: '16:30:00', end_time: '20:00:00', location_name: 'Barangaroo Reserve', suburb: 'Barangaroo', ticket_price: 45, is_free: 0, goal_amount: 60000, raised_amount: 28450, capacity: 1200, image_url: 'assets/images/event-twilight-run.svg' },
    { ...base, event_id: 2, organisation_id: 1, category_id: 2, event_name: 'Lights of Hope Gala Dinner', short_summary: 'A black-tie dinner with a guest speaker and live auction.', full_description: 'An elegant black-tie evening with a three-course menu designed by local chefs.', purpose: 'Provide 500 nights of respite care for families.', event_date: iso(45), start_time: '18:30:00', end_time: '23:00:00', location_name: 'The Grand Ballroom, Harbour Hotel', suburb: 'Sydney CBD', ticket_price: 220, is_free: 0, goal_amount: 120000, raised_amount: 61500, capacity: 400, image_url: 'assets/images/event-gala-dinner.svg' },
    { ...base, event_id: 3, organisation_id: 2, category_id: 3, event_name: 'Coastline Silent Auction', short_summary: 'Bid on donated art, getaways and experiences.', full_description: 'More than 120 donated lots across three gallery rooms.', purpose: 'Fund the restoration of 4 km of coastal dune habitat.', event_date: iso(30), location_name: 'Bondi Pavilion Gallery', suburb: 'Bondi', ticket_price: 35, is_free: 0, goal_amount: 45000, raised_amount: 15900, capacity: 300, image_url: 'assets/images/event-silent-auction.svg' },
    { ...base, event_id: 4, organisation_id: 2, category_id: 1, event_name: 'Green Coast Coastal Walk', short_summary: 'A guided 12 km coastal walk with a clean-up.', full_description: 'A guided 12 km walk from Coogee to Maroubra with four clean-up stops.', purpose: 'Remove 3 tonnes of marine debris from the coastline.', event_date: iso(12), start_time: '07:00:00', end_time: '13:00:00', location_name: 'Coogee Beach Surf Life Saving Club', suburb: 'Coogee', ticket_price: 0, is_free: 1, goal_amount: 25000, raised_amount: 11200, image_url: 'assets/images/event-coastal-walk.svg' },
    { ...base, event_id: 5, organisation_id: 3, category_id: 4, event_name: 'Open Table Benefit Concert', short_summary: 'An acoustic evening of live music.', full_description: 'Six local acts perform acoustic sets in an intimate 600-seat venue.', purpose: 'Serve 12,000 free hot meals through the winter kitchen program.', event_date: iso(8), start_time: '19:00:00', end_time: '22:30:00', location_name: 'The Factory Theatre', suburb: 'Marrickville', ticket_price: 55, is_free: 0, goal_amount: 40000, raised_amount: 31800, capacity: 600, image_url: 'assets/images/event-benefit-concert.svg' },
    { ...base, event_id: 6, organisation_id: 3, category_id: 5, event_name: 'Sunday Community Market', short_summary: 'A free family market with produce stalls.', full_description: 'Forty local producers, a children\'s craft zone and cooking demonstrations.', purpose: 'Restock the community pantry with 5,000 kg of food.', event_date: iso(5), start_time: '08:00:00', end_time: '14:00:00', location_name: 'Petersham Town Hall Forecourt', suburb: 'Petersham', ticket_price: 0, is_free: 1, goal_amount: 15000, raised_amount: 4300, capacity: 800, image_url: 'assets/images/event-community-market.svg' },
    { ...base, event_id: 7, organisation_id: 1, category_id: 3, event_name: 'Art for Answers Auction', short_summary: 'An auction of works donated by emerging artists.', full_description: 'Forty emerging Australian artists have donated original works.', purpose: 'Fund a full year of the hospital school program.', event_date: iso(70), start_time: '17:30:00', end_time: '21:30:00', location_name: 'Surry Hills Creative Space', suburb: 'Surry Hills', ticket_price: 25, is_free: 0, goal_amount: 35000, raised_amount: 0, capacity: 250, image_url: 'assets/images/event-art-auction.svg' },
    { ...base, event_id: 8, organisation_id: 2, category_id: 2, event_name: 'Sustainability Gala 2025', short_summary: 'A formal dinner celebrating local businesses.', full_description: 'Our flagship fundraising dinner recognises twelve local businesses.', purpose: 'Plant 10,000 native trees along the Cooks River.', event_date: iso(95), end_time: '23:30:00', location_name: 'Australian Museum, Crystal Hall', suburb: 'Darlinghurst', ticket_price: 195, is_free: 0, goal_amount: 150000, raised_amount: 22000, capacity: 350, image_url: 'assets/images/event-sustainability-gala.svg' },
    { ...base, event_id: 9, organisation_id: 3, category_id: 1, event_name: 'Run for Your Supper 10K', short_summary: 'A chip-timed 10 km run through the inner west.', full_description: 'A fast, flat and fully closed-road 10 km course through the inner west.', purpose: 'Provide 8,000 weekend meal packs to school children.', event_date: iso(60), start_time: '06:30:00', end_time: '10:30:00', location_name: 'Ashfield Park', suburb: 'Ashfield', ticket_price: 40, is_free: 0, goal_amount: 30000, raised_amount: 8600, capacity: 900, image_url: 'assets/images/event-run-for-supper.svg' },
    { ...base, event_id: 10, organisation_id: 1, category_id: 5, event_name: 'Family Fun Day on the Green', short_summary: 'Free entry, carnival games and face painting.', full_description: 'A relaxed family day with carnival games, face painting and a petting zoo.', purpose: 'Raise funds for 200 family support counselling sessions.', event_date: iso(35), start_time: '10:00:00', end_time: '15:00:00', location_name: 'Camperdown Memorial Rest Park', suburb: 'Newtown', ticket_price: 0, is_free: 1, goal_amount: 20000, raised_amount: 3100, capacity: 1000, image_url: 'assets/images/event-family-fun-day.svg' },
    { ...base, event_id: 11, organisation_id: 1, category_id: 1, event_name: 'Harbour Lights Autumn Run 2024', short_summary: 'Last year\'s autumn fun run along the harbour.', full_description: 'The 2024 autumn edition of our signature fun run.', purpose: 'Fund family accommodation nights near the hospital.', event_date: iso(-300), start_time: '16:30:00', end_time: '20:00:00', location_name: 'Barangaroo Reserve', suburb: 'Barangaroo', ticket_price: 40, is_free: 0, goal_amount: 50000, raised_amount: 52300, capacity: 1000, image_url: 'assets/images/event-autumn-run.svg' },
    { ...base, event_id: 12, organisation_id: 2, category_id: 5, event_name: 'Beach Clean-Up Blitz', short_summary: 'Our summer clean-up removed 1.8 tonnes of debris.', full_description: 'More than 400 volunteers joined our summer clean-up across five beaches.', purpose: 'Remove marine debris and record pollution data.', event_date: iso(-150), start_time: '07:30:00', end_time: '11:30:00', location_name: 'Maroubra Beach', suburb: 'Maroubra', ticket_price: 0, is_free: 1, goal_amount: 10000, raised_amount: 9800, capacity: 400, image_url: 'assets/images/event-beach-cleanup.svg' },
    { ...base, event_id: 13, organisation_id: 3, category_id: 4, event_name: 'Winter Warmers Concert', short_summary: 'A sold-out winter concert that funded 9,400 meals.', full_description: 'Five acts performed to a full house.', purpose: 'Fund free hot meals through the winter kitchen program.', event_date: iso(-90), start_time: '19:00:00', end_time: '22:00:00', location_name: 'The Factory Theatre', suburb: 'Marrickville', ticket_price: 50, is_free: 0, goal_amount: 35000, raised_amount: 37800, capacity: 600, image_url: 'assets/images/event-winter-concert.svg' },
    { ...base, event_id: 14, organisation_id: 3, category_id: 5, event_name: 'Midnight Charity Raffle Night', short_summary: 'Suspended: did not meet the fundraising policy.', full_description: 'Suspended because the raffle structure did not comply with policy.', purpose: 'Raise funds for the community pantry program.', event_date: iso(25), start_time: '20:00:00', end_time: '23:59:00', location_name: 'Open Table Community Kitchen', suburb: 'Petersham', ticket_price: 20, is_free: 0, goal_amount: 12000, raised_amount: 0, capacity: 150, image_url: 'assets/images/event-raffle-night.svg', status: 'suspended' }
];

const byId = (id, list, key) => list.find((row) => row[key] === id);
const PUBLIC_STATUSES = ['active', 'cancelled'];

/**
 * Translates the small, known set of SQL statements used by the API into
 * JavaScript filtering. Deliberately explicit rather than a real SQL parser.
 *
 * @param {string} sql
 * @param {Array} params
 * @returns {Array<object>} rows
 */
function runQuery(sql, params = []) {
    const normalised = String(sql);

    if (normalised.includes('SELECT DATABASE()')) {
        return [{ db_name: 'charityevents_db', event_count: EVENTS.length }];
    }

    /* ---- categories ------------------------------------------------- */
    if (normalised.includes('FROM categories c') && normalised.includes('COUNT(e.event_id)')) {
        return CATEGORIES.map((category) => ({
            ...category,
            event_count: EVENTS.filter((e) => e.category_id === category.category_id
                && e.status === 'active' && e.event_date >= params[0]).length
        }));
    }
    if (normalised.includes('FROM categories') && !normalised.includes('JOIN')) {
        return CATEGORIES.map((c) => ({ ...c }));
    }

    /* ---- organisations --------------------------------------------- */
    if (normalised.includes('FROM organisations')) {
        return ORGS.map((organisation) => ({
            ...organisation,
            upcoming_event_count: EVENTS.filter((e) => e.organisation_id === organisation.organisation_id
                && e.status === 'active' && e.event_date >= iso(0)).length
        }));
    }

    /* ---- events ---------------------------------------------------- */
    if (normalised.includes('FROM events e')) {
        const isDetail = normalised.includes('e.event_id = ?');
        const isSearch = !isDetail && !normalised.includes('LIMIT ?');

        let rows = EVENTS.filter((e) => PUBLIC_STATUSES.includes(e.status));

        if (isSearch) {
            /* Placeholder order: status x2, city LIKE x3, category_id,
               dateFrom, dateTo, then upcoming/past. */
            let index = 2;

            if (normalised.includes('e.city LIKE ?')) {
                const term = String(params[index] || '').replace(/%/g, '').toLowerCase();
                index += 3;
                if (term) {
                    rows = rows.filter((e) => [e.city, e.suburb, e.location_name]
                        .some((field) => String(field).toLowerCase().includes(term)));
                }
            }
            if (normalised.includes('e.category_id = ?')) {
                const categoryId = Number(params[index]); index += 1;
                rows = rows.filter((e) => e.category_id === categoryId);
            }
            if (normalised.includes('e.event_date >= ?')) {
                const from = params[index]; index += 1;
                rows = rows.filter((e) => e.event_date >= from);
            }
            if (normalised.includes('e.event_date <= ?')) {
                const to = params[index]; index += 1;
                rows = rows.filter((e) => e.event_date <= to);
            }
        } else if (isDetail) {
            rows = rows.filter((e) => e.event_id === Number(params[0]));
        } else {
            if (normalised.includes('e.event_date >= ?')) {
                rows = rows.filter((e) => e.event_date >= params[2]);
            } else if (normalised.includes('e.event_date < ?')) {
                rows = rows.filter((e) => e.event_date < params[2]);
            }
        }

        /* Join the category and organisation columns the way BASE_SELECT does */
        rows = rows.map((e) => {
            const category = byId(e.category_id, CATEGORIES, 'category_id');
            const organisation = byId(e.organisation_id, ORGS, 'organisation_id');
            return {
                ...e,
                category_name: category.category_name,
                organisation_name: organisation.name,
                mission_statement: organisation.mission_statement,
                organisation_email: organisation.email,
                organisation_phone: organisation.phone,
                organisation_website: organisation.website
            };
        });

        rows.sort((a, b) => (normalised.includes('ORDER BY e.event_date DESC')
            ? (a.event_date < b.event_date ? 1 : -1)
            : (a.event_date > b.event_date ? 1 : -1)));

        const limit = Number(params[params.length - 1]);
        if (normalised.includes('LIMIT ?') && Number.isFinite(limit)) rows = rows.slice(0, limit);
        if (normalised.includes('LIMIT 1')) rows = rows.slice(0, 1);

        return rows;
    }

    throw new Error(`The fake driver does not recognise this statement:\n${normalised.slice(0, 220)}`);
}

/**
 * mysql2-compatible pool used by event_db.js during tests.
 *
 * The real mysql2 pool exposes both a callback API and - through
 * pool.promise() - a promise API. event_db.js deliberately uses the promise
 * API, so this stub must provide it too; otherwise the tests would not
 * exercise the same call path as the real driver.
 */
const driver = {
    createPool: () => {
        const pool = {
            execute: async (sql, params) => [runQuery(sql, params), []],
            query: async (sql, params) => [runQuery(sql, params), []],
            end: async () => undefined
        };
        pool.promise = () => pool;
        return pool;
    }
};

/**
 * Patches Node's module loader so that require('mysql2') returns the fake
 * driver. Must be called BEFORE event_db.js is required.
 */
function install() {
    const Module = require('module');
    const originalLoad = Module._load;
    Module._load = function patchedLoad(request, parent, isMain) {
        if (request === 'mysql2') return driver;
        return originalLoad.call(this, request, parent, isMain);
    };
    return () => { Module._load = originalLoad; };
}

module.exports = { EVENTS, ORGS, CATEGORIES, iso, runQuery, driver, install };
