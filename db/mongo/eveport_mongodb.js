// =====================================================================
// EvePort : MongoDB part of the hybrid MongoDB + SQL design
// Run with:  mongosh < eveport_mongodb.js     (or load("eveport_mongodb.js"))
//
// Collections used by the Next.js app (lib/mongo.js, app/api/**):
// Two collections hold the embedded (multivalued composite) attributes:
//   user_notifications : one document per USER  -> NOTIFICATIONS[]
//   post_content       : one document per POST  -> MEDIA[] and COMMENTS[]
//
// user_id and post_id are the same IDs used in the MySQL tables
// (USER.user_id, POST.post_id). MongoDB does not enforce them as foreign
// keys, so the application must check they exist in MySQL.
// =====================================================================

const dbx = db.getSiblingDB("eveport");
dbx.dropDatabase();

// ---------------------------------------------------------------------
// 1. COLLECTIONS WITH SCHEMA VALIDATION
// ---------------------------------------------------------------------

dbx.createCollection("user_notifications", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "notifications"],
      properties: {
        user_id: { bsonType: "number", minimum: 1, description: "USER.user_id in MySQL" },
        notifications: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["message", "is_read", "created_at"],
            properties: {
              message:    { bsonType: "string", minLength: 1 },
              is_read:    { bsonType: "bool" },
              created_at: { bsonType: "date" }
            }
          }
        }
      }
    }
  }
});

dbx.createCollection("post_content", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["post_id", "media", "comments"],
      properties: {
        post_id: { bsonType: "number", minimum: 1, description: "POST.post_id in MySQL" },
        media: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["url", "media_type"],
            properties: {
              url:        { bsonType: "string" },
              media_type: { enum: ["image", "video", "audio", "document"] }
            }
          }
        },
        comments: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["comment_id", "user_id", "text", "created_at"],
            properties: {
              comment_id:        { bsonType: "number", minimum: 1, description: "Unique within the post" },
              user_id:           { bsonType: "number", minimum: 1, description: "USER.user_id in MySQL" },
              parent_comment_id: { bsonType: ["number", "null"], description: "null for top-level comments" },
              text:              { bsonType: "string", minLength: 1 },
              created_at:        { bsonType: "date" }
            }
          }
        }
      }
    }
  }
});

// ---------------------------------------------------------------------
// 2. INDEXES
// ---------------------------------------------------------------------

dbx.user_notifications.createIndex({ user_id: 1 }, { unique: true });
dbx.user_notifications.createIndex({ "notifications.is_read": 1 });
dbx.post_content.createIndex({ post_id: 1 }, { unique: true });
dbx.post_content.createIndex({ "comments.user_id": 1 });

// ---------------------------------------------------------------------
// 3. SAMPLE DATA : user_notifications (10 documents, one per USER)
// ---------------------------------------------------------------------

