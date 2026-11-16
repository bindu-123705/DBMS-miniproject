-- =====================================================================
-- EvePort : MySQL 8+ schema (relational half of the hybrid design)
-- MySQL  : USER, PROFILE, CLUB, EVENT, POST, MEMBER_OF, REGISTERS_FOR,
--          LIKES (+ AUDIT_LOG written by triggers)
-- MongoDB: NOTIFICATIONS, MEDIA, COMMENTS (multivalued composite
--          attributes of the ER diagram) -> db/mongo/eveport_mongodb.js
-- Run order: 01_schema -> 02_seed -> 03_routines -> 04_rbac
-- =====================================================================
DROP DATABASE IF EXISTS eveport;
CREATE DATABASE eveport CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eveport;

CREATE TABLE `USER` (
    user_id        INT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    srn            VARCHAR(20)  UNIQUE,                       -- NULL only for admin
    email          VARCHAR(150) NOT NULL UNIQUE,
    password_hash  VARCHAR(100) NOT NULL,
    role           ENUM('student','club_head','admin') NOT NULL DEFAULT 'student',
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_user_email CHECK (email LIKE '%_@_%._%'),
    CONSTRAINT chk_user_srn   CHECK (srn IS NULL OR srn REGEXP '^PES[0-9]UG[0-9]{2}[A-Z]{2}[0-9]{3}$'),
    CONSTRAINT chk_user_srn_required CHECK (role = 'admin' OR srn IS NOT NULL)
);

-- 1:1 with USER (shared primary key)
CREATE TABLE PROFILE (
    user_id      INT PRIMARY KEY,
    photo_url    VARCHAR(255),
    about        TEXT,
    resume_url   VARCHAR(255),
    social_links JSON,
    CONSTRAINT fk_profile_user FOREIGN KEY (user_id)
        REFERENCES `USER`(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE CLUB (
    club_id      INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL UNIQUE,
    description  TEXT,
    head_id      INT NOT NULL,                                 -- "heads" 1:N
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_club_head FOREIGN KEY (head_id)
        REFERENCES `USER`(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE EVENT (
    event_id     INT AUTO_INCREMENT PRIMARY KEY,
    club_id      INT NOT NULL,                                 -- "hosts" 1:N
    created_by   INT NOT NULL,                                 -- "creates" 1:N
    title        VARCHAR(150) NOT NULL,
    description  TEXT,
    venue        VARCHAR(150) NOT NULL,
    event_date   DATETIME NOT NULL,
    capacity     INT NOT NULL,
    CONSTRAINT chk_event_capacity CHECK (capacity > 0),
    CONSTRAINT uq_event UNIQUE (club_id, title, event_date),
    CONSTRAINT fk_event_club FOREIGN KEY (club_id)
        REFERENCES CLUB(club_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_event_creator FOREIGN KEY (created_by)
        REFERENCES `USER`(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- status: member posts start as 'pending'; head approves ('published') or rejects
CREATE TABLE POST (
    post_id      INT AUTO_INCREMENT PRIMARY KEY,
    club_id      INT NOT NULL,                                 -- "publishes" 1:N
    author_id    INT NOT NULL,                                 -- "authors" 1:N
    title        VARCHAR(150) NOT NULL,
    caption      TEXT,
    status       ENUM('pending','published','rejected','archived') NOT NULL DEFAULT 'pending',
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_post_club FOREIGN KEY (club_id)
        REFERENCES CLUB(club_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_post_author FOREIGN KEY (author_id)
        REFERENCES `USER`(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ---------------------- M:N relationships ----------------------------
CREATE TABLE MEMBER_OF (
    user_id    INT NOT NULL,
    club_id    INT NOT NULL,
    joined_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, club_id),
    CONSTRAINT fk_member_user FOREIGN KEY (user_id)
        REFERENCES `USER`(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_member_club FOREIGN KEY (club_id)
        REFERENCES CLUB(club_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE REGISTERS_FOR (
    user_id            INT NOT NULL,
    event_id           INT NOT NULL,
    registered_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    attendance_status  ENUM('registered','attended','absent','cancelled') NOT NULL DEFAULT 'registered',
    PRIMARY KEY (user_id, event_id),
    CONSTRAINT fk_reg_user FOREIGN KEY (user_id)
        REFERENCES `USER`(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_reg_event FOREIGN KEY (event_id)
        REFERENCES EVENT(event_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE LIKES (
    user_id     INT NOT NULL,
    post_id     INT NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, post_id),
    CONSTRAINT fk_like_user FOREIGN KEY (user_id)
        REFERENCES `USER`(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_like_post FOREIGN KEY (post_id)
        REFERENCES POST(post_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Written only by triggers (see 03_routines.sql)
CREATE TABLE AUDIT_LOG (
    log_id      INT AUTO_INCREMENT PRIMARY KEY,
    table_name  VARCHAR(30)  NOT NULL,
    record_id   INT          NOT NULL,
    action      VARCHAR(30)  NOT NULL,
    details     VARCHAR(255),
    logged_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------- Indexes --------------------------------
CREATE INDEX idx_event_club   ON EVENT(club_id);
CREATE INDEX idx_event_date   ON EVENT(event_date);
CREATE INDEX idx_post_club    ON POST(club_id, status);
CREATE INDEX idx_post_author  ON POST(author_id);
CREATE INDEX idx_reg_event    ON REGISTERS_FOR(event_id, attendance_status);
CREATE INDEX idx_like_post    ON LIKES(post_id);
CREATE INDEX idx_member_club  ON MEMBER_OF(club_id);
