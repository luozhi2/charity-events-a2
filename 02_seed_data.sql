-- =====================================================================
--  PROG2002 Web Development II - Assessment 2
--  Charity Events website - SAMPLE DATA
--
--  Requirement from the Assessment Brief:
--    "Populate your tables with a minimum of 8 sample events and a few
--     different categories to provide a realistic dataset."
--
--  This file contains:
--    3 charitable organisations
--    5 categories
--   14 events  (10 active + upcoming, 3 past, 1 suspended)
--
--  Dates are relative to the current date so that the "upcoming" events
--  stay in the future whenever the marker imports this file:
--    * f = future event  (DATE_ADD from CURDATE)
--    * p = past event    (DATE_SUB from CURDATE)
-- =====================================================================

USE charityevents_db;

-- ---------------------------------------------------------------------
-- Organisations
-- ---------------------------------------------------------------------
INSERT INTO organisations
    (organisation_id, name, mission_statement, about_text, email, phone, website, city, logo_url)
VALUES
(1, 'Harbour Lights Foundation',
 'To light the way for families facing childhood illness.',
 'Harbour Lights Foundation has supported families across Sydney since 2009. We fund family accommodation near children''s hospitals, respite programs and practical financial relief for parents who have had to stop working to care for a sick child. Every dollar raised in our events goes directly into these programs.',
 'hello@harbourlights.org.au', '02 5550 1200', 'https://www.harbourlights.org.au', 'Sydney', 'assets/images/logo-harbour-lights.svg'),

(2, 'Green Coast Conservation Trust',
 'Protecting our coastline and the wildlife that depends on it.',
 'Green Coast Conservation Trust works with local councils and volunteer groups to restore dunes, remove marine debris and protect nesting shorebirds along the eastern coastline. We run community planting days, coastal clean-ups and education programs in schools.',
 'contact@greencoast.org.au', '02 5550 4300', 'https://www.greencoast.org.au', 'Sydney', 'assets/images/logo-green-coast.svg'),

(3, 'Open Table Community Kitchen',
 'No one in our city should go to bed hungry.',
 'Open Table Community Kitchen prepares and serves free hot meals six nights a week from our kitchen in the inner west. We also run a food-rescue program that redistributes surplus produce from local markets to families in need, and a cooking skills workshop for young people.',
 'team@opentablekitchen.org.au', '02 5550 7700', 'https://www.opentablekitchen.org.au', 'Sydney', 'assets/images/logo-open-table.svg');

-- ---------------------------------------------------------------------
-- Categories (used by the Search page category filter)
-- ---------------------------------------------------------------------
INSERT INTO categories (category_id, category_name, description) VALUES
(1, 'Fun Run',         'Walk, run or ride events where participants raise funds through sponsorship.'),
(2, 'Gala Dinner',     'Formal evening dinners with auctions, speakers and entertainment.'),
(3, 'Silent Auction',  'Bidding events where donated items are sold to the highest bidder.'),
(4, 'Concert',         'Live music performances donated by artists to raise funds for a cause.'),
(5, 'Community Drive', 'Family-friendly community days, markets and food drives.');

-- ---------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------
INSERT INTO events
    (event_id, organisation_id, category_id, event_name, short_summary, full_description, purpose,
     event_date, start_time, end_time, location_name, address, suburb, city,
     ticket_price, is_free, goal_amount, raised_amount, capacity, image_url, status)
VALUES
-- ================= ACTIVE + UPCOMING (shown on Home page) ============
(1, 1, 1, 'Harbour Lights Twilight Run 2025',
 'A 5 km and 10 km sunset run along the harbour foreshore to fund family accommodation.',
 'Join hundreds of runners and walkers for a flat, scenic 5 km or 10 km course that starts at Barangaroo Reserve and follows the harbour foreshore at sunset. Every participant receives a race bib, a finisher medal and access to the post-run recovery village with live music and food trucks. Water stations and marshals are positioned every kilometre, and a dedicated 1 km "Little Lights" course is available for children under 12.',
 'Fund 12 months of family accommodation near the children''s hospital so parents can stay close to their child during treatment.',
 DATE_ADD(CURDATE(), INTERVAL 21 DAY), '16:30:00', '20:00:00',
 'Barangaroo Reserve', 'Munn Street, Barangaroo', 'Barangaroo', 'Sydney',
 45.00, 0, 60000.00, 28450.00, 1200, 'assets/images/event-twilight-run.svg', 'active'),