dbx.user_notifications.insertMany([
  {
    user_id: 1,
    notifications: [
      { message: "Your registration for Robo Wars 2026 is confirmed.",                            is_read: true,  created_at: ISODate("2026-10-03T16:01:00+05:30") },
      { message: "Ananya Iyer and 2 others liked your post 'HackSphere 2026 Highlights'.",        is_read: true,  created_at: ISODate("2026-09-28T14:01:00+05:30") },
      { message: "You are registered for Kavi Sammelan and Open Mic on 5 December.",              is_read: false, created_at: ISODate("2026-10-12T18:46:00+05:30") }
    ]
  },
  {
    user_id: 2,
    notifications: [
      { message: "Your registration for Garba Night on 17 October is confirmed.",                 is_read: true,  created_at: ISODate("2026-10-09T13:01:00+05:30") },
      { message: "Sneha Reddy registered for Rangmanch Winter Play Auditions.",                   is_read: false, created_at: ISODate("2026-10-07T17:21:00+05:30") },
      { message: "Sneha Reddy commented on your post 'Auditions Open: Winter Play'.",         is_read: false, created_at: ISODate("2026-10-05T19:41:00+05:30") }
    ]
  },
  {
    user_id: 3,
    notifications: [
      { message: "Thanks for attending HackSphere 2026! Certificates will be emailed soon.",      is_read: true,  created_at: ISODate("2026-09-27T10:00:00+05:30") },
      { message: "Your post 'Sunrise at Lalbagh' received 2 likes.",                              is_read: true,  created_at: ISODate("2026-09-21T11:16:00+05:30") },
      { message: "Vikram Patil commented on your post 'Sunrise at Lalbagh'.",                     is_read: false, created_at: ISODate("2026-09-21T12:40:00+05:30") }
    ]
  },
  {
    user_id: 4,
    notifications: [
      { message: "Your registration for Garba Night on 17 October is confirmed.",                 is_read: true,  created_at: ISODate("2026-10-09T13:46:00+05:30") },
      { message: "Meera Krishnan registered for Sandhya Raaga: Hindustani Evening.",              is_read: false, created_at: ISODate("2026-10-09T21:01:00+05:30") },
      { message: "Your post 'Raag Yaman Rehearsal Peek' received 2 likes.",                       is_read: false, created_at: ISODate("2026-10-08T21:21:00+05:30") },
      { message: "Aarav Sharma commented on your post 'Raag Yaman Rehearsal Peek'.",              is_read: false, created_at: ISODate("2026-10-09T09:15:00+05:30") }
    ]
  },
  {
    user_id: 5,
    notifications: [
      { message: "Robo Wars 2026 now has 2 registrations.",                                       is_read: true,  created_at: ISODate("2026-10-03T16:05:00+05:30") },
      { message: "Vikram Patil liked your post 'Team Vega at Robocon Regionals'.",                is_read: true,  created_at: ISODate("2026-10-02T18:06:00+05:30") },
      { message: "Aarav Sharma commented on your post 'Team Vega at Robocon Regionals'.",         is_read: false, created_at: ISODate("2026-10-02T17:35:00+05:30") }
    ]
  },
  {
    user_id: 6,
    notifications: [
      { message: "Your post 'Garba Night Dress Code' is still saved as a draft.",                 is_read: false, created_at: ISODate("2026-10-13T09:00:00+05:30") },
      { message: "Ananya Iyer registered for Garba Night.",                                       is_read: true,  created_at: ISODate("2026-10-09T13:01:00+05:30") },
      { message: "Meera Krishnan cancelled her registration for Garba Night.",                    is_read: false, created_at: ISODate("2026-10-10T10:31:00+05:30") },
      { message: "Your registration for Rangmanch Winter Play Auditions is confirmed.",           is_read: true,  created_at: ISODate("2026-10-07T17:21:00+05:30") }
    ]
  },
  {
    user_id: 7,
    notifications: [
      { message: "Your registration for Startup Pitch Fest is confirmed.",                        is_read: true,  created_at: ISODate("2026-10-11T12:11:00+05:30") },
      { message: "Startup Pitch Fest registrations close on 10 November. Share the post today!",  is_read: false, created_at: ISODate("2026-10-14T08:00:00+05:30") },
      { message: "Your post 'Startup Pitch Fest Registrations' received a comment.",              is_read: false, created_at: ISODate("2026-10-10T13:20:00+05:30") }
    ]
  },
  {
    user_id: 8,
    notifications: [
      { message: "Your cancellation for Garba Night has been recorded.",                          is_read: true,  created_at: ISODate("2026-10-10T10:31:00+05:30") },
      { message: "Your registration for Sandhya Raaga: Hindustani Evening is confirmed.",         is_read: true,  created_at: ISODate("2026-10-09T21:01:00+05:30") },
      { message: "Aarav Sharma and Ananya Iyer liked your post 'Kavi Sammelan Call for Poets'.",  is_read: false, created_at: ISODate("2026-10-11T20:11:00+05:30") }
    ]
  },
  {
    user_id: 9,
    notifications: [
      { message: "Thanks for attending HackSphere 2026! Your participation badge is ready.",      is_read: true,  created_at: ISODate("2026-09-27T10:05:00+05:30") },
      { message: "Rohan Gowda liked your post 'DSA Bootcamp Week 1 Notes'.",                      is_read: false, created_at: ISODate("2026-10-07T08:16:00+05:30") },
      { message: "Rohan Gowda commented on your post 'DSA Bootcamp Week 1 Notes'.",          is_read: false, created_at: ISODate("2026-10-07T08:21:00+05:30") }
    ]
  },
  {
    user_id: 10,
    notifications: [
      { message: "October activity digest: 8 clubs, 8 events and 10 posts on EvePort.",           is_read: false, created_at: ISODate("2026-10-14T07:00:00+05:30") },
      { message: "Garba Night Dress Code (Nritya) is awaiting review as a draft.",                is_read: false, created_at: ISODate("2026-10-12T08:31:00+05:30") }
    ]
  }
]);

