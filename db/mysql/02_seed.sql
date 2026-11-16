-- =====================================================================
-- EvePort : seed data for the MySQL tables (all passwords: Password@123)
-- NOTIFICATION / MEDIA / COMMENTS seed data lives in MongoDB.
-- admin login : lakshmi.rao@pes.edu     head : aarav.sharma@pes.edu
-- student     : vikram.patil@pes.edu (or SRN PES1UG22CS401)
-- =====================================================================
USE eveport;

-- USER (10)
INSERT INTO `USER` (user_id, name, srn, email, password_hash, role, created_at) VALUES
(1,  'Aarav Sharma',     'PES1UG23CS001', 'aarav.sharma@pes.edu',    '$2a$10$y1YYxmrQclPJo5Z03y85Hu3Z.dJ1BUHlgF6SfAeORqWcQKjOIWrTK', 'club_head', '2025-08-04 10:12:00'),
(2,  'Ananya Iyer',      'PES1UG23EC045', 'ananya.iyer@pes.edu',     '$2a$10$y1YYxmrQclPJo5Z03y85Hu3Z.dJ1BUHlgF6SfAeORqWcQKjOIWrTK', 'club_head', '2025-08-04 10:25:00'),
(3,  'Rohan Gowda',      'PES1UG22CS312', 'rohan.gowda@pes.edu',     '$2a$10$y1YYxmrQclPJo5Z03y85Hu3Z.dJ1BUHlgF6SfAeORqWcQKjOIWrTK', 'club_head', '2024-08-05 09:40:00'),
(4,  'Priya Nair',       'PES1UG23ME078', 'priya.nair@pes.edu',      '$2a$10$y1YYxmrQclPJo5Z03y85Hu3Z.dJ1BUHlgF6SfAeORqWcQKjOIWrTK', 'club_head', '2025-08-05 11:05:00'),
(5,  'Kabir Singh',      'PES1UG22EC156', 'kabir.singh@pes.edu',     '$2a$10$y1YYxmrQclPJo5Z03y85Hu3Z.dJ1BUHlgF6SfAeORqWcQKjOIWrTK', 'club_head', '2024-08-06 14:30:00'),
(6,  'Sneha Reddy',      'PES1UG23CS210', 'sneha.reddy@pes.edu',     '$2a$10$y1YYxmrQclPJo5Z03y85Hu3Z.dJ1BUHlgF6SfAeORqWcQKjOIWrTK', 'club_head', '2025-08-06 15:10:00'),
(7,  'Arjun Menon',      'PES1UG21CS089', 'arjun.menon@pes.edu',     '$2a$10$y1YYxmrQclPJo5Z03y85Hu3Z.dJ1BUHlgF6SfAeORqWcQKjOIWrTK', 'club_head', '2023-08-07 09:15:00'),
(8,  'Meera Krishnan',   'PES1UG23BT034', 'meera.krishnan@pes.edu',  '$2a$10$y1YYxmrQclPJo5Z03y85Hu3Z.dJ1BUHlgF6SfAeORqWcQKjOIWrTK', 'club_head', '2025-08-07 12:45:00'),
(9,  'Vikram Patil',     'PES1UG22CS401', 'vikram.patil@pes.edu',    '$2a$10$y1YYxmrQclPJo5Z03y85Hu3Z.dJ1BUHlgF6SfAeORqWcQKjOIWrTK', 'student',   '2024-08-08 10:00:00'),
(10, 'Dr. Lakshmi Rao',  NULL,            'lakshmi.rao@pes.edu',     '$2a$10$y1YYxmrQclPJo5Z03y85Hu3Z.dJ1BUHlgF6SfAeORqWcQKjOIWrTK', 'admin',     '2023-06-15 09:00:00');

