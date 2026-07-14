require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
const Redis = require('ioredis');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
const redis = new Redis(process.env.REDIS_URL);

(async () => {
  const client = await pool.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (anonymous_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), created_at TIMESTAMPTZ DEFAULT NOW(), verified BOOLEAN DEFAULT FALSE, last_active TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS balances (anonymous_id UUID PRIMARY KEY REFERENCES users(anonymous_id) ON DELETE CASCADE, minutes DECIMAL(10,2) DEFAULT 10.00, updated_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS heat (anonymous_id UUID PRIMARY KEY REFERENCES users(anonymous_id) ON DELETE CASCADE, score INT DEFAULT 50, streak INT DEFAULT 0, is_golden_earbud BOOLEAN DEFAULT FALSE, total_helped INT DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS sessions (session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), seeker_id UUID REFERENCES users(anonymous_id), helper_id UUID REFERENCES users(anonymous_id), started_at TIMESTAMPTZ DEFAULT NOW(), ended_at TIMESTAMPTZ, ended_early BOOLEAN DEFAULT FALSE, seeker_rating INT CHECK (seeker_rating BETWEEN 1 AND 5), helper_rating INT CHECK (helper_rating BETWEEN 1 AND 5), acted_on_advice BOOLEAN DEFAULT FALSE, dispute_flag BOOLEAN DEFAULT FALSE, reflection TEXT, is_emergency BOOLEAN DEFAULT FALSE, topics TEXT[] DEFAULT '{}', call_duration INT DEFAULT 0);
    CREATE TABLE IF NOT EXISTS mood_logs (id SERIAL PRIMARY KEY, anonymous_id UUID REFERENCES users(anonymous_id) ON DELETE CASCADE, mood VARCHAR(50), energy_level INT CHECK (energy_level BETWEEN 1 AND 10), logged_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS achievements (id SERIAL PRIMARY KEY, anonymous_id UUID REFERENCES users(anonymous_id) ON DELETE CASCADE, achievement_type VARCHAR(50), achieved_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(anonymous_id, achievement_type));
    CREATE TABLE IF NOT EXISTS notifications (id SERIAL PRIMARY KEY, anonymous_id UUID REFERENCES users(anonymous_id) ON DELETE CASCADE, message TEXT, is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW());
  `);
  client.release();
  console.log('✅ Database ready with all tables');
})();

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const rooms = new Map();

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => ws.isAlive = true);
  ws.on('message', async (msg) => {
    try {
      const data = JSON.parse(msg);
      const { type, sessionId, payload } = data;
      if (type === 'join') {
        if (!rooms.has(sessionId)) rooms.set(sessionId, {});
        const room = rooms.get(sessionId);
        if (!room.helper) room.helper = ws;
        else if (!room.seeker) room.seeker = ws;
        else return ws.send(JSON.stringify({ type: 'error', msg: 'Room full' }));
        ws.sessionId = sessionId;
        ws.role = room.helper === ws ? 'helper' : 'seeker';
        console.log(`🔗 ${ws.role} joined ${sessionId}`);
      }
      if (type === 'offer' || type === 'answer' || type === 'candidate') {
        const room = rooms.get(sessionId);
        if (!room) return;
        const target = room.helper === ws ? room.seeker : room.helper;
        if (target && target.readyState === WebSocket.OPEN) {
          target.send(JSON.stringify({ type, payload }));
        }
      }
    } catch (e) { console.error('WS Error:', e); }
  });
  ws.on('close', () => {
    if (ws.sessionId && rooms.has(ws.sessionId)) {
      const room = rooms.get(ws.sessionId);
      const other = room?.helper === ws ? room.seeker : room.helper;
      if (other?.readyState === WebSocket.OPEN) other.send(JSON.stringify({ type: 'peer_disconnected' }));
      rooms.delete(ws.sessionId);
    }
  });
});

setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

app.get('/health', (req, res) => res.send('OK'));

app.post('/api/calibrate', async (req, res) => {
  const { anonymous_id, embedding, problem_category, topics, is_emergency } = req.body;
  if (!anonymous_id || !embedding) return res.status(400).json({ error: 'Missing fields' });
  await pool.query('INSERT INTO users (anonymous_id) VALUES ($1) ON CONFLICT DO NOTHING', [anonymous_id]);
  await pool.query('INSERT INTO balances (anonymous_id) VALUES ($1) ON CONFLICT DO NOTHING', [anonymous_id]);
  await pool.query('INSERT INTO heat (anonymous_id) VALUES ($1) ON CONFLICT DO NOTHING', [anonymous_id]);
  if (topics && topics.length > 0) await redis.hset(`user:${anonymous_id}`, 'topics', JSON.stringify(topics));
  if (is_emergency) {
    const available = await redis.lpop('queue:available');
    if (available) {
      const sessionId = uuidv4();
      await pool.query('INSERT INTO sessions (session_id, seeker_id, helper_id, is_emergency) VALUES ($1, $2, $3, true)', [sessionId, anonymous_id, available]);
      return res.json({ status: 'matched', session_id: sessionId, is_emergency: true, turn_server: process.env.TURN_SERVER_URL || 'stun:stun.l.google.com:19302' });
    }
  }
  let bestMatch = null;
  let bestScore = -Infinity;
  const queuedUsers = await redis.zrange('queue:pending', 0, -1);
  for (const raw of queuedUsers) {
    const user = JSON.parse(raw);
    if (user.id === anonymous_id) continue;
    let topicMatch = true;
    if (topics && topics.length > 0) {
      const userTopics = await redis.hget(`user:${user.id}`, 'topics');
      if (userTopics) {
        const parsedTopics = JSON.parse(userTopics);
        const shared = topics.filter(t => parsedTopics.includes(t));
        if (shared.length < 2) topicMatch = false;
      }
    }
    if (!topicMatch) continue;
    const distance = calculateEmotionalDistance(embedding, user.embedding);
    if (distance > bestScore) { bestScore = distance; bestMatch = user.id; }
  }
  if (bestMatch) {
    const sessionId = uuidv4();
    await pool.query('INSERT INTO sessions (session_id, seeker_id, helper_id, topics) VALUES ($1, $2, $3, $4)', [sessionId, anonymous_id, bestMatch, topics || []]);
    await redis.zrem('queue:pending', JSON.stringify({ id: anonymous_id }));
    await redis.zrem('queue:pending', JSON.stringify({ id: bestMatch }));
    return res.json({ status: 'matched', session_id: sessionId, turn_server: process.env.TURN_SERVER_URL || 'stun:stun.l.google.com:19302' });
  }
  await redis.zadd('queue:pending', embedding[0] || 0, JSON.stringify({ id: anonymous_id, embedding, timestamp: Date.now() }));
  await redis.expire('queue:pending', 90);
  return res.json({ status: 'queued', queue_position: 1, estimated_wait: 90 });
});

app.get('/api/balance', async (req, res) => {
  const { anonymous_id } = req.query;
  const balance = await pool.query('SELECT minutes FROM balances WHERE anonymous_id = $1', [anonymous_id]);
  const heat = await pool.query('SELECT score, streak, is_golden_earbud, total_helped FROM heat WHERE anonymous_id = $1', [anonymous_id]);
  const stats = await getUserStats(anonymous_id);
  const achievements = await pool.query('SELECT achievement_type FROM achievements WHERE anonymous_id = $1', [anonymous_id]);
  const notifications = await pool.query('SELECT id, message, is_read, created_at FROM notifications WHERE anonymous_id = $1 AND is_read = false ORDER BY created_at DESC LIMIT 5', [anonymous_id]);
  res.json({
    balance: parseFloat(balance.rows[0]?.minutes) || 10,
    heat_score: heat.rows[0]?.score || 50,
    streak: heat.rows[0]?.streak || 0,
    is_golden_earbud: heat.rows[0]?.is_golden_earbud || false,
    total_helped: heat.rows[0]?.total_helped || 0,
    stats: stats,
    achievements: achievements.rows.map(a => a.achievement_type),
    notifications: notifications.rows,
    message: heat.rows[0]?.is_golden_earbud ? '👑 Golden Earbud! You earn double minutes!' : null
  });
});

app.post('/api/call/end', async (req, res) => {
  const { session_id, anonymous_id, ended_early, call_duration } = req.body;
  await pool.query('UPDATE sessions SET ended_at = NOW(), ended_early = $1, call_duration = $2 WHERE session_id = $3 AND seeker_id = $4', [ended_early || false, call_duration || 0, session_id, anonymous_id]);
  const helper = await pool.query('SELECT helper_id FROM sessions WHERE session_id = $1', [session_id]);
  if (helper.rows.length > 0) {
    const helperId = helper.rows[0].helper_id;
    const golden = await pool.query('SELECT is_golden_earbud FROM heat WHERE anonymous_id = $1', [helperId]);
    const multiplier = golden.rows[0]?.is_golden_earbud ? 2 : 1;
    const minutesEarned = 15 * multiplier;
    await pool.query('INSERT INTO balances (anonymous_id, minutes) VALUES ($1, $2) ON CONFLICT (anonymous_id) DO UPDATE SET minutes = balances.minutes + $2', [helperId, minutesEarned]);
    if (!ended_early) await pool.query('UPDATE heat SET total_helped = total_helped + 1 WHERE anonymous_id = $1', [helperId]);
    const streakResult = await pool.query('SELECT streak FROM heat WHERE anonymous_id = $1', [anonymous_id]);
    const currentStreak = streakResult.rows[0]?.streak || 0;
    const newStreak = ended_early ? 0 : currentStreak + 1;
    let bonus = 0;
    if (newStreak >= 7) bonus = 10;
    if (newStreak >= 30) bonus = 30;
    if (newStreak >= 100) bonus = 100;
    await pool.query('INSERT INTO heat (anonymous_id, streak) VALUES ($1, $2) ON CONFLICT (anonymous_id) DO UPDATE SET streak = $2', [anonymous_id, newStreak]);
    if (bonus > 0) {
      await pool.query('UPDATE balances SET minutes = minutes + $1 WHERE anonymous_id = $2', [bonus, anonymous_id]);
      await pool.query('INSERT INTO notifications (anonymous_id, message) VALUES ($1, $2)', [anonymous_id, `🎉 ${newStreak}-day streak! You earned ${bonus} bonus minutes!`]);
    }
    const newAchievements = await checkAchievements(helperId);
    res.json({ status: 'ended', minutes_earned: minutesEarned, streak: newStreak, streak_bonus: bonus, new_achievements: newAchievements });
  } else {
    res.json({ status: 'ended' });
  }
});

app.post('/api/rating', async (req, res) => {
  const { session_id, anonymous_id, helpfulness_score, acted_on_advice } = req.body;
  await pool.query('UPDATE sessions SET seeker_rating = $1, acted_on_advice = $2 WHERE session_id = $3 AND seeker_id = $4', [helpfulness_score, acted_on_advice, session_id, anonymous_id]);
  const session = await pool.query('SELECT helper_id FROM sessions WHERE session_id = $1', [session_id]);
  if (session.rows.length > 0) {
    const helperId = session.rows[0].helper_id;
    const delta = (helpfulness_score - 2.5) * 0.5;
    await pool.query('INSERT INTO heat (anonymous_id, score) VALUES ($1, 50) ON CONFLICT (anonymous_id) DO UPDATE SET score = GREATEST(0, LEAST(100, heat.score + $2))', [helperId, delta]);
    const ratings = await pool.query('SELECT AVG(seeker_rating) as avg_rating, COUNT(*) as count FROM sessions WHERE helper_id = $1 AND seeker_rating IS NOT NULL', [helperId]);
    if (ratings.rows[0].count >= 5 && ratings.rows[0].avg_rating >= 4.5) {
      await pool.query('UPDATE heat SET is_golden_earbud = true WHERE anonymous_id = $1', [helperId]);
      await pool.query('INSERT INTO notifications (anonymous_id, message) VALUES ($1, $2)', [helperId, '👑 Congratulations! You are now a Golden Earbud! You earn double minutes!']);
    }
  }
  res.json({ status: 'rated' });
});

app.post('/api/mood/log', async (req, res) => {
  const { anonymous_id, mood, energy_level } = req.body;
  await pool.query('INSERT INTO mood_logs (anonymous_id, mood, energy_level, logged_at) VALUES ($1, $2, $3, NOW())', [anonymous_id, mood, energy_level]);
  await pool.query('UPDATE users SET last_active = NOW() WHERE anonymous_id = $1', [anonymous_id]);
  res.json({ status: 'logged' });
});

app.get('/api/mood/history', async (req, res) => {
  const { anonymous_id } = req.query;
  const history = await pool.query('SELECT mood, energy_level, logged_at FROM mood_logs WHERE anonymous_id = $1 ORDER BY logged_at DESC LIMIT 30', [anonymous_id]);
  res.json({ history: history.rows });
});

app.post('/api/journal/save', async (req, res) => {
  const { anonymous_id, session_id, reflection } = req.body;
  await pool.query('UPDATE sessions SET reflection = $1 WHERE session_id = $2 AND seeker_id = $3', [reflection, session_id, anonymous_id]);
  res.json({ status: 'saved' });
});

app.get('/api/journal/view', async (req, res) => {
  const { anonymous_id } = req.query;
  const journal = await pool.query('SELECT session_id, reflection, started_at FROM sessions WHERE seeker_id = $1 AND reflection IS NOT NULL ORDER BY started_at DESC LIMIT 20', [anonymous_id]);
  res.json({ journal: journal.rows });
});

app.get('/api/leaderboard', async (req, res) => {
  const leaderboard = await pool.query('SELECT anonymous_id, score, streak, is_golden_earbud, total_helped FROM heat ORDER BY score DESC LIMIT 10');
  res.json({ leaderboard: leaderboard.rows });
});

app.post('/api/verify/send', async (req, res) => {
  const { phone_number, anonymous_id } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000);
  await redis.setex(`verify:${anonymous_id}`, 300, JSON.stringify({ code, phone_number }));
  console.log(`📱 Verification code for ${phone_number}: ${code}`);
  res.json({ status: 'code_sent' });
});

app.post('/api/verify/confirm', async (req, res) => {
  const { anonymous_id, code } = req.body;
  const stored = await redis.get(`verify:${anonymous_id}`);
  if (!stored) return res.status(400).json({ error: 'Code expired' });
  const data = JSON.parse(stored);
  if (data.code === parseInt(code)) {
    await pool.query('UPDATE users SET verified = true WHERE anonymous_id = $1', [anonymous_id]);
    await redis.del(`verify:${anonymous_id}`);
    res.json({ status: 'verified' });
  } else {
    res.status(400).json({ error: 'Invalid code' });
  }
});

app.get('/api/match/status', async (req, res) => {
  const { anonymous_id } = req.query;
  const result = await pool.query('SELECT session_id FROM sessions WHERE seeker_id = $1 AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1', [anonymous_id]);
  if (result.rows.length > 0) return res.json({ status: 'matched', session_id: result.rows[0].session_id });
  res.json({ status: 'waiting' });
});

app.get('/api/notifications', async (req, res) => {
  const { anonymous_id } = req.query;
  const notifications = await pool.query('SELECT id, message, is_read, created_at FROM notifications WHERE anonymous_id = $1 ORDER BY created_at DESC LIMIT 20', [anonymous_id]);
  res.json({ notifications: notifications.rows });
});

app.post('/api/notifications/read', async (req, res) => {
  const { anonymous_id, notification_id } = req.body;
  await pool.query('UPDATE notifications SET is_read = true WHERE id = $1 AND anonymous_id = $2', [notification_id, anonymous_id]);
  res.json({ status: 'marked_read' });
});

function calculateEmotionalDistance(emb1, emb2) {
  let sum = 0;
  for (let i = 0; i < Math.min(emb1.length, emb2.length); i++) {
    sum += Math.pow(emb1[i] - emb2[i], 2);
  }
  return Math.sqrt(sum);
}

async function checkAchievements(anonymous_id) {
  const heat = await pool.query('SELECT streak, total_helped, is_golden_earbud FROM heat WHERE anonymous_id = $1', [anonymous_id]);
  const existing = await pool.query('SELECT achievement_type FROM achievements WHERE anonymous_id = $1', [anonymous_id]);
  const existingTypes = existing.rows.map(r => r.achievement_type);
  const newAchievements = [];
  if (heat.rows[0]?.streak >= 7 && !existingTypes.includes('7_day_streak')) newAchievements.push('7_day_streak');
  if (heat.rows[0]?.streak >= 30 && !existingTypes.includes('30_day_streak')) newAchievements.push('30_day_streak');
  if (heat.rows[0]?.total_helped >= 10 && !existingTypes.includes('helped_10')) newAchievements.push('helped_10');
  if (heat.rows[0]?.total_helped >= 50 && !existingTypes.includes('helped_50')) newAchievements.push('helped_50');
  if (heat.rows[0]?.is_golden_earbud && !existingTypes.includes('golden_earbud')) newAchievements.push('golden_earbud');
  for (const achievement of newAchievements) {
    await pool.query('INSERT INTO achievements (anonymous_id, achievement_type) VALUES ($1, $2)', [anonymous_id, achievement]);
    await pool.query('INSERT INTO notifications (anonymous_id, message) VALUES ($1, $2)', [anonymous_id, `🏆 Achievement unlocked: ${achievement.replace('_', ' ').toUpperCase()}!`]);
  }
  return newAchievements;
}

async function getUserStats(anonymous_id) {
  const userAvg = await pool.query('SELECT AVG(seeker_rating) as avg FROM sessions WHERE seeker_id = $1 AND seeker_rating IS NOT NULL', [anonymous_id]);
  const globalAvg = await pool.query('SELECT AVG(seeker_rating) as avg FROM sessions WHERE seeker_rating IS NOT NULL');
  const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
  return {
    your_average: parseFloat(userAvg.rows[0]?.avg) || 0,
    global_average: parseFloat(globalAvg.rows[0]?.avg) || 0,
    total_users: parseInt(totalUsers.rows[0]?.count) || 0
  };
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 BalanceHeat Hub Ultimate on ${PORT}`);
  console.log(`✅ All 12 features integrated:`);
  console.log(`  1. Smart AI Matching`);
  console.log(`  2. Golden Earbud Badge`);
  console.log(`  3. Streak System`);
  console.log(`  4. Emergency Mode`);
  console.log(`  5. Mood Tracker`);
  console.log(`  6. Reflection Journal`);
  console.log(`  7. Topics Filter`);
  console.log(`  8. Transparency Stats`);
  console.log(`  9. Phone Verification`);
  console.log(` 10. Community Leaderboard`);
  console.log(` 11. Achievements System`);
  console.log(` 12. Notifications`);
});