// ---------------------------------------------------------------------
// 4. SAMPLE DATA : post_content (10 documents, one per POST)
//    comment_id is unique within a post; parent_comment_id points to
//    another comment_id in the same post (null = top-level comment).
// ---------------------------------------------------------------------

dbx.post_content.insertMany([
  {
    post_id: 1,   // HackSphere 2026 Highlights
    media: [
      { url: "https://cdn.eveport.in/posts/1/hacksphere_stage.jpg",   media_type: "image" },
      { url: "https://cdn.eveport.in/posts/1/hacksphere_teams.jpg",   media_type: "image" },
      { url: "https://cdn.eveport.in/posts/1/hacksphere_recap.mp4",   media_type: "video" }
    ],
    comments: [
      { comment_id: 1, user_id: 2, parent_comment_id: null, text: "Congratulations team! The problem statements from the Bengaluru startups were brilliant.", created_at: ISODate("2026-09-28T13:05:00+05:30") },
      { comment_id: 2, user_id: 1, parent_comment_id: 1,    text: "Thanks Ananya! We hope to run a 36-hour edition next year.",                               created_at: ISODate("2026-09-28T13:20:00+05:30") },
      { comment_id: 3, user_id: 9, parent_comment_id: null, text: "Still paying back the sleep debt. Worth every minute!",                                    created_at: ISODate("2026-09-28T14:10:00+05:30") },
      { comment_id: 4, user_id: 3, parent_comment_id: 3,    text: "Same here, Vikram. The chai at 3 AM saved us.",                                            created_at: ISODate("2026-09-28T15:00:00+05:30") }
    ]
  },
  {
    post_id: 2,   // Auditions Open: Winter Play
    media: [
      { url: "https://cdn.eveport.in/posts/2/idgah_audition_poster.jpg", media_type: "image" }
    ],
    comments: [
      { comment_id: 1, user_id: 6, parent_comment_id: null, text: "Is Hindi dialogue delivery compulsory, or can we audition in Kannada too?", created_at: ISODate("2026-10-05T19:40:00+05:30") },
      { comment_id: 2, user_id: 2, parent_comment_id: 1,    text: "Hindi for the main script, but we are adding a Kannada folk scene. Come audition!", created_at: ISODate("2026-10-05T20:10:00+05:30") },
      { comment_id: 3, user_id: 4, parent_comment_id: null, text: "Premchand is an excellent choice. Can Raaga provide live background music?", created_at: ISODate("2026-10-06T09:30:00+05:30") }
    ]
  },
  {
    post_id: 3,   // Raag Yaman Rehearsal Peek
    media: [
      { url: "https://cdn.eveport.in/posts/3/yaman_rehearsal.mp4", media_type: "video" }
    ],
    comments: [
      { comment_id: 1, user_id: 1, parent_comment_id: null, text: "The tabla and sitar jugalbandi sounds amazing. Cannot wait for the evening!", created_at: ISODate("2026-10-09T09:15:00+05:30") },
      { comment_id: 2, user_id: 4, parent_comment_id: 1,    text: "Thank you Aarav! Do bring your friends, seats are filling up.",                created_at: ISODate("2026-10-09T10:00:00+05:30") },
      { comment_id: 3, user_id: 8, parent_comment_id: null, text: "Will there be a short explanation of the raag before each piece?",              created_at: ISODate("2026-10-09T21:30:00+05:30") }
    ]
  },
  {
    post_id: 4,   // Sunrise at Lalbagh
    media: [
      { url: "https://cdn.eveport.in/posts/4/lalbagh_glasshouse.jpg", media_type: "image" },
      { url: "https://cdn.eveport.in/posts/4/lalbagh_lotus.jpg",      media_type: "image" },
      { url: "https://cdn.eveport.in/posts/4/lalbagh_fog.jpg",        media_type: "image" },
      { url: "https://cdn.eveport.in/posts/4/lalbagh_group.jpg",      media_type: "image" }
    ],
    comments: [
      { comment_id: 1, user_id: 9, parent_comment_id: null, text: "That glass house shot is stunning. Which lens did you use?", created_at: ISODate("2026-09-21T12:40:00+05:30") },
      { comment_id: 2, user_id: 3, parent_comment_id: 1,    text: "A 24-70mm at f/8 for that one. I'll share the settings in the club group.", created_at: ISODate("2026-09-21T13:05:00+05:30") },
      { comment_id: 3, user_id: 6, parent_comment_id: null, text: "Loved the morning mist near the lotus pond!", created_at: ISODate("2026-09-21T15:30:00+05:30") }
    ]
  },
  {
    post_id: 5,   // Team Vega at Robocon Regionals
    media: [
      { url: "https://cdn.eveport.in/posts/5/vega_bot.jpg",       media_type: "image" },
      { url: "https://cdn.eveport.in/posts/5/vega_first_run.mp4", media_type: "video" }
    ],
    comments: [
      { comment_id: 1, user_id: 1, parent_comment_id: null, text: "Proud of the whole team. Pune regionals cleared, now on to the nationals!", created_at: ISODate("2026-10-02T17:35:00+05:30") },
      { comment_id: 2, user_id: 5, parent_comment_id: 1,    text: "Thanks Aarav. We need a software volunteer for the vision module, interested?", created_at: ISODate("2026-10-02T18:00:00+05:30") },
      { comment_id: 3, user_id: 9, parent_comment_id: 2,    text: "Count me in. I'll DM you after my lab session.",                              created_at: ISODate("2026-10-02T18:20:00+05:30") }
    ]
  },
  {
    post_id: 6,   // Startup Pitch Fest Registrations
    media: [
      { url: "https://cdn.eveport.in/posts/6/pitchfest_poster.jpg",     media_type: "image" },
      { url: "https://cdn.eveport.in/posts/6/pitchfest_guidelines.pdf", media_type: "document" }
    ],
    comments: [
      { comment_id: 1, user_id: 9, parent_comment_id: null, text: "Is there a limit on team size for the pitch?",                   created_at: ISODate("2026-10-10T13:20:00+05:30") },
      { comment_id: 2, user_id: 7, parent_comment_id: 1,    text: "Maximum four members per team. Details are in the PDF above.", created_at: ISODate("2026-10-10T14:00:00+05:30") }
    ]
  },
  {
    post_id: 7,   // Garba Night Dress Code (draft, no comments yet)
    media: [
      { url: "https://cdn.eveport.in/posts/7/garba_poster_draft.jpg", media_type: "image" }
    ],
    comments: []
  },
  {
    post_id: 8,   // Kavi Sammelan Call for Poets
    media: [
      { url: "https://cdn.eveport.in/posts/8/kavi_sammelan_poster.jpg", media_type: "image" }
    ],
    comments: [
      { comment_id: 1, user_id: 1, parent_comment_id: null, text: "Can we recite a Hindi translation of a Kannada poem?",                           created_at: ISODate("2026-10-11T20:20:00+05:30") },
      { comment_id: 2, user_id: 8, parent_comment_id: 1,    text: "Absolutely, just mention the original poet. Translations are welcome!",        created_at: ISODate("2026-10-11T21:00:00+05:30") },
      { comment_id: 3, user_id: 2, parent_comment_id: null, text: "I'll bring an Urdu ghazal. Can't wait!",                                          created_at: ISODate("2026-10-12T08:45:00+05:30") }
    ]
  },
  {
    post_id: 9,   // DSA Bootcamp Week 1 Notes
    media: [
      { url: "https://cdn.eveport.in/posts/9/dsa_week1_slides.pdf",     media_type: "document" },
      { url: "https://cdn.eveport.in/posts/9/dsa_week1_practice.pdf",   media_type: "document" }
    ],
    comments: [
      { comment_id: 1, user_id: 3, parent_comment_id: null, text: "Very clear explanation of sliding window. Please add more Codeforces problems.", created_at: ISODate("2026-10-07T08:20:00+05:30") },
      { comment_id: 2, user_id: 1, parent_comment_id: 1,    text: "Added 10 more problems to the practice sheet. Check the updated PDF.",           created_at: ISODate("2026-10-07T10:30:00+05:30") },
      { comment_id: 3, user_id: 9, parent_comment_id: 2,    text: "Thanks Aarav, I'll start with the medium ones tonight.",                          created_at: ISODate("2026-10-07T11:00:00+05:30") }
    ]
  },
  {
    post_id: 10,  // Diwali Mashup Rehearsals (archived)
    media: [
      { url: "https://cdn.eveport.in/posts/10/diwali_mashup_2025.mp3", media_type: "audio" }
    ],
    comments: [
      { comment_id: 1, user_id: 8, parent_comment_id: null, text: "This mashup got me through exam week last year!", created_at: ISODate("2025-10-19T09:00:00+05:30") },
      { comment_id: 2, user_id: 4, parent_comment_id: 1,    text: "We're planning a new Diwali mashup this year too. Watch this space!", created_at: ISODate("2025-10-19T10:10:00+05:30") }
    ]
  }
]);

