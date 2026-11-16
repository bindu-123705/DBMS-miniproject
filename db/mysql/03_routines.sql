-- =====================================================================
-- EvePort : functions, stored procedures, triggers, views
-- Run AFTER 02_seed.sql.  mysql -u root -p < 03_routines.sql
-- Business rules are enforced here, in the database, so they hold no
-- matter which client talks to it.
-- Procedures raise SQLSTATE '45000' with a readable message; the API
-- turns that message into an HTTP 400/403.
-- =====================================================================
USE eveport;
DELIMITER $$

-- ============================ FUNCTIONS ==============================
CREATE FUNCTION fn_like_count(p_post INT) RETURNS INT
READS SQL DATA
BEGIN
  RETURN (SELECT COUNT(*) FROM LIKES WHERE post_id = p_post);
END$$

CREATE FUNCTION fn_seats_left(p_event INT) RETURNS INT
READS SQL DATA
BEGIN
  DECLARE v_cap INT;
  DECLARE v_taken INT;
  SELECT capacity INTO v_cap FROM EVENT WHERE event_id = p_event;
  IF v_cap IS NULL THEN RETURN NULL; END IF;
  SELECT COUNT(*) INTO v_taken FROM REGISTERS_FOR
   WHERE event_id = p_event AND attendance_status <> 'cancelled';
  RETURN v_cap - v_taken;
END$$

CREATE FUNCTION fn_club_member_count(p_club INT) RETURNS INT
READS SQL DATA
BEGIN
  RETURN (SELECT COUNT(*) FROM MEMBER_OF WHERE club_id = p_club);
END$$

-- 1 if the user may manage the club (its head, or an admin)
CREATE FUNCTION fn_can_manage_club(p_user INT, p_club INT) RETURNS TINYINT
READS SQL DATA
BEGIN
  RETURN EXISTS (SELECT 1 FROM CLUB WHERE club_id = p_club AND head_id = p_user)
      OR EXISTS (SELECT 1 FROM `USER` WHERE user_id = p_user AND role = 'admin');
END$$

-- ============================ PROCEDURES =============================

-- Used only by the login endpoint (the only thing the auth DB user can run)
CREATE PROCEDURE sp_login(IN p_identifier VARCHAR(150))
BEGIN
  SELECT user_id, name, srn, email, role, password_hash
    FROM `USER` WHERE email = p_identifier OR srn = p_identifier LIMIT 1;
END$$

-- Register (or re-register after cancelling). Row-locks the event so two
-- students cannot take the last seat at the same time.
CREATE PROCEDURE sp_register_for_event(IN p_user INT, IN p_event INT)
proc: BEGIN
  DECLARE v_date DATETIME;
  DECLARE v_status VARCHAR(20);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SELECT event_date INTO v_date FROM EVENT WHERE event_id = p_event FOR UPDATE;
  IF v_date IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Event not found';
  END IF;
  IF v_date < NOW() THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Registration closed: event already happened';
  END IF;

  SELECT attendance_status INTO v_status FROM REGISTERS_FOR
   WHERE user_id = p_user AND event_id = p_event;
  IF v_status IS NOT NULL AND v_status <> 'cancelled' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Already registered for this event';
  END IF;

  IF v_status = 'cancelled' THEN
    UPDATE REGISTERS_FOR SET attendance_status = 'registered', registered_at = NOW()
     WHERE user_id = p_user AND event_id = p_event;      -- capacity trigger fires
  ELSE
    INSERT INTO REGISTERS_FOR (user_id, event_id) VALUES (p_user, p_event);
  END IF;
  COMMIT;
  SELECT 'registered' AS result, fn_seats_left(p_event) AS seats_left;
END$$

CREATE PROCEDURE sp_cancel_registration(IN p_user INT, IN p_event INT)
BEGIN
  DECLARE v_date DATETIME;
  SELECT event_date INTO v_date FROM EVENT WHERE event_id = p_event;
  IF v_date IS NOT NULL AND v_date < NOW() THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot cancel: event already happened';
  END IF;
  UPDATE REGISTERS_FOR SET attendance_status = 'cancelled'
   WHERE user_id = p_user AND event_id = p_event AND attendance_status = 'registered';
  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No active registration to cancel';
  END IF;
  SELECT 'cancelled' AS result;
END$$

-- Like / unlike in one call
CREATE PROCEDURE sp_toggle_like(IN p_user INT, IN p_post INT)
BEGIN
  DECLARE v_status VARCHAR(20);
  DECLARE v_liked TINYINT DEFAULT 0;
  SELECT status INTO v_status FROM POST WHERE post_id = p_post;
  IF v_status IS NULL OR v_status <> 'published' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Post not found or not published';
  END IF;
  IF EXISTS (SELECT 1 FROM LIKES WHERE user_id = p_user AND post_id = p_post) THEN
    DELETE FROM LIKES WHERE user_id = p_user AND post_id = p_post;
  ELSE
    INSERT INTO LIKES (user_id, post_id) VALUES (p_user, p_post);
    SET v_liked = 1;
  END IF;
  SELECT v_liked AS liked, fn_like_count(p_post) AS likes;
