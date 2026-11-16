-- =====================================================================
-- EvePort : DML, joins, nested / correlated / recursive queries, CTEs
-- Run after 01-04.  Each block is labelled with the rubric item it covers.
-- =====================================================================
USE eveport;

-- ########################  A. DML OPERATIONS  ########################
-- A1 INSERT
INSERT INTO `USER` (name, srn, email, password_hash, role)
VALUES ('Test Student', 'PES1UG25CS999', 'test.student@pes.edu', 'x', 'student');  -- trigger creates PROFILE
-- A2 INSERT ... SELECT : enrol every member of Code Chronicles in Shutterbugs' mailing group (illustrative)
INSERT IGNORE INTO MEMBER_OF (user_id, club_id)
SELECT m.user_id, 4 FROM MEMBER_OF m WHERE m.club_id = 1 AND m.user_id = (SELECT user_id FROM `USER` WHERE srn='PES1UG25CS999');
-- A3 UPDATE with subquery : raise capacity of nearly-full events by 10%
UPDATE EVENT SET capacity = CEIL(capacity * 1.1)
WHERE event_id IN (SELECT event_id FROM v_event_stats WHERE fill_pct >= 90);
-- A4 UPDATE : edit profile
UPDATE PROFILE SET about = 'Updated bio' WHERE user_id = (SELECT user_id FROM `USER` WHERE srn='PES1UG25CS999');
-- A5 DELETE : remove the test user (cascades to PROFILE / MEMBER_OF / LIKES / REGISTERS_FOR)
DELETE FROM `USER` WHERE srn = 'PES1UG25CS999';
-- A6 DELETE with subquery : cancelled registrations of events that already happened
DELETE FROM REGISTERS_FOR
WHERE attendance_status = 'cancelled'
  AND event_id IN (SELECT event_id FROM EVENT WHERE event_date < NOW());

-- ############################  B. JOINS  #############################
-- B1 INNER JOIN (4 tables) : feed
SELECT p.post_id, p.title, c.name AS club, u.name AS author, fn_like_count(p.post_id) AS likes
FROM POST p JOIN CLUB c ON c.club_id = p.club_id JOIN `USER` u ON u.user_id = p.author_id
WHERE p.status = 'published' ORDER BY p.created_at DESC;

-- B2 LEFT JOIN : clubs with no upcoming event
SELECT c.name FROM CLUB c
LEFT JOIN EVENT e ON e.club_id = c.club_id AND e.event_date > NOW()
WHERE e.event_id IS NULL;

-- B3 Many-to-many join : who is registered for what
SELECT u.name, u.srn, e.title, rf.attendance_status
FROM REGISTERS_FOR rf JOIN `USER` u ON u.user_id = rf.user_id JOIN EVENT e ON e.event_id = rf.event_id
ORDER BY e.event_date, u.name;

-- B4 SELF JOIN : pairs of students who share at least one club
SELECT DISTINCT a.name AS student_a, b.name AS student_b
FROM MEMBER_OF m1 JOIN MEMBER_OF m2 ON m1.club_id = m2.club_id AND m1.user_id < m2.user_id
JOIN `USER` a ON a.user_id = m1.user_id JOIN `USER` b ON b.user_id = m2.user_id
LIMIT 20;

-- B5 Aggregation + HAVING : clubs with more than 2 members
SELECT c.name, COUNT(*) AS members FROM CLUB c JOIN MEMBER_OF m ON m.club_id = c.club_id
GROUP BY c.club_id, c.name HAVING COUNT(*) > 2 ORDER BY members DESC;

-- ###################  C. NESTED (SUB-) QUERIES  ######################
-- C1 IN : users who liked a post of a club they are NOT a member of
SELECT DISTINCT u.name FROM `USER` u
WHERE u.user_id IN (
    SELECT l.user_id FROM LIKES l JOIN POST p ON p.post_id = l.post_id
    WHERE p.club_id NOT IN (SELECT m.club_id FROM MEMBER_OF m WHERE m.user_id = l.user_id));

-- C2 NOT EXISTS : users who never registered for any event
SELECT u.name FROM `USER` u
WHERE NOT EXISTS (SELECT 1 FROM REGISTERS_FOR rf WHERE rf.user_id = u.user_id);

-- C3 Scalar subquery + ALL : the most-liked post
SELECT post_id, title FROM POST
WHERE fn_like_count(post_id) >= ALL (SELECT fn_like_count(post_id) FROM POST);