// ---------------------------------------------------------------------
// 5. NORMALISE IDS so each embedded item can be updated / deleted on its own
//    notifications[].notification_id  (unique inside one user's array)
//    media[].media_id                 (unique inside one post's array)
// ---------------------------------------------------------------------
function numberItems(coll, field, idName) {
  coll.updateMany({}, [{ $set: { [field]: { $map: {
    input: { $range: [0, { $size: "$" + field }] }, as: "i",
    in: { $mergeObjects: [ { $arrayElemAt: ["$" + field, "$$i"] }, { [idName]: { $add: ["$$i", 1] } } ] }
  } } } }]);
}
numberItems(dbx.user_notifications, "notifications", "notification_id");
numberItems(dbx.post_content, "media", "media_id");

// ---------------------------------------------------------------------
// 6. MORE INDEXES  (text search on comments, notification lookup)
// ---------------------------------------------------------------------
dbx.post_content.createIndex({ "comments.text": "text" });
dbx.user_notifications.createIndex({ user_id: 1, "notifications.created_at": -1 });

// ---------------------------------------------------------------------
// 7. NoSQL FEATURE : CREATE / READ / UPDATE / DELETE  (mongosh examples;
//    the same operations are exposed by the REST API in app/api)
// ---------------------------------------------------------------------