-- PROFILE (10)
INSERT INTO PROFILE (user_id, photo_url, about, resume_url, social_links) VALUES
(1,  'https://cdn.eveport.in/photos/aarav.jpg',  'Third-year CSE student from Bengaluru. Loves competitive programming and open source.', 'https://cdn.eveport.in/resumes/aarav_sharma.pdf',  '{"github":"https://github.com/aarav-sharma","linkedin":"https://linkedin.com/in/aarav-sharma"}'),
(2,  'https://cdn.eveport.in/photos/ananya.jpg', 'ECE student from Chennai. Theatre enthusiast and part-time scriptwriter.',              'https://cdn.eveport.in/resumes/ananya_iyer.pdf',   '{"instagram":"https://instagram.com/ananya.iyer","linkedin":"https://linkedin.com/in/ananya-iyer"}'),
(3,  'https://cdn.eveport.in/photos/rohan.jpg',  'Street and wildlife photographer from Mysuru. Shoots on weekends at Bandipur.',         'https://cdn.eveport.in/resumes/rohan_gowda.pdf',   '{"instagram":"https://instagram.com/rohan.clicks","behance":"https://behance.net/rohangowda"}'),
(4,  'https://cdn.eveport.in/photos/priya.jpg',  'Mechanical engineering student from Kochi. Trained in Carnatic vocal music for 10 years.', 'https://cdn.eveport.in/resumes/priya_nair.pdf',   '{"youtube":"https://youtube.com/@priyanairmusic"}'),
(5,  'https://cdn.eveport.in/photos/kabir.jpg',  'Robotics and embedded systems nerd from Chandigarh. Team Vega captain.',                'https://cdn.eveport.in/resumes/kabir_singh.pdf',   '{"github":"https://github.com/kabir-singh","linkedin":"https://linkedin.com/in/kabir-singh"}'),
(6,  'https://cdn.eveport.in/photos/sneha.jpg',  'CSE student from Hyderabad. Kuchipudi dancer and choreographer.',                       'https://cdn.eveport.in/resumes/sneha_reddy.pdf',   '{"instagram":"https://instagram.com/sneha.nritya"}'),
(7,  'https://cdn.eveport.in/photos/arjun.jpg',  'Final-year student from Thiruvananthapuram. Building a fintech startup.',               'https://cdn.eveport.in/resumes/arjun_menon.pdf',   '{"linkedin":"https://linkedin.com/in/arjun-menon","twitter":"https://x.com/arjunbuilds"}'),
(8,  'https://cdn.eveport.in/photos/meera.jpg',  'Biotech student from Pune. Writes Hindi and Marathi poetry.',                           'https://cdn.eveport.in/resumes/meera_krishnan.pdf','{"medium":"https://medium.com/@meerakrishnan"}'),
(9,  'https://cdn.eveport.in/photos/vikram.jpg', 'Backend developer in the making from Kolhapur. Enjoys DSA and chess.',                 'https://cdn.eveport.in/resumes/vikram_patil.pdf',  '{"github":"https://github.com/vikram-patil","leetcode":"https://leetcode.com/vikrampatil"}'),
(10, 'https://cdn.eveport.in/photos/lakshmi.jpg','Faculty coordinator for student activities, Department of Computer Science.',          NULL,                                               '{"linkedin":"https://linkedin.com/in/lakshmi-rao"}');

-- CLUB (8)
INSERT INTO CLUB (club_id, name, description, head_id, created_at) VALUES
(1, 'Code Chronicles',        'Competitive programming, hackathons and open-source contributions.',        1, '2023-09-01 10:00:00'),
(2, 'Rangmanch',              'The drama and theatre society. Nukkad natak, stage plays and mime.',         2, '2023-09-01 10:30:00'),
(3, 'Raaga',                  'The music club covering Hindustani, Carnatic and contemporary Indian music.', 4, '2023-09-02 11:00:00'),
(4, 'Shutterbugs',            'Photography and filmmaking club. Photo walks and monthly challenges.',       3, '2023-09-02 11:30:00'),
(5, 'Team Vega Robotics',     'Builds robots for Robocon India and other national competitions.',           5, '2023-09-03 09:30:00'),
(6, 'E-Cell',                 'Entrepreneurship cell. Startup pitches, mentorship and investor meets.',     7, '2023-09-03 10:15:00'),
(7, 'Nritya',                 'Classical and folk dance society: Bharatanatyam, Kuchipudi, Garba, Bhangra.', 6, '2023-09-04 10:00:00'),
(8, 'Shabd',                  'Literary club for poetry, debates, quizzes and open mics in many Indian languages.', 8, '2023-09-04 11:00:00');

