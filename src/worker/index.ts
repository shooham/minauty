import { Hono } from "hono";
import { cors } from "hono/cors";

interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for all routes
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://*.mocha.app'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Rate limiting helper using D1 for persistence
async function checkRateLimit(db: D1Database, key: string, maxAttempts: number = 5, windowMs: number = 3600000): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Clean old entries and count current
  await db.prepare('DELETE FROM rate_limits WHERE created_at < ? AND key = ?')
    .bind(windowStart, key)
    .run();
  
  const { count } = await db.prepare('SELECT COUNT(*) as count FROM rate_limits WHERE key = ? AND created_at > ?')
    .bind(key, windowStart)
    .first() as any;
  
  if (count >= maxAttempts) {
    return true; // Rate limited
  }
  
  // Add current attempt
  await db.prepare('INSERT INTO rate_limits (key, created_at, updated_at) VALUES (?, ?, ?)')
    .bind(key, now, now)
    .run();
  
  return false;
}

// Offline Messages API
app.post('/api/message', async (c) => {
  try {
    const { fromID, toID, ciphertext, timestamp, messageID } = await c.req.json();
    
    // Validate input
    if (!fromID || !toID || !ciphertext || !timestamp) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    // Rate limiting: 5 messages per hour per sender-recipient pair
    const rateLimitKey = `offline_msg:${fromID}:${toID}`;
    const isRateLimited = await checkRateLimit(c.env.DB, rateLimitKey, 5);
    
    if (isRateLimited) {
      return c.json({ error: 'Rate limit exceeded. Max 5 offline messages per hour.' }, 429);
    }
    
    // Store encrypted message with 24 hour TTL
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    await c.env.DB.prepare(`
      INSERT INTO offline_messages (message_id, from_user_id, to_user_id, ciphertext, timestamp, expires_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(messageID || Date.now().toString(36), fromID, toID, ciphertext, timestamp, expiresAt).run();
    
    return c.json({ success: true, messageID });
  } catch (error) {
    console.error('Error storing offline message:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.get('/api/messages', async (c) => {
  try {
    const userID = c.req.query('userID');
    
    if (!userID) {
      return c.json({ error: 'Missing userID parameter' }, 400);
    }
    
    // Get all non-expired messages for user
    const messages = await c.env.DB.prepare(`
      SELECT message_id, from_user_id, ciphertext, timestamp
      FROM offline_messages 
      WHERE to_user_id = ? AND expires_at > ?
      ORDER BY timestamp ASC
    `).bind(userID, Date.now()).all();
    
    // Delete retrieved messages (they've been delivered)
    await c.env.DB.prepare(`
      DELETE FROM offline_messages 
      WHERE to_user_id = ? AND expires_at > ?
    `).bind(userID, Date.now()).run();
    
    return c.json({ messages: messages.results || [] });
  } catch (error) {
    console.error('Error fetching offline messages:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/api/ack', async (c) => {
  try {
    const { userID, msgIDs } = await c.req.json();
    
    // Log delivery acknowledgment (optional analytics)
    console.log(`Messages acknowledged for ${userID}:`, msgIDs);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error acknowledging messages:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Presence API
app.post('/api/presence/online', async (c) => {
  try {
    const { userID } = await c.req.json();
    
    if (!userID) {
      return c.json({ error: 'Missing userID' }, 400);
    }
    
    // Update or insert presence record
    await c.env.DB.prepare(`
      INSERT INTO user_presence (user_id, last_seen_at, is_online, created_at, updated_at)
      VALUES (?, datetime('now'), true, datetime('now'), datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        is_online = true,
        updated_at = datetime('now')
    `).bind(userID).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating online presence:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/api/presence/offline', async (c) => {
  try {
    const { userID } = await c.req.json();
    
    if (!userID) {
      return c.json({ error: 'Missing userID' }, 400);
    }
    
    // Update presence to offline with current timestamp
    await c.env.DB.prepare(`
      INSERT INTO user_presence (user_id, last_seen_at, is_online, created_at, updated_at)
      VALUES (?, datetime('now'), false, datetime('now'), datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        last_seen_at = datetime('now'),
        is_online = false,
        updated_at = datetime('now')
    `).bind(userID).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating offline presence:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.get('/api/presence/:userID', async (c) => {
  try {
    const userID = c.req.param('userID');
    
    if (!userID) {
      return c.json({ error: 'Missing userID' }, 400);
    }
    
    const presence = await c.env.DB.prepare(`
      SELECT user_id, last_seen_at, is_online
      FROM user_presence 
      WHERE user_id = ?
    `).bind(userID).first();
    
    if (!presence) {
      return c.json({ 
        userID, 
        isOnline: false, 
        lastSeenAt: null 
      });
    }
    
    return c.json({
      userID: presence.user_id,
      isOnline: presence.is_online,
      lastSeenAt: presence.last_seen_at
    });
  } catch (error) {
    console.error('Error fetching presence:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/api/heartbeat', async (c) => {
  try {
    const { userID } = await c.req.json();
    
    if (!userID) {
      return c.json({ error: 'Missing userID' }, 400);
    }
    
    // Update last seen timestamp while keeping online status
    await c.env.DB.prepare(`
      INSERT INTO user_presence (user_id, last_seen_at, is_online, created_at, updated_at)
      VALUES (?, datetime('now'), true, datetime('now'), datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        last_seen_at = datetime('now'),
        is_online = true,
        updated_at = datetime('now')
    `).bind(userID).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating heartbeat:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Cleanup expired messages (run periodically)
app.post('/api/cleanup', async (c) => {
  try {
    // Delete expired offline messages
    await c.env.DB.prepare(`
      DELETE FROM offline_messages 
      WHERE expires_at < ?
    `).bind(Date.now()).run();
    
    // Delete old rate limit entries (older than 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    await c.env.DB.prepare(`
      DELETE FROM rate_limits 
      WHERE created_at < ?
    `).bind(oneDayAgo).run();
    
    return c.json({ success: true, message: 'Cleanup completed' });
  } catch (error) {
    console.error('Error during cleanup:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;
