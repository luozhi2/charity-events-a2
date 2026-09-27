-- =====================================================================
--  PROG2002 Web Development II - Assessment 2
--  Charity Events website - DATABASE SCHEMA
--  Database : charityevents_db
--  Engine   : InnoDB
--  Charset  : utf8mb4 (full Unicode support)
--
--  Import order:
--    1. 01_schema.sql   (this file)   - creates the database and tables
--    2. 02_seed_data.sql             - inserts the sample data (>= 8 events)
--
--  Or import the combined file: charityevents_db.sql
-- =====================================================================

DROP DATABASE IF EXISTS charityevents_db;
CREATE DATABASE charityevents_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE charityevents_db;

-- ---------------------------------------------------------------------
-- Table 1: organisations
-- The charitable organisations that host the events.
-- One organisation can host many events  (1 : M with events).
-- ---------------------------------------------------------------------
CREATE TABLE organisations (
    organisation_id   INT             NOT NULL AUTO_INCREMENT,
    name              VARCHAR(120)    NOT NULL,
    mission_statement VARCHAR(500)    NOT NULL,
    about_text        TEXT            NOT NULL,
    email             VARCHAR(120)    NOT NULL,
    phone             VARCHAR(30)     NOT NULL,
    website           VARCHAR(200)        NULL,
    city              VARCHAR(80)     NOT NULL,
    logo_url          VARCHAR(300)        NULL,
    created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (organisation_id),
    UNIQUE KEY uq_organisations_name (name)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Table 2: categories
-- Event categories / causes used on the Search page as a filter
-- (e.g. Fun Run, Gala Dinner, Auction, Concert, Community Drive).
-- One category can classify many events  (1 : M with events).
-- ---------------------------------------------------------------------
CREATE TABLE categories (
    category_id   INT           NOT NULL AUTO_INCREMENT,
    category_name VARCHAR(60)   NOT NULL,
    description   VARCHAR(255)  NOT NULL,
    PRIMARY KEY (category_id),
    UNIQUE KEY uq_categories_name (category_name)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Table 3: events
-- The core entity of the case study. Each event belongs to exactly one
-- organisation and exactly one category.
--
--   organisations 1 --- M events M --- 1 categories
--
-- status : 'active'    -> open for public registration, shown on the site
--          'suspended' -> violates policy, must NOT be shown on the Home page
--          'cancelled' -> cancelled by the organisation
-- ---------------------------------------------------------------------
CREATE TABLE events (
    event_id        INT             NOT NULL AUTO_INCREMENT,
    organisation_id INT             NOT NULL,
    category_id     INT             NOT NULL,
    event_name      VARCHAR(150)    NOT NULL,
    short_summary   VARCHAR(255)    NOT NULL,
    full_description TEXT           NOT NULL,
    purpose         VARCHAR(500)    NOT NULL,
    event_date      DATE            NOT NULL,
    start_time      TIME            NOT NULL,
    end_time        TIME            NOT NULL,
    location_name   VARCHAR(150)    NOT NULL,
    address         VARCHAR(200)    NOT NULL,
    suburb          VARCHAR(80)     NOT NULL,
    city            VARCHAR(80)     NOT NULL,
    ticket_price    DECIMAL(8, 2)   NOT NULL DEFAULT 0.00,
    is_free         TINYINT(1)      NOT NULL DEFAULT 0,
    goal_amount     DECIMAL(10, 2)  NOT NULL DEFAULT 0.00,
    raised_amount   DECIMAL(10, 2)  NOT NULL DEFAULT 0.00,
    capacity        INT             NOT NULL DEFAULT 0,
    image_url       VARCHAR(300)        NULL,
    status          ENUM('active', 'suspended', 'cancelled') NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id),
    KEY idx_events_date (event_date),
    KEY idx_events_city (city),
    KEY idx_events_status (status),
    KEY idx_events_category (category_id),
    KEY idx_events_organisation (organisation_id),
    CONSTRAINT fk_events_organisation
        FOREIGN KEY (organisation_id) REFERENCES organisations (organisation_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_events_category
        FOREIGN KEY (category_id) REFERENCES categories (category_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_events_amounts CHECK (raised_amount >= 0 AND goal_amount >= 0),
    CONSTRAINT chk_events_ticket   CHECK (ticket_price >= 0)
) ENGINE = InnoDB;

-- =====================================================================
--  Entity relationship summary
-- =====================================================================
--  organisations (1) ────< events >──── (1) categories
--
--  organisations.organisation_id  PK  <──  events.organisation_id  FK
--  categories.category_id         PK  <──  events.category_id     FK
--
--  A3 extension plan (NOT created in A2, documented for the report):
--    users (1) ────< registrations >──── (1) events
--    where registrations stores the ticket purchase / donation record.
-- =====================================================================