// ---- CREATE ----
// new notification (upsert creates the user's document if missing)
dbx.user_notifications.updateOne(
  { user_id: 1 },
  { $push: { notifications: { notification_id: 100, message: "Robo Wars 2026 starts on 14 November.", is_read: false, created_at: new Date() } } },
  { upsert: true });
// new reply (comment 5) to comment 1 on post 1
dbx.post_content.updateOne(
  { post_id: 1 },
  { $push: { comments: { comment_id: 5, user_id: 6, parent_comment_id: 1, text: "Hoping to join the next edition!", created_at: new Date() } } });
// attach a media item to post 2
dbx.post_content.updateOne({ post_id: 2 }, { $push: { media: { media_id: 2, url: "/uploads/audition_clip.mp4", media_type: "video" } } });

// ---- READ ----
// unread notifications of user 1, newest first
dbx.user_notifications.aggregate([
  { $match: { user_id: 1 } }, { $unwind: "$notifications" },
  { $match: { "notifications.is_read": false } },
  { $sort: { "notifications.created_at": -1 } },
  { $replaceRoot: { newRoot: "$notifications" } }]).toArray();
// comment + media counts per post
dbx.post_content.aggregate([
  { $project: { _id: 0, post_id: 1, comments: { $size: "$comments" }, media: { $size: "$media" } } },
  { $sort: { post_id: 1 } }]).toArray();
