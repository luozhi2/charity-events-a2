/**
 * scripts/test_connection.js
 * ---------------------------------------------------------------------
 * Quick sanity check: verifies that event_db.js can connect to MySQL and
 * that the sample data has been imported.
 *
 *   node scripts/test_connection.js
 * ---------------------------------------------------------------------
 */

'use strict';

const { testConnection, dbConfig, pool } = require('../event_db');

(async () => {
    console.log('Connecting to MySQL...');
    console.log(`  host     : ${dbConfig.host}:${dbConfig.port}`);
    console.log(`  user     : ${dbConfig.user}`);
    console.log(`  database : ${dbConfig.database}`);

    try {
        const info = await testConnection();
        console.log('\n[OK] Connected successfully.');
        console.log(`[OK] Database "${info.database}" contains ${info.eventCount} events.`);
    } catch (error) {
        console.error('\n[FAILED] Could not query the database.');
        console.error(`  code    : ${error.code}`);
        console.error(`  message : ${error.message}`);
        console.error('\nChecklist:');
        console.error('  1. Is the MySQL server running?');
        console.error('  2. Did you import database/charityevents_db.sql ?');
        console.error('  3. Does api/.env contain the correct DB_USER and DB_PASSWORD?');
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
})();
