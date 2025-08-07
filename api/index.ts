import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handle } from 'hono/vercel';
import { kv } from '@vercel/kv';

export const config = { runtime: 'edge' };

const app = new Hono().basePath('/api');

// CORS
app.use('*', cors({
  origin: ['http://localhost:5173', '*'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Helpers
async function checkRateLimit(key: string, maxAttempts = 5, windowSec = 3600) {
  const count = await kv.incr(key);
  if (count === 1) {
    await kv.expire(key, windowSec);
  }
  return count > maxAttempts;
}

// Offline Messages
app.post('/message', async (c) => {
  try {
    const { fromID, toID, ciphertext, timestamp, messageID } = await c.req.json();
    if (!fromID || !toID || !ciphertext || !timestamp) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const rlKey = `rl:offline_msg:${fromID}:${toID}`;
    const limited = await checkRateLimit(rlKey, 5, 3600);
    if (limited) return c.json({ error: 'Rate limit exceeded. Max 5 offline messages per hour.' }, 429);

    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24h
    const item = { message_id: messageID || Date.now().toString(36), from_user_id: fromID, ciphertext, timestamp, expiresAt };
    await kv.rpush(`offline:${toID}`, JSON.stringify(item));

    return c.json({ success: true, messageID: item.message_id });
  } catch (err) {
    console.error('Error storing offline message:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.get('/messages', async (c) => {
  try {
    const userID = c.req.query('userID');
    if (!userID) return c.json({ error: 'Missing userID parameter' }, 400);

    const key = `offline:${userID}`;
    const raw = (await kv.lrange<string>(key, 0, -1)) || [];
    const now = Date.now();
    const parsed = raw.map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
    const valid = parsed.filter((m: any) => !m.expiresAt || m.expiresAt > now);

    // delete delivered messages
    await kv.del(key);

    return c.json({ messages: valid });
  } catch (err) {
    console.error('Error fetching offline messages:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/ack', async (c) => {
  try {
    const { userID, msgIDs } = await c.req.json();
    console.log(`Messages acknowledged for ${userID}:`, msgIDs);
    return c.json({ success: true });
  } catch (err) {
    console.error('Error acknowledging messages:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Presence
app.post('/presence/online', async (c) => {
  try {
    const { userID } = await c.req.json();
    if (!userID) return c.json({ error: 'Missing userID' }, 400);
    await kv.hset(`presence:${userID}`, { isOnline: '1', lastSeenAt: String(Date.now()) });
    return c.json({ success: true });
  } catch (err) {
    console.error('Error updating online presence:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/presence/offline', async (c) => {
  try {
    const { userID } = await c.req.json();
    if (!userID) return c.json({ error: 'Missing userID' }, 400);
    await kv.hset(`presence:${userID}`, { isOnline: '0', lastSeenAt: String(Date.now()) });
    return c.json({ success: true });
  } catch (err) {
    console.error('Error updating offline presence:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.get('/presence/:userID', async (c) => {
  try {
    const userID = c.req.param('userID');
    if (!userID) return c.json({ error: 'Missing userID' }, 400);
    const data = await kv.hgetall<Record<string, string>>(`presence:${userID}`);
    if (!data) return c.json({ userID, isOnline: false, lastSeenAt: null });
    return c.json({ userID, isOnline: data.isOnline === '1', lastSeenAt: data.lastSeenAt ? Number(data.lastSeenAt) : null });
  } catch (err) {
    console.error('Error fetching presence:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/heartbeat', async (c) => {
  try {
    const { userID } = await c.req.json();
    if (!userID) return c.json({ error: 'Missing userID' }, 400);
    await kv.hset(`presence:${userID}`, { isOnline: '1', lastSeenAt: String(Date.now()) });
    return c.json({ success: true });
  } catch (err) {
    console.error('Error updating heartbeat:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Cleanup (lightweight)
app.post('/cleanup', async (c) => {
  try {
    // No global scan in Edge KV; messages are removed on delivery, rate-limit keys auto-expire.
    return c.json({ success: true, message: 'Cleanup not required (keys auto-expire, messages cleared on delivery).' });
  } catch (err) {
    console.error('Error during cleanup:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default handle(app);
