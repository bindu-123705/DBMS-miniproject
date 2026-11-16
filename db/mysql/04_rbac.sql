-- =====================================================================
-- EvePort : role-based access control INSIDE MySQL
-- Four database accounts, one per application role.  The Next.js API
-- opens a connection pool with the account that matches the logged-in
-- user's role, so a student session literally cannot DELETE a club even
-- if the API code had a bug.  Run as root after 03_routines.sql.
-- Change the passwords and mirror them in .env.local
-- =====================================================================
USE eveport;

CREATE ROLE IF NOT EXISTS r_auth, r_student, r_head, r_admin;

-- ---- r_auth : login only -------------------------------------------
GRANT EXECUTE ON PROCEDURE eveport.sp_login TO r_auth;

-- ---- r_student : read the portal, write only through procedures ----
GRANT SELECT ON eveport.CLUB          TO r_student;
GRANT SELECT ON eveport.EVENT         TO r_student;
GRANT SELECT ON eveport.POST          TO r_student;
GRANT SELECT ON eveport.MEMBER_OF     TO r_student;
GRANT SELECT ON eveport.REGISTERS_FOR TO r_student;
GRANT SELECT ON eveport.LIKES         TO r_student;
GRANT SELECT ON eveport.PROFILE       TO r_student;
GRANT SELECT ON eveport.v_event_stats TO r_student;
GRANT SELECT (user_id, name, srn, email, role, created_at) ON eveport.`USER` TO r_student;  -- no password_hash
GRANT UPDATE (photo_url, about, resume_url, social_links) ON eveport.PROFILE TO r_student;
GRANT EXECUTE ON FUNCTION  eveport.fn_like_count        TO r_student;
GRANT EXECUTE ON FUNCTION  eveport.fn_seats_left        TO r_student;
GRANT EXECUTE ON FUNCTION  eveport.fn_club_member_count TO r_student;
GRANT EXECUTE ON FUNCTION  eveport.fn_can_manage_club   TO r_student;
GRANT EXECUTE ON PROCEDURE eveport.sp_register_for_event  TO r_student;
GRANT EXECUTE ON PROCEDURE eveport.sp_cancel_registration TO r_student;
GRANT EXECUTE ON PROCEDURE eveport.sp_toggle_like         TO r_student;
GRANT EXECUTE ON PROCEDURE eveport.sp_create_post         TO r_student;

-- ---- r_head : everything a student can + club management -----------
GRANT r_student TO r_head;
GRANT EXECUTE ON PROCEDURE eveport.sp_review_post     TO r_head;
GRANT EXECUTE ON PROCEDURE eveport.sp_add_member      TO r_head;
GRANT EXECUTE ON PROCEDURE eveport.sp_remove_member   TO r_head;
GRANT EXECUTE ON PROCEDURE eveport.sp_create_event    TO r_head;
GRANT EXECUTE ON PROCEDURE eveport.sp_mark_attendance TO r_head;
GRANT EXECUTE ON PROCEDURE eveport.sp_finalize_event  TO r_head;
GRANT DELETE ON eveport.EVENT TO r_head;           -- cancel an event
GRANT UPDATE (status) ON eveport.POST TO r_head;   -- archive a post

-- ---- r_admin : full control of the eveport schema ------------------
GRANT ALL PRIVILEGES ON eveport.* TO r_admin;

-- ---- accounts ------------------------------------------------------
CREATE USER IF NOT EXISTS 'ep_auth'@'%'    IDENTIFIED BY 'Auth@12345';
CREATE USER IF NOT EXISTS 'ep_student'@'%' IDENTIFIED BY 'Student@12345';
CREATE USER IF NOT EXISTS 'ep_head'@'%'    IDENTIFIED BY 'Head@12345';
CREATE USER IF NOT EXISTS 'ep_admin'@'%'   IDENTIFIED BY 'Admin@12345';
GRANT r_auth    TO 'ep_auth'@'%';
GRANT r_student TO 'ep_student'@'%';
GRANT r_head    TO 'ep_head'@'%';
GRANT r_admin   TO 'ep_admin'@'%';
SET DEFAULT ROLE ALL TO 'ep_auth'@'%', 'ep_student'@'%', 'ep_head'@'%', 'ep_admin'@'%';
FLUSH PRIVILEGES;

-- ---- demonstrate it (run each as the named account) ----------------
-- mysql -u ep_student -p eveport -e "DELETE FROM CLUB WHERE club_id=1;"   -> ERROR 1142 (denied)
-- mysql -u ep_student -p eveport -e "SELECT password_hash FROM \`USER\`;"  -> ERROR 1143 (denied)
-- mysql -u ep_head    -p eveport -e "CALL sp_review_post(1, 7, 'published');"  -> OK
-- SHOW GRANTS FOR 'ep_student'@'%' USING r_student;