// top commenters
dbx.post_content.aggregate([
  { $unwind: "$comments" },
  { $group: { _id: "$comments.user_id", total_comments: { $sum: 1 } } },
  { $sort: { total_comments: -1 } }]).toArray();
// full reply tree of one comment: RECURSIVE lookup (the NoSQL answer to a recursive CTE)
dbx.post_content.aggregate([
  { $match: { post_id: 1 } },
  { $unwind: "$comments" },
  { $graphLookup: { from: "post_content", startWith: "$comments.comment_id", connectFromField: "comments.comment_id",
      connectToField: "comments.parent_comment_id", as: "tree", maxDepth: 5 } },
  { $limit: 1 }]).toArray();
// full-text search over comments
dbx.post_content.find({ $text: { $search: "chai" } }, { post_id: 1 }).toArray();

// ---- UPDATE ----
// mark one notification read (arrayFilters = positional update of ONE element)
dbx.user_notifications.updateOne(
  { user_id: 1 }, { $set: { "notifications.$[n].is_read": true } }, { arrayFilters: [{ "n.notification_id": 3 }] });
// mark all read
dbx.user_notifications.updateOne(
  { user_id: 1 }, { $set: { "notifications.$[].is_read": true } });
// edit own comment (only the author matches the $elemMatch)
dbx.post_content.updateOne(
  { post_id: 1, comments: { $elemMatch: { comment_id: 3, user_id: 9 } } },
  { $set: { "comments.$.text": "Still paying back the sleep debt. Worth it!", "comments.$.edited_at": new Date() } });

// ---- DELETE ----
dbx.user_notifications.updateOne({ user_id: 1 }, { $pull: { notifications: { notification_id: 100 } } });
dbx.post_content.updateOne({ post_id: 1 }, { $pull: { comments: { comment_id: { $in: [5] } } } });   // a comment (+ replies)
dbx.post_content.updateOne({ post_id: 2 }, { $pull: { media: { media_id: 2 } } });                    // a media item
dbx.user_notifications.deleteMany({ "notifications.0": { $exists: false } });                           // empty documents

print("user_notifications: " + dbx.user_notifications.countDocuments());
print("post_content: " + dbx.post_content.countDocuments());

// ---------------------------------------------------------------------
// 8. OPTIONAL database-level access control for MongoDB
//    (enable --auth on mongod first, then un-comment)
// ---------------------------------------------------------------------
// dbx.createRole({ role: "eveportApp", privileges: [
//   { resource: { db: "eveport", collection: "user_notifications" }, actions: ["find","insert","update","remove"] },
//   { resource: { db: "eveport", collection: "post_content" },       actions: ["find","insert","update","remove"] } ], roles: [] });
// dbx.createUser({ user: "eveport_app", pwd: "App@12345", roles: ["eveportApp"] });