(2, 1, 2, 'Lights of Hope Gala Dinner',
 'A black-tie dinner with a guest speaker, live auction and a three-course menu by local chefs.',
 'An elegant black-tie evening in the Grand Ballroom featuring a three-course menu designed by five local chefs who have donated their time. The program includes a keynote address from a family supported by the foundation, a live auction of once-in-a-lifetime experiences, and a performance by the Harbour Youth Orchestra. All proceeds support our respite care program.',
 'Provide 500 nights of respite care for families caring for a child with a life-limiting illness.',
 DATE_ADD(CURDATE(), INTERVAL 45 DAY), '18:30:00', '23:00:00',
 'The Grand Ballroom, Harbour Hotel', '1 Macquarie Street', 'Sydney CBD', 'Sydney',
 220.00, 0, 120000.00, 61500.00, 400, 'assets/images/event-gala-dinner.svg', 'active'),

(3, 2, 3, 'Coastline Silent Auction',
 'Bid on donated art, getaways and experiences while supporting dune restoration.',
 'Browse more than 120 donated lots - original artworks, weekend getaways, dining vouchers, signed sporting memorabilia and professional services - displayed across three gallery rooms. Bidding opens online one week before the event and closes in person on the night. Volunteers are available to help first-time bidders register, and complimentary local wine and cheese are served throughout the evening.',
 'Fund the restoration of 4 km of degraded coastal dune habitat and the protection of nesting shorebirds.',
 DATE_ADD(CURDATE(), INTERVAL 30 DAY), '18:00:00', '22:00:00',
 'Bondi Pavilion Gallery', 'Queen Elizabeth Drive, Bondi Beach', 'Bondi', 'Sydney',
 35.00, 0, 45000.00, 15900.00, 300, 'assets/images/event-silent-auction.svg', 'active'),

(4, 2, 1, 'Green Coast Coastal Walk',
 'A guided 12 km coastal walk with a marine-debris clean-up along the way.',
 'A guided 12 km walk from Coogee to Maroubra along the coastal track, stopping at four beaches to collect and audit marine debris with our conservation team. Walkers learn how litter data feeds into national pollution reporting. The walk finishes with a barbecue lunch, and all participants receive a reusable clean-up kit and a native seedling to plant at home.',
 'Remove 3 tonnes of marine debris from the eastern coastline and plant 2,000 native seedlings.',
 DATE_ADD(CURDATE(), INTERVAL 12 DAY), '07:00:00', '13:00:00',
 'Coogee Beach Surf Life Saving Club', 'Coogee Beach', 'Coogee', 'Sydney',
 0.00, 1, 25000.00, 11200.00, 500, 'assets/images/event-coastal-walk.svg', 'active'),

(5, 3, 4, 'Open Table Benefit Concert',
 'An acoustic evening of live music where every ticket funds 20 hot meals.',
 'Six local acts - including two ARIA-nominated artists - perform acoustic sets in an intimate 600-seat venue. Every ticket purchased funds twenty hot meals served from our kitchen. The evening includes a short film about our food-rescue program and a question-and-answer session with our head chef and volunteers.',
 'Serve 12,000 free hot meals through the winter kitchen program.',
 DATE_ADD(CURDATE(), INTERVAL 8 DAY), '19:00:00', '22:30:00',
 'The Factory Theatre', '105 Victoria Road, Marrickville', 'Marrickville', 'Sydney',
 55.00, 0, 40000.00, 31800.00, 600, 'assets/images/event-benefit-concert.svg', 'active'),