END$$

-- Head/admin posts go live immediately; members' posts wait for approval.
CREATE PROCEDURE sp_create_post(IN p_user INT, IN p_club INT, IN p_title VARCHAR(150), IN p_caption TEXT)
BEGIN
  DECLARE v_status VARCHAR(20);
  IF NOT EXISTS (SELECT 1 FROM CLUB WHERE club_id = p_club) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Club not found';
  END IF;
  IF fn_can_manage_club(p_user, p_club) THEN
    SET v_status = 'published';
  ELSEIF EXISTS (SELECT 1 FROM MEMBER_OF WHERE user_id = p_user AND club_id = p_club) THEN
    SET v_status = 'pending';
  ELSE
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only club members can post in this club';
  END IF;
  INSERT INTO POST (club_id, author_id, title, caption, status)
  VALUES (p_club, p_user, p_title, p_caption, v_status);
  SELECT LAST_INSERT_ID() AS post_id, v_status AS status;
END$$

CREATE PROCEDURE sp_review_post(IN p_reviewer INT, IN p_post INT, IN p_status VARCHAR(20))
BEGIN
  DECLARE v_club INT;
  DECLARE v_author INT;
  DECLARE v_title VARCHAR(150);
  IF p_status NOT IN ('published','rejected','archived') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid status';
  END IF;
  SELECT club_id, author_id, title INTO v_club, v_author, v_title FROM POST WHERE post_id = p_post;
  IF v_club IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Post not found';
  END IF;
  IF NOT fn_can_manage_club(p_reviewer, v_club) THEN
    SIGNAL SQLSTATE '42000' SET MESSAGE_TEXT = 'Only the club head can review posts';
  END IF;
  UPDATE POST SET status = p_status WHERE post_id = p_post;
  SELECT v_author AS author_id, v_title AS title, p_status AS status;
END$$

CREATE PROCEDURE sp_add_member(IN p_actor INT, IN p_club INT, IN p_srn VARCHAR(20))
BEGIN
  DECLARE v_user INT;
  IF NOT fn_can_manage_club(p_actor, p_club) THEN
    SIGNAL SQLSTATE '42000' SET MESSAGE_TEXT = 'Only the club head can add members';
  END IF;
  SELECT user_id INTO v_user FROM `USER` WHERE srn = p_srn;
  IF v_user IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No student with that SRN';
  END IF;
  IF EXISTS (SELECT 1 FROM MEMBER_OF WHERE user_id = v_user AND club_id = p_club) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Already a member';
  END IF;
  INSERT INTO MEMBER_OF (user_id, club_id) VALUES (v_user, p_club);
  SELECT v_user AS user_id;
END$$

CREATE PROCEDURE sp_remove_member(IN p_actor INT, IN p_club INT, IN p_user INT)
BEGIN
  IF NOT fn_can_manage_club(p_actor, p_club) THEN
    SIGNAL SQLSTATE '42000' SET MESSAGE_TEXT = 'Only the club head can remove members';
  END IF;
  DELETE FROM MEMBER_OF WHERE user_id = p_user AND club_id = p_club;  -- trigger protects the head
  SELECT ROW_COUNT() AS removed;
END$$

CREATE PROCEDURE sp_create_event(IN p_actor INT, IN p_club INT, IN p_title VARCHAR(150),
    IN p_desc TEXT, IN p_venue VARCHAR(150), IN p_date DATETIME, IN p_capacity INT)
BEGIN
  IF NOT fn_can_manage_club(p_actor, p_club) THEN
    SIGNAL SQLSTATE '42000' SET MESSAGE_TEXT = 'Only the club head can create events';
  END IF;
  IF p_date <= NOW() THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Event date must be in the future';
  END IF;
  INSERT INTO EVENT (club_id, created_by, title, description, venue, event_date, capacity)
  VALUES (p_club, p_actor, p_title, p_desc, p_venue, p_date, p_capacity);
  SELECT LAST_INSERT_ID() AS event_id;
END$$

CREATE PROCEDURE sp_mark_attendance(IN p_actor INT, IN p_event INT, IN p_user INT, IN p_status VARCHAR(20))
BEGIN
  DECLARE v_club INT;
  SELECT club_id INTO v_club FROM EVENT WHERE event_id = p_event;
  IF v_club IS NULL OR NOT fn_can_manage_club(p_actor, v_club) THEN
    SIGNAL SQLSTATE '42000' SET MESSAGE_TEXT = 'Only the hosting club head can mark attendance';
  END IF;
  IF p_status NOT IN ('attended','absent') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Status must be attended or absent';
  END IF;
  UPDATE REGISTERS_FOR SET attendance_status = p_status
   WHERE user_id = p_user AND event_id = p_event AND attendance_status <> 'cancelled';
  SELECT ROW_COUNT() AS updated;
END$$