-- EVENT (8)
INSERT INTO EVENT (event_id, club_id, created_by, title, description, venue, event_date, capacity) VALUES
(1, 1, 1, 'HackSphere 2026',               '24-hour inter-college hackathon with problem statements from Indian startups.', 'PES University EC Campus, Seminar Hall 1', '2026-09-26 09:00:00', 200),
(2, 2, 2, 'Rangmanch Winter Play Auditions','Open auditions for the annual winter play based on Premchand stories.',          'PES University RR Campus, Auditorium',    '2026-10-25 16:00:00', 60),
(3, 3, 4, 'Sandhya Raaga: Hindustani Evening','Evening of Hindustani classical music featuring student and guest artists.',   'PES University Amphitheatre',             '2026-11-07 18:30:00', 350),
(4, 4, 3, 'Lalbagh Photo Walk',             'Sunrise photo walk through Lalbagh Botanical Garden, Bengaluru.',                'Lalbagh Botanical Garden, Bengaluru',     '2026-09-20 06:00:00', 40),
(5, 5, 5, 'Robo Wars 2026',                 'Combat robotics and line-follower competition open to engineering colleges.',     'PES University EC Campus, Quadrangle',    '2026-11-14 10:00:00', 150),
(6, 6, 7, 'Startup Pitch Fest',             'Ten student startups pitch to angel investors from Bengaluru and Hyderabad.',     'PES University, Innovation Centre',       '2026-11-21 14:00:00', 120),
(7, 7, 6, 'Garba Night',                    'Navratri celebration with Garba and Dandiya on the campus lawns.',                'PES University RR Campus, Main Lawns',    '2026-10-17 19:00:00', 500),
(8, 8, 8, 'Kavi Sammelan and Open Mic',     'Poetry evening in Hindi, Kannada, Urdu and Marathi.',                             'PES University, Library Courtyard',       '2026-12-05 17:00:00', 100);

-- POST (10)
INSERT INTO POST (post_id, club_id, author_id, title, caption, status, created_at) VALUES
(1,  1, 1, 'HackSphere 2026 Highlights',      'Over 180 participants, 45 teams and one very sleepy winner. Thank you all!',    'published', '2026-09-28 12:00:00'),
(2,  2, 2, 'Auditions Open: Winter Play',     'Premchand''s Idgah, reimagined. Come audition, no experience needed!',          'published', '2026-10-05 18:30:00'),
(3,  3, 4, 'Raag Yaman Rehearsal Peek',       'A sneak peek of our rehearsal for the Sandhya Raaga evening.',                  'published', '2026-10-08 20:15:00'),
(4,  4, 3, 'Sunrise at Lalbagh',              'Golden hour, glass house and 38 photographers. Best shots inside.',             'published', '2026-09-21 09:45:00'),
(5,  5, 5, 'Team Vega at Robocon Regionals',  'Our bot cleared the first round at the regional qualifiers in Pune.',           'published', '2026-10-02 17:00:00'),
(6,  6, 7, 'Startup Pitch Fest Registrations','Pitch your idea to angel investors. Registrations close on 10 November.',        'published', '2026-10-10 11:00:00'),
(7,  7, 6, 'Garba Night Dress Code',          'Chaniya choli and kediyu encouraged. Bring your own dandiya sticks!',           'pending',     '2026-10-12 08:30:00'),
(8,  8, 8, 'Kavi Sammelan Call for Poets',    'Share your original poems in any Indian language. Sign up before 25 November.', 'published', '2026-10-11 19:00:00'),
(9,  1, 9, 'DSA Bootcamp Week 1 Notes',       'Arrays, two pointers and sliding window. Slides and practice sets inside.',     'published', '2026-10-06 21:00:00'),
(10, 3, 4, 'Diwali Mashup Rehearsals',        'Last year''s Diwali mashup, archived for reference.',                           'archived',  '2025-10-18 22:00:00');

-- MEMBER_OF (13)
INSERT IGNORE INTO MEMBER_OF (user_id, club_id, joined_at) VALUES
(1, 1, '2023-09-05 10:00:00'),
(2, 2, '2023-09-05 10:30:00'),
(4, 3, '2023-09-06 11:00:00'),
(3, 4, '2023-09-06 11:30:00'),
(5, 5, '2023-09-07 09:30:00'),
(7, 6, '2023-09-07 10:15:00'),
(6, 7, '2023-09-08 10:00:00'),
(8, 8, '2023-09-08 11:00:00'),
(9, 1, '2024-08-20 16:00:00'),
(6, 2, '2025-08-18 15:30:00'),
(8, 3, '2025-08-19 12:00:00'),
(1, 5, '2025-08-21 17:45:00'),
(9, 5, '2024-08-22 14:20:00');