(6, 3, 5, 'Sunday Community Market',
 'A free family market with produce stalls, a kids'' zone and a donation drive.',
 'Our monthly community market brings together 40 local producers, a children''s craft zone, live cooking demonstrations using rescued produce and a drop-off point for non-perishable food donations. Entry is free and every stall donates a percentage of the day''s takings to the kitchen. Accessible parking and a quiet sensory space are available.',
 'Restock the community pantry with 5,000 kg of food for families experiencing food insecurity.',
 DATE_ADD(CURDATE(), INTERVAL 5 DAY), '08:00:00', '14:00:00',
 'Petersham Town Hall Forecourt', 'Crystal Street, Petersham', 'Petersham', 'Sydney',
 0.00, 1, 15000.00, 4300.00, 800, 'assets/images/event-community-market.svg', 'active'),

(7, 1, 3, 'Art for Answers Auction',
 'An online and in-room auction of works donated by emerging Australian artists.',
 'Forty emerging Australian artists have donated original works exploring themes of care, family and resilience. The collection is exhibited for one week before the auction and can also be bid on through our online platform. The evening includes artist talks, a grazing table and a short presentation on how the funds are allocated.',
 'Fund a full year of the hospital school program for children receiving long-term treatment.',
 DATE_ADD(CURDATE(), INTERVAL 70 DAY), '17:30:00', '21:30:00',
 'Surry Hills Creative Space', '410 Bourke Street, Surry Hills', 'Surry Hills', 'Sydney',
 25.00, 0, 35000.00, 0.00, 250, 'assets/images/event-art-auction.svg', 'active'),

(8, 2, 2, 'Sustainability Gala 2025',
 'A formal dinner celebrating local businesses that have committed to net-zero targets.',
 'Our flagship fundraising dinner recognises twelve local businesses that have achieved measurable emissions reductions. The evening features a sustainably sourced four-course menu, a panel discussion on corporate climate responsibility and a pledge auction where guests fund specific restoration projects. Carbon offsets for the event are purchased and reported publicly.',
 'Plant 10,000 native trees and restore 6 hectares of riparian vegetation along the Cooks River.',
 DATE_ADD(CURDATE(), INTERVAL 95 DAY), '18:00:00', '23:30:00',
 'Australian Museum, Crystal Hall', '1 William Street', 'Darlinghurst', 'Sydney',
 195.00, 0, 150000.00, 22000.00, 350, 'assets/images/event-sustainability-gala.svg', 'active'),

(9, 3, 1, 'Run for Your Supper 10K',
 'A chip-timed 10 km run where entry fees fund weekend meal packs for school children.',
 'A fast, flat and fully closed-road 10 km course through the inner west, chip-timed with age-category prizes. Runners can create a fundraising page and collect sponsorship from friends and family in the weeks before the event. All finishers receive a medal and a breakfast pack, and a 2 km family dash runs beforehand for children and prams.',
 'Provide 8,000 weekend meal packs to school children who rely on school lunches during the week.',
 DATE_ADD(CURDATE(), INTERVAL 60 DAY), '06:30:00', '10:30:00',
 'Ashfield Park', 'Parramatta Road, Ashfield', 'Ashfield', 'Sydney',
 40.00, 0, 30000.00, 8600.00, 900, 'assets/images/event-run-for-supper.svg', 'active'),

(10, 1, 5, 'Family Fun Day on the Green',
 'Free entry, carnival games, face painting and a charity sausage sizzle.',
 'A relaxed family day on the village green with carnival games, face painting, a petting zoo, a jumping castle and a fundraising sausage sizzle run by our volunteer team. Local sports clubs run come-and-try sessions, and our family support team is available to talk with anyone who needs assistance. Entry is free, with donations welcome at the gate.',
 'Raise funds for 200 family support counselling sessions and introduce new families to our services.',
 DATE_ADD(CURDATE(), INTERVAL 35 DAY), '10:00:00', '15:00:00',
 'Camperdown Memorial Rest Park', 'Federation Road, Newtown', 'Newtown', 'Sydney',
 0.00, 1, 20000.00, 3100.00, 1000, 'assets/images/event-family-fun-day.svg', 'active'),

