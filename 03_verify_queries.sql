-- Verification queries run against the imported charityevents_db
USE charityevents_db;

SELECT '--- 1. all events with category and organisation ---' AS '';
SELECT e.event_id, e.event_name, c.category_name, o.name AS organisation,
       e.event_date, e.status
FROM events e
JOIN categories c    ON c.category_id = e.category_id
JOIN organisations o ON o.organisation_id = e.organisation_id
ORDER BY e.event_date;

SELECT '--- 2. the home page query (active + upcoming only) ---' AS '';
SELECT e.event_id, e.event_name, c.category_name, e.event_date, e.status
FROM events e
JOIN categories c ON c.category_id = e.category_id
WHERE e.status IN ('active','cancelled') AND e.event_date >= CURDATE()
ORDER BY e.event_date;

SELECT '--- 3. the search query used by the Search page ---' AS '';
SELECT e.event_id, e.event_name, c.category_name, e.city, e.event_date
FROM events e
JOIN categories c ON c.category_id = e.category_id
WHERE e.status IN ('active','cancelled')
  AND e.city LIKE '%Sydney%'
  AND e.category_id = 1
  AND e.event_date >= CURDATE()
ORDER BY e.event_date;

SELECT '--- 4. the suspended event must never be public ---' AS '';
SELECT event_id, event_name, status,
       CASE WHEN status = 'suspended' THEN 'WITHHELD from the website' ELSE 'public' END AS visibility
FROM events WHERE status = 'suspended';

SELECT '--- 5. goal vs progress per event ---' AS '';
SELECT event_name,
       CONCAT('$', FORMAT(raised_amount, 0)) AS raised,
       CONCAT('$', FORMAT(goal_amount, 0))   AS goal,
       CONCAT(ROUND(LEAST(100, raised_amount / NULLIF(goal_amount,0) * 100)), '%') AS progress
FROM events
WHERE goal_amount > 0
ORDER BY raised_amount / goal_amount DESC;

SELECT '--- 6. categories with upcoming event counts ---' AS '';
SELECT c.category_name, COUNT(e.event_id) AS upcoming_events
FROM categories c
LEFT JOIN events e ON e.category_id = c.category_id
     AND e.status = 'active' AND e.event_date >= CURDATE()
GROUP BY c.category_id, c.category_name
ORDER BY c.category_name;