-- REGISTERS_FOR (15)
INSERT INTO REGISTERS_FOR (user_id, event_id, registered_at, attendance_status) VALUES
(1, 1, '2026-09-10 10:15:00', 'attended'),
(3, 1, '2026-09-10 11:40:00', 'attended'),
(9, 1, '2026-09-11 09:05:00', 'attended'),
(6, 1, '2026-09-12 14:20:00', 'absent'),
(3, 4, '2026-09-05 08:30:00', 'attended'),
(2, 4, '2026-09-06 19:10:00', 'attended'),
(2, 7, '2026-10-09 13:00:00', 'registered'),
(4, 7, '2026-10-09 13:45:00', 'registered'),
(8, 7, '2026-10-10 10:30:00', 'cancelled'),
(1, 5, '2026-10-03 16:00:00', 'registered'),
(5, 5, '2026-10-01 09:00:00', 'registered'),
(7, 6, '2026-10-11 12:10:00', 'registered'),
(6, 2, '2026-10-07 17:20:00', 'registered'),
(8, 3, '2026-10-09 21:00:00', 'registered'),
(1, 8, '2026-10-12 18:45:00', 'registered');

-- LIKES (14)
INSERT INTO LIKES (user_id, post_id, created_at) VALUES
(2,  1, '2026-09-28 13:10:00'),
(3,  1, '2026-09-28 13:45:00'),
(9,  1, '2026-09-28 14:00:00'),
(6,  4, '2026-09-21 10:30:00'),
(1,  4, '2026-09-21 11:15:00'),
(8,  3, '2026-10-08 21:00:00'),
(5,  3, '2026-10-08 21:20:00'),
(1,  5, '2026-10-02 17:40:00'),
(9,  5, '2026-10-02 18:05:00'),
(4,  2, '2026-10-05 19:00:00'),
(7,  6, '2026-10-10 12:30:00'),
(1,  8, '2026-10-11 20:00:00'),
(2,  8, '2026-10-11 20:10:00'),
(3,  9, '2026-10-07 08:15:00');


-- Extra demo students (all passwords: Password@123)
INSERT INTO `USER` (user_id, name, srn, email, password_hash, role, created_at) VALUES
(11, 'Diya Menon',     'PES1UG24CS101', 'diya.menon@pes.edu',     '$2a$10$y1YYxmrQclPJo5Z03y85Hu3Z.dJ1BUHlgF6SfAeORqWcQKjOIWrTK', 'student', '2025-08-10 10:00:00'),
(12, 'Nikhil Rao',     'PES1UG24CS102', 'nikhil.rao@pes.edu',     '$2a$10$y1YYxmrQclPJo5Z03y85Hu3Z.dJ1BUHlgF6SfAeORqWcQKjOIWrTK', 'student', '2025-08-10 10:05:00'),
(13, 'Isha Kulkarni',  'PES1UG24EC055', 'isha.kulkarni@pes.edu',  '$2a$10$y1YYxmrQclPJo5Z03y85Hu3Z.dJ1BUHlgF6SfAeORqWcQKjOIWrTK', 'student', '2025-08-10 10:10:00');
INSERT INTO PROFILE (user_id, photo_url, about, resume_url, social_links) VALUES
(11, NULL, 'Second-year CSE. Learning web dev.',      NULL, '{}'),
(12, NULL, 'Second-year CSE. Likes chess and music.', NULL, '{}'),
(13, NULL, 'Second-year ECE. Photography beginner.',  NULL, '{}');
INSERT INTO MEMBER_OF (user_id, club_id, joined_at) VALUES
(11, 1, '2025-09-01 10:00:00'), (12, 1, '2025-09-02 10:00:00'),
(12, 3, '2025-09-03 10:00:00'), (13, 4, '2025-09-04 10:00:00');
INSERT INTO LIKES (user_id, post_id, created_at) VALUES
(11, 1, '2026-09-28 16:00:00'), (12, 9, '2026-10-07 12:00:00'), (13, 4, '2026-09-21 16:00:00');

SELECT 'USER' tbl, COUNT(*) n FROM `USER` UNION ALL SELECT 'CLUB',COUNT(*) FROM CLUB
UNION ALL SELECT 'EVENT',COUNT(*) FROM EVENT UNION ALL SELECT 'POST',COUNT(*) FROM POST
UNION ALL SELECT 'MEMBER_OF',COUNT(*) FROM MEMBER_OF UNION ALL SELECT 'REGISTERS_FOR',COUNT(*) FROM REGISTERS_FOR
UNION ALL SELECT 'LIKES',COUNT(*) FROM LIKES;
