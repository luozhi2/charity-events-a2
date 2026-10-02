/**
 * event_db.js
 * ---------------------------------------------------------------------
 * PROG2002 Web Development II - Assessment 2
 *
 * This is the required Node.js database connection file. It creates and
 * exports a MySQL connection pool for the "charityevents_db" database.
 *
 * A pool (instead of a single connection) is used because the API can
 * receive several requests at the same time; the pool reuses open
 * connections and hands them back when a query finishes.
 *
 * Connection settings are read from environment variables so that the
 * marker can run this project on their own computer without editing the
 * code. Copy ".env.example" to ".env" and fill in your MySQL password.
 *
 *   npm install
 *   node server.js
 * ---------------------------------------------------------------------
 */

'use strict';

const mysql = require('mysql2');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'charityevents_db',

    // Return DECIMAL and DATE columns as JavaScript values rather than
    // strings so the route handlers can format them consistently.
    decimalNumbers: true,
    dateStrings: ['DATE'],

    // Keep the pool small and predictable for a local development setup.
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// The pool is created once and shared by every route module.
const pool = mysql.createPool(dbConfig);

// mysql2 exposes two APIs on the same pool. The callback API returns a Query
// object that happens to have a .then() method, so "await pool.execute()"
// resolves to the Query itself rather than to the rows. Taking the promise
// wrapper once, here, guarantees that every query in the project awaits real
// rows:  const [rows] = await poolPromise.execute(sql, params)
const poolPromise = pool.promise();

/**
 * Runs a parameterised query and returns just the rows.
 *
 * Every SQL statement in this project goes through this one function, so
 * every value reaches MySQL as a bound parameter (the "?" placeholders) and
 * can never be concatenated into the statement text.
 *
 * @param {string} sql    Parameterised SQL statement (always use "?" placeholders).
 * @param {Array}  params Values bound to the "?" placeholders.
 * @returns {Promise<Array>} The rows returned by MySQL.
 */
async function query(sql, params = []) {
    const [rows] = await poolPromise.execute(sql, params);
    return rows;
}

/**
 * Checks that the API can actually reach MySQL. Used by server.js on
 * start-up and by scripts/test_connection.js.
 *
 * @returns {Promise<{database: string, eventCount: number}>}
 */
async function testConnection() {
    const rows = await query('SELECT DATABASE() AS db_name, COUNT(*) AS event_count FROM events');
    return {
        database: rows[0].db_name,
        eventCount: Number(rows[0].event_count)
    };
}

module.exports = { pool, poolPromise, query, testConnection, dbConfig };