-- C4 Derived table : average fill rate per club
SELECT club, ROUND(AVG(fill_pct),1) AS avg_fill FROM (SELECT * FROM v_event_stats) s GROUP BY club;

-- #####################  D. CORRELATED SUBQUERIES  ####################
-- D1 events with more registrations than the average event of the same club
SELECT e.title, c.name AS club,
       (SELECT COUNT(*) FROM REGISTERS_FOR r WHERE r.event_id = e.event_id AND r.attendance_status <> 'cancelled') AS regs
FROM EVENT e JOIN CLUB c ON c.club_id = e.club_id
WHERE (SELECT COUNT(*) FROM REGISTERS_FOR r WHERE r.event_id = e.event_id AND r.attendance_status <> 'cancelled')
    > (SELECT AVG(cnt) FROM (SELECT e2.club_id, COUNT(r2.user_id) cnt
                             FROM EVENT e2 LEFT JOIN REGISTERS_FOR r2 ON r2.event_id = e2.event_id
                             GROUP BY e2.event_id, e2.club_id) x
       WHERE x.club_id = e.club_id);

-- D2 each user's latest registration (correlated MAX)
SELECT u.name, e.title, rf.registered_at
FROM REGISTERS_FOR rf JOIN `USER` u ON u.user_id = rf.user_id JOIN EVENT e ON e.event_id = rf.event_id
WHERE rf.registered_at = (SELECT MAX(r2.registered_at) FROM REGISTERS_FOR r2 WHERE r2.user_id = rf.user_id);

-- ######################  E. CTE (non-recursive)  #####################
WITH post_stats AS (
    SELECT club_id, COUNT(*) AS posts, SUM(fn_like_count(post_id)) AS likes
    FROM POST WHERE status = 'published' GROUP BY club_id),
event_stats AS (
    SELECT club_id, COUNT(*) AS events FROM EVENT GROUP BY club_id)
SELECT c.name, fn_club_member_count(c.club_id) AS members,
       COALESCE(es.events,0) AS events, COALESCE(ps.posts,0) AS posts, COALESCE(ps.likes,0) AS likes,
       RANK() OVER (ORDER BY COALESCE(ps.likes,0) + 2*COALESCE(es.events,0) DESC) AS activity_rank
FROM CLUB c LEFT JOIN post_stats ps ON ps.club_id = c.club_id LEFT JOIN event_stats es ON es.club_id = c.club_id
ORDER BY activity_rank;

-- ######################  F. RECURSIVE CTE  ###########################
-- Calendar of the next 30 days with the number of events each day (days with no
-- event are kept, which a plain GROUP BY cannot do).
WITH RECURSIVE days (d) AS (
    SELECT CURDATE()
    UNION ALL
    SELECT d + INTERVAL 1 DAY FROM days WHERE d < CURDATE() + INTERVAL 29 DAY)
SELECT days.d AS day, COUNT(e.event_id) AS events, GROUP_CONCAT(e.title SEPARATOR ', ') AS titles
FROM days LEFT JOIN EVENT e ON DATE(e.event_date) = days.d
GROUP BY days.d ORDER BY days.d;

-- ####################  G. WINDOW FUNCTIONS  ##########################
-- Registration order per event + running total
SELECT e.title, u.name, rf.registered_at,
       ROW_NUMBER() OVER (PARTITION BY rf.event_id ORDER BY rf.registered_at) AS reg_no,
       COUNT(*)     OVER (PARTITION BY rf.event_id ORDER BY rf.registered_at) AS running_total
FROM REGISTERS_FOR rf JOIN EVENT e ON e.event_id = rf.event_id JOIN `USER` u ON u.user_id = rf.user_id;

-- ####################  H. EXERCISE THE ROUTINES  #####################
SELECT fn_seats_left(5) AS seats_left_robo_wars, fn_club_member_count(1) AS code_chronicles_members;
CALL sp_toggle_like(11, 2);                       -- like
CALL sp_toggle_like(11, 2);                       -- unlike
CALL sp_register_for_event(11, 3);                -- OK
-- CALL sp_register_for_event(11, 3);             -- ERROR: Already registered
CALL sp_cancel_registration(11, 3);
CALL sp_review_post(6, 7, 'published');           -- Nritya head approves the pending Garba post
SELECT * FROM AUDIT_LOG;                          -- written by trg_post_status_audit
-- CALL sp_review_post(9, 7, 'published');        -- ERROR: Only the club head can review posts
-- DELETE FROM MEMBER_OF WHERE user_id = 1 AND club_id = 1;   -- ERROR: head cannot be removed