-- ==================== PAST EVENTS (marked "past") ====================
(11, 1, 1, 'Harbour Lights Autumn Run 2024',
 'Last year''s autumn fun run along the harbour foreshore.',
 'The 2024 autumn edition of our signature fun run followed the same 5 km and 10 km harbour course, with more than 900 participants taking part. The event raised $52,300 for the family accommodation program and was supported by 60 volunteers.',
 'Fund family accommodation nights near the children''s hospital.',
 DATE_SUB(CURDATE(), INTERVAL 300 DAY), '16:30:00', '20:00:00',
 'Barangaroo Reserve', 'Munn Street, Barangaroo', 'Barangaroo', 'Sydney',
 40.00, 0, 50000.00, 52300.00, 1000, 'assets/images/event-autumn-run.svg', 'active'),

(12, 2, 5, 'Beach Clean-Up Blitz',
 'Our summer clean-up removed 1.8 tonnes of debris from five beaches.',
 'More than 400 volunteers joined our summer clean-up across five beaches, removing 1.8 tonnes of marine debris including 12,000 cigarette butts and 900 plastic bottles. The debris audit data was submitted to the national marine pollution register.',
 'Remove marine debris and record pollution data for national reporting.',
 DATE_SUB(CURDATE(), INTERVAL 150 DAY), '07:30:00', '11:30:00',
 'Maroubra Beach', 'Marine Parade, Maroubra', 'Maroubra', 'Sydney',
 0.00, 1, 10000.00, 9800.00, 400, 'assets/images/event-beach-cleanup.svg', 'active'),

(13, 3, 4, 'Winter Warmers Concert',
 'A sold-out winter concert that funded 9,400 hot meals.',
 'Our 2024 winter concert sold out two weeks in advance. Five acts performed to a full house, and the evening raised enough to fund 9,400 hot meals through the coldest months of the year.',
 'Fund free hot meals through the winter kitchen program.',
 DATE_SUB(CURDATE(), INTERVAL 90 DAY), '19:00:00', '22:00:00',
 'The Factory Theatre', '105 Victoria Road, Marrickville', 'Marrickville', 'Sydney',
 50.00, 0, 35000.00, 37800.00, 600, 'assets/images/event-winter-concert.svg', 'active'),

-- ============ SUSPENDED EVENT (must NOT appear on the Home page) =====
(14, 3, 5, 'Midnight Charity Raffle Night',
 'Suspended: the event did not meet the organisation''s fundraising policy.',
 'This event was submitted for approval but was suspended by the organisation because the raffle structure did not comply with the fundraising policy and the state raffle licensing requirements. It is retained in the database for audit purposes and must not be displayed to the public.',
 'Raise funds for the community pantry program.',
 DATE_ADD(CURDATE(), INTERVAL 25 DAY), '20:00:00', '23:59:00',
 'Open Table Community Kitchen', '12 Gordon Street, Petersham', 'Petersham', 'Sydney',
 20.00, 0, 12000.00, 0.00, 150, 'assets/images/event-raffle-night.svg', 'suspended');

-- =====================================================================
--  Verification queries (optional - run these to confirm the import)
-- =====================================================================
-- SELECT COUNT(*) AS total_events FROM events;
-- SELECT status, COUNT(*) AS total FROM events GROUP BY status;
-- SELECT e.event_name, c.category_name, o.name AS organisation, e.event_date
--   FROM events e
--   JOIN categories c     ON c.category_id = e.category_id
--   JOIN organisations o  ON o.organisation_id = e.organisation_id
--   WHERE e.status = 'active' AND e.event_date >= CURDATE()
--   ORDER BY e.event_date;