-- CURSOR demo: after an event, everyone still 'registered' becomes 'absent'
CREATE PROCEDURE sp_finalize_event(IN p_actor INT, IN p_event INT)
BEGIN
  DECLARE v_club INT;
  DECLARE v_uid INT;
  DECLARE v_done TINYINT DEFAULT 0;
  DECLARE v_count INT DEFAULT 0;
  DECLARE cur CURSOR FOR
    SELECT user_id FROM REGISTERS_FOR WHERE event_id = p_event AND attendance_status = 'registered';
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  SELECT club_id INTO v_club FROM EVENT WHERE event_id = p_event AND event_date < NOW();
  IF v_club IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Event not found or has not happened yet';
  END IF;
  IF NOT fn_can_manage_club(p_actor, v_club) THEN
    SIGNAL SQLSTATE '42000' SET MESSAGE_TEXT = 'Only the hosting club head can finalize an event';
  END IF;

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO v_uid;
    IF v_done = 1 THEN LEAVE read_loop; END IF;
    UPDATE REGISTERS_FOR SET attendance_status = 'absent' WHERE user_id = v_uid AND event_id = p_event;
    SET v_count = v_count + 1;
  END LOOP;
  CLOSE cur;
  SELECT v_count AS marked_absent;
END$$

-- Admin: create a club and make a student its head (trigger does the rest)
CREATE PROCEDURE sp_create_club(IN p_actor INT, IN p_name VARCHAR(100), IN p_desc TEXT, IN p_head_srn VARCHAR(20))
BEGIN
  DECLARE v_head INT;
  IF NOT EXISTS (SELECT 1 FROM `USER` WHERE user_id = p_actor AND role = 'admin') THEN
    SIGNAL SQLSTATE '42000' SET MESSAGE_TEXT = 'Only an admin can create clubs';
  END IF;
  SELECT user_id INTO v_head FROM `USER` WHERE srn = p_head_srn;
  IF v_head IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No student with that SRN';
  END IF;
  INSERT INTO CLUB (name, description, head_id) VALUES (p_name, p_desc, v_head);
  SELECT LAST_INSERT_ID() AS club_id;
END$$

-- ============================= TRIGGERS ==============================

-- Never allow more active registrations than capacity
CREATE TRIGGER trg_reg_capacity_ins BEFORE INSERT ON REGISTERS_FOR
FOR EACH ROW
BEGIN
  IF NEW.attendance_status <> 'cancelled' AND fn_seats_left(NEW.event_id) <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Event is full';
  END IF;
END$$

CREATE TRIGGER trg_reg_capacity_upd BEFORE UPDATE ON REGISTERS_FOR
FOR EACH ROW
BEGIN
  IF OLD.attendance_status = 'cancelled' AND NEW.attendance_status <> 'cancelled'
     AND fn_seats_left(NEW.event_id) <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Event is full';
  END IF;
END$$

-- New user -> empty PROFILE row (keeps the 1:1 relationship total)
CREATE TRIGGER trg_user_profile AFTER INSERT ON `USER`
FOR EACH ROW
BEGIN
  INSERT IGNORE INTO PROFILE (user_id, social_links) VALUES (NEW.user_id, JSON_OBJECT());
END$$

-- New club -> head becomes a member and gets the club_head role
CREATE TRIGGER trg_club_head AFTER INSERT ON CLUB
FOR EACH ROW
BEGIN
  INSERT IGNORE INTO MEMBER_OF (user_id, club_id) VALUES (NEW.head_id, NEW.club_id);
  UPDATE `USER` SET role = 'club_head' WHERE user_id = NEW.head_id AND role = 'student';
END$$

-- The head cannot be removed from their own club
CREATE TRIGGER trg_protect_head BEFORE DELETE ON MEMBER_OF
FOR EACH ROW
BEGIN
  IF EXISTS (SELECT 1 FROM CLUB WHERE club_id = OLD.club_id AND head_id = OLD.user_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'The club head cannot be removed from the club';
  END IF;
END$$

-- Events must be created by the club's head or an admin
CREATE TRIGGER trg_event_creator BEFORE INSERT ON EVENT
FOR EACH ROW
BEGIN
  IF NOT fn_can_manage_club(NEW.created_by, NEW.club_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only the club head or an admin can create events';
  END IF;
END$$

-- Audit every moderation decision
CREATE TRIGGER trg_post_status_audit AFTER UPDATE ON POST
FOR EACH ROW
BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO AUDIT_LOG (table_name, record_id, action, details)
    VALUES ('POST', NEW.post_id, 'STATUS_CHANGE', CONCAT(OLD.status, ' -> ', NEW.status));
  END IF;
END$$

DELIMITER ;

-- =============================== VIEWS ===============================
CREATE OR REPLACE VIEW v_event_stats AS
SELECT e.event_id, e.title, c.name AS club, e.event_date, e.capacity,
       SUM(rf.attendance_status <> 'cancelled')            AS active_regs,
       SUM(rf.attendance_status = 'attended')              AS attended,
       ROUND(100 * SUM(rf.attendance_status <> 'cancelled') / e.capacity, 1) AS fill_pct
FROM EVENT e
JOIN CLUB c ON c.club_id = e.club_id
LEFT JOIN REGISTERS_FOR rf ON rf.event_id = e.event_id
GROUP BY e.event_id, e.title, c.name, e.event_date, e.capacity;
