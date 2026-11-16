import { MongoClient } from 'mongodb';

let clientPromise = globalThis.__epMongo;
if (!clientPromise) {
  clientPromise = globalThis.__epMongo = new MongoClient(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017').connect();
}

export async function mongo() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGO_DB || 'eveport');
  return { notifications: db.collection('user_notifications'), content: db.collection('post_content') };
}

// push a notification (creates the user's document on first use)
// Never throws: a notification failure must not undo a successful MySQL action.
export async function notify(userId, message) {
  try {
    const { notifications } = await mongo();
    await notifications.updateOne(
      { user_id: Number(userId) },
      { $push: { notifications: { notification_id: Date.now() * 1000 + Math.floor(Math.random() * 1000), message, is_read: false, created_at: new Date() } } },
      { upsert: true }
    );
  } catch (e) { console.error('notify failed:', e.message); }
}
