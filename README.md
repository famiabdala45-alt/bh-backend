```markdown
# 🔥 BalanceHeat Hub - bh-backend

**The World's Most Advanced Mirror Economy Platform**

A real-time peer-to-peer audio platform that connects strangers with opposite emotional states. Built with Node.js, Express, WebSockets, PostgreSQL, and Redis.

---

## 📋 Table of Contents

- [What This Does](#-what-this-does)
- [Core Philosophy](#-core-philosophy)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start-local-development)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Achievements](#-achievements)
- [Admin Queries](#-admin-queries)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## 🎯 What This Does

BalanceHeat Hub is not a chat app. It's a **psychological infrastructure** that:

| Feature | Description |
| :--- | :--- |
| 🎤 **Voice Analysis** | Analyzes a 60-second voice sample to detect emotional state |
| 🧠 **AI Matching** | Finds your emotional opposite using Euclidean distance |
| 📞 **7-Minute Call** | Anonymous audio call with a stranger |
| ⏳ **5-Minute Cooldown** | Forces reflection before rating |
| 💰 **Attentive Minutes** | Currency for helping others |
| 🔥 **Heat Score** | Reputation that gives priority queueing |
| 👑 **Golden Earbud** | Top advisors earn double minutes |
| 🆘 **Emergency Mode** | Skip the queue for crisis situations |
| 📝 **Reflection Journal** | Private post-call notes |
| 📊 **Mood Tracker** | Track your emotional journey |
| 🏆 **Achievements** | Unlock badges and rewards |
| 🔐 **Phone Verification** | Safer community |

---

## 🧠 Core Philosophy

> *"We don't match similarities. We match complementary suffering."*

When you're overwhelmed, you don't need someone who agrees with you. You need someone who can offer a completely different perspective. BalanceHeat Hub finds that person using emotional distance calculations.

---

## ✨ Key Features

### 1. Smart AI Matching 🧠
- Calculates emotional distance using Euclidean distance
- Matches you with your **emotional opposite**
- Uses topic filtering for better conversations

### 2. Golden Earbud Badge 👑
- Awarded to users with 5+ ratings averaging 4.5+
- **Double minutes** for every session
- Exclusive status symbol

### 3. Streak System 📈
| Streak | Bonus |
| :--- | :--- |
| 7-day streak | 10 bonus minutes |
| 30-day streak | 30 bonus minutes |
| 100-day streak | 100 bonus minutes |

### 4. Emergency Mode 🆘
- Skip the 90-second queue
- Immediate connection to an available user
- For genuine crisis situations

### 5. Mood Tracker 📊
- Log your mood and energy level daily
- View your 30-day emotional history
- Track your progress over time

### 6. Reflection Journal 📝
- Private post-call journal entries
- Only you can see them
- Save insights and lessons learned

### 7. Community Leaderboard 🏆
- Top 10 users by Heat score
- Competitive motivation
- Bragging rights

### 8. Phone Verification 🔐
- One-time SMS verification
- Reduces spam and trolls
- Safer community

### 9. Topics Filter 🔍
- Match based on shared interests
- Better conversation relevance

### 10. Transparency Stats 📊
- Compare your rating against global averages
- See your progress

### 11. Achievements System 🏅
| Achievement | Requirement |
| :--- | :--- |
| 7 Day Streak | 7 consecutive days |
| 30 Day Streak | 30 consecutive days |
| Helped 10 | Helped 10 people |
| Helped 50 | Helped 50 people |
| Golden Earbud | 5+ ratings avg 4.5+ |

### 12. Notifications System 🔔
- Real-time updates
- Achievement alerts
- Streak reminders

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Runtime** | Node.js (v20+) |
| **Framework** | Express.js |
| **Real-time** | WebSocket (ws library) |
| **Database** | PostgreSQL |
| **Queue/Matching** | Redis |
| **Auth** | None (fully anonymous + optional phone verification) |
| **Deployment** | Railway / Render / Fly.io |
| **Audio** | WebRTC (STUN/TURN) |
| **Container** | Docker & Docker Compose |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js v20+
- Docker (for PostgreSQL and Redis)
- npm or yarn

### Step 1: Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/bh-backend.git
cd bh-backend
```

Step 2: Install dependencies

```bash
npm install
```

Step 3: Start PostgreSQL and Redis (using Docker)

```bash
docker-compose up -d
```

Step 4: Set up environment variables

Create a .env file in the root directory:

```env
PORT=3000
DATABASE_URL=postgresql://balanceheat:balanceheat123@localhost:5432/balanceheat_db
REDIS_URL=redis://localhost:6379
TURN_SERVER_URL=stun:stun.l.google.com:19302
NODE_ENV=development
```

Step 5: Start the server

```bash
npm start
```

Step 6: Test it

```bash
curl http://localhost:3000/health
# Should return: OK
```

Step 7: Run with auto-restart (development)

```bash
npm run dev
```

Step 8: Stop containers

```bash
docker-compose down
```

---

📡 API Endpoints

Health Check

Method Endpoint Description
GET /health Check if server is running

User Management

Method Endpoint Description
POST /api/calibrate Submit voice embedding & get matched
GET /api/balance Get balance, heat score, streak, stats
GET /api/match/status Check if user is matched

Call Management

Method Endpoint Description
POST /api/call/end End a call session
POST /api/rating Submit rating after 5-min cooldown

Advanced Features

Method Endpoint Description
POST /api/mood/log Log mood and energy level
GET /api/mood/history Get 30-day mood history
POST /api/journal/save Save reflection journal entry
GET /api/journal/view View journal entries
GET /api/leaderboard Get top 10 users by Heat score
POST /api/verify/send Send phone verification code
POST /api/verify/confirm Confirm verification code
GET /api/notifications Get notifications
POST /api/notifications/read Mark notification as read

---

📝 Example API Calls

Calibrate (Start a session)

```json
POST /api/calibrate
{
  "anonymous_id": "user-abc-123",
  "embedding": [0.5, -0.2, 0.8, 0.1],
  "problem_category": "work_stress",
  "topics": ["career", "anxiety"],
  "is_emergency": false
}
```

Response:

```json
{
  "status": "matched",
  "session_id": "session-xyz-456",
  "turn_server": "stun:stun.l.google.com:19302"
}
```

Get Balance & Stats

```json
GET /api/balance?anonymous_id=user-abc-123
```

Response:

```json
{
  "balance": 25.5,
  "heat_score": 78,
  "streak": 12,
  "is_golden_earbud": true,
  "total_helped": 15,
  "stats": {
    "your_average": 4.2,
    "global_average": 3.8,
    "total_users": 156
  },
  "achievements": ["7_day_streak", "helped_10"],
  "notifications": [
    {
      "id": 1,
      "message": "🎉 12-day streak! You earned 10 bonus minutes!",
      "is_read": false,
      "created_at": "2026-07-05T10:00:00Z"
    }
  ],
  "message": "👑 Golden Earbud! You earn double minutes!"
}
```

End Call

```json
POST /api/call/end
{
  "session_id": "session-xyz-456",
  "anonymous_id": "user-abc-123",
  "ended_early": false,
  "call_duration": 420
}
```

Response:

```json
{
  "status": "ended",
  "minutes_earned": 30,
  "streak": 12,
  "streak_bonus": 10,
  "new_achievements": ["helped_10"]
}
```

Submit Rating

```json
POST /api/rating
{
  "session_id": "session-xyz-456",
  "anonymous_id": "user-abc-123",
  "helpfulness_score": 5,
  "acted_on_advice": true
}
```

Response:

```json
{
  "status": "rated"
}
```

Log Mood

```json
POST /api/mood/log
{
  "anonymous_id": "user-abc-123",
  "mood": "calm",
  "energy_level": 8
}
```

Response:

```json
{
  "status": "logged"
}
```

View Mood History

```json
GET /api/mood/history?anonymous_id=user-abc-123
```

Response:

```json
{
  "history": [
    { "mood": "calm", "energy_level": 8, "logged_at": "2026-07-05T10:00:00Z" },
    { "mood": "stressed", "energy_level": 3, "logged_at": "2026-07-04T10:00:00Z" }
  ]
}
```

Save Journal Entry

```json
POST /api/journal/save
{
  "anonymous_id": "user-abc-123",
  "session_id": "session-xyz-456",
  "reflection": "Today I realized that I need to ask for help more often..."
}
```

View Journal

```json
GET /api/journal/view?anonymous_id=user-abc-123
```

Response:

```json
{
  "journal": [
    {
      "session_id": "session-xyz-456",
      "reflection": "Today I realized...",
      "started_at": "2026-07-05T10:00:00Z"
    }
  ]
}
```

Get Leaderboard

```json
GET /api/leaderboard
```

Response:

```json
{
  "leaderboard": [
    { "anonymous_id": "user-abc-123", "score": 95, "streak": 12, "is_golden_earbud": true, "total_helped": 15 },
    { "anonymous_id": "user-def-456", "score": 88, "streak": 8, "is_golden_earbud": false, "total_helped": 7 }
  ]
}
```

Phone Verification

```json
POST /api/verify/send
{
  "phone_number": "+1234567890",
  "anonymous_id": "user-abc-123"
}
```

Response:

```json
{
  "status": "code_sent"
}
```

```json
POST /api/verify/confirm
{
  "anonymous_id": "user-abc-123",
  "code": 123456
}
```

Response:

```json
{
  "status": "verified"
}
```

Get Notifications

```json
GET /api/notifications?anonymous_id=user-abc-123
```

Response:

```json
{
  "notifications": [
    {
      "id": 1,
      "message": "🎉 12-day streak! You earned 10 bonus minutes!",
      "is_read": false,
      "created_at": "2026-07-05T10:00:00Z"
    },
    {
      "id": 2,
      "message": "👑 Congratulations! You are now a Golden Earbud!",
      "is_read": false,
      "created_at": "2026-07-04T10:00:00Z"
    }
  ]
}
```

Mark Notification as Read

```json
POST /api/notifications/read
{
  "anonymous_id": "user-abc-123",
  "notification_id": 1
}
```

---

🗄️ Database Schema

users

Column Type Description
anonymous_id UUID (PK) Anonymous user identifier
created_at Timestamp First use
verified Boolean Phone verification status
last_active Timestamp Last activity

balances (Attention Currency)

Column Type Description
anonymous_id UUID (PK) References users
minutes Decimal Current balance (starts at 10)
updated_at Timestamp Last update

heat (Reputation)

Column Type Description
anonymous_id UUID (PK) References users
score Int (0-100) Starts at 50
streak Int Consecutive helpful ratings
is_golden_earbud Boolean Awarded to top advisors
total_helped Int Total people helped
updated_at Timestamp Last update

sessions (Call Records)

Column Type Description
session_id UUID (PK) Unique call ID
seeker_id UUID Person seeking advice
helper_id UUID Person giving advice
started_at Timestamp Call start
ended_at Timestamp Call end
ended_early Boolean Triple-shake exit
seeker_rating Int (1-5) Rating given by seeker
helper_rating Int (1-5) Rating given by helper
acted_on_advice Boolean Did the seeker act?
dispute_flag Boolean Admin review needed
reflection Text Private journal entry
is_emergency Boolean Emergency mode flag
topics Text[] Conversation topics
call_duration Int Duration in seconds

mood_logs

Column Type Description
id Serial (PK) Unique ID
anonymous_id UUID References users
mood String happy, sad, stressed, calm, etc.
energy_level Int (1-10) Energy rating
logged_at Timestamp When it was logged

achievements

Column Type Description
id Serial (PK) Unique ID
anonymous_id UUID References users
achievement_type String Achievement name
achieved_at Timestamp When achieved

notifications

Column Type Description
id Serial (PK) Unique ID
anonymous_id UUID References users
message Text Notification content
is_read Boolean Read status
created_at Timestamp When created

---

🏆 Achievements

Achievement Requirement Reward
7 Day Streak 7 consecutive days 🏅 Badge + 10 bonus minutes
30 Day Streak 30 consecutive days 🏅 Badge + 30 bonus minutes
Helped 10 Helped 10 people 🏅 Badge + 20 bonus minutes
Helped 50 Helped 50 people 🏅 Badge + 50 bonus minutes
Golden Earbud 5+ ratings avg 4.5+ 👑 Badge + Double minutes

---

📊 Admin Queries

Daily Health Check

```sql
-- Active users today
SELECT COUNT(DISTINCT anonymous_id) FROM sessions WHERE started_at > NOW() - INTERVAL '24 hours';

-- New users today
SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '24 hours';

-- Average balance
SELECT ROUND(AVG(minutes), 2) AS avg_balance FROM balances;

-- Total calls today
SELECT COUNT(*) FROM sessions WHERE started_at > NOW() - INTERVAL '24 hours';
```

Top Performers

```sql
-- Top 10 Heat leaders
SELECT anonymous_id, score, streak, is_golden_earbud, total_helped 
FROM heat 
ORDER BY score DESC 
LIMIT 10;

-- Golden Earbud holders
SELECT COUNT(*) FROM heat WHERE is_golden_earbud = true;

-- Most active users
SELECT helper_id, COUNT(*) as sessions_helped 
FROM sessions 
GROUP BY helper_id 
ORDER BY sessions_helped DESC 
LIMIT 10;
```

Quality Metrics

```sql
-- Average rating
SELECT ROUND(AVG(seeker_rating), 2) AS avg_rating 
FROM sessions WHERE seeker_rating IS NOT NULL;

-- Panic rate (early endings)
SELECT 
  COUNT(*) AS total_calls,
  SUM(CASE WHEN ended_early = true THEN 1 ELSE 0 END) AS panic_ends,
  ROUND(100.0 * SUM(CASE WHEN ended_early = true THEN 1 ELSE 0 END) / COUNT(*), 2) AS panic_percentage
FROM sessions WHERE started_at > NOW() - INTERVAL '7 days';

-- Emergency calls
SELECT COUNT(*) FROM sessions WHERE is_emergency = true AND started_at > NOW() - INTERVAL '7 days';
```

Mood Analytics

```sql
-- Most common moods
SELECT mood, COUNT(*) FROM mood_logs GROUP BY mood ORDER BY COUNT(*) DESC;

-- Average energy by mood
SELECT mood, ROUND(AVG(energy_level), 2) AS avg_energy 
FROM mood_logs 
GROUP BY mood 
ORDER BY avg_energy DESC;
```

Achievement Stats

```sql
-- Most earned achievements
SELECT achievement_type, COUNT(*) 
FROM achievements 
GROUP BY achievement_type 
ORDER BY COUNT(*) DESC;

-- Users with most achievements
SELECT anonymous_id, COUNT(*) as achievement_count 
FROM achievements 
GROUP BY anonymous_id 
ORDER BY achievement_count DESC 
LIMIT 10;
```

Balance Economy

```sql
-- Check if users are running out of minutes
SELECT 
  COUNT(*) AS users_with_less_than_5_minutes 
FROM balances 
WHERE minutes < 5;

-- Users with no activity (stale)
SELECT b.anonymous_id, b.minutes 
FROM balances b 
LEFT JOIN sessions s ON b.anonymous_id = s.seeker_id 
WHERE s.session_id IS NULL;

-- Total minutes in economy
SELECT SUM(minutes) AS total_minutes FROM balances;
```

---

🔐 Security & Privacy

· ✅ Zero personal data: No emails, no names, no phone numbers (unless you verify)
· ✅ Audio processed on-device: Voice embeddings never leave the user's phone
· ✅ No recordings: We never store call audio
· ✅ Anonymous by design: Users are identified only by UUIDs
· ✅ Optional verification: Phone verification is optional but recommended
· ✅ Encrypted connections: HTTPS and WSS in production
· ✅ Database encryption: Sensitive data encrypted at rest

---

🚀 Deployment

Railway (Recommended)

1. Push code to GitHub
2. Go to railway.app
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your bh-backend repository
5. Add PostgreSQL and Redis plugins (one click each)
6. Set TURN_SERVER_URL environment variable
7. Deploy!

Railway Environment Variables:

Key Value
DATABASE_URL Auto-added by Railway
REDIS_URL Auto-added by Railway
TURN_SERVER_URL stun:stun.l.google.com:19302
NODE_ENV production

Render (Alternative)

1. Push code to GitHub
2. Go to render.com
3. Create a new Web Service connected to your repo
4. Build Command: npm install
5. Start Command: npm start
6. Add PostgreSQL and Redis manually

Fly.io

```bash
fly launch
fly postgres create
fly redis create
fly deploy
```

Docker (Self-Hosted)

```bash
docker-compose up -d
```

---

🧪 Testing

Manual Testing with cURL

```bash
# Start server
npm start

# Test health
curl http://localhost:3000/health

# Test calibration
curl -X POST http://localhost:3000/api/calibrate \
  -H "Content-Type: application/json" \
  -d '{"anonymous_id":"test-123","embedding":[0.5,0.3,-0.2],"problem_category":"general"}'

# Test balance
curl http://localhost:3000/api/balance?anonymous_id=test-123

# Test mood log
curl -X POST http://localhost:3000/api/mood/log \
  -H "Content-Type: application/json" \
  -d '{"anonymous_id":"test-123","mood":"happy","energy_level":8}'

# Test leaderboard
curl http://localhost:3000/api/leaderboard
```

---

🤝 Contributing

1. Fork the repository
2. Create a feature branch: git checkout -b feature/amazing-feature
3. Commit changes: git commit -m 'Add amazing feature'
4. Push: git push origin feature/amazing-feature
5. Open a Pull Request

---

📄 License

MIT License - Free for personal and commercial use.

---

🙏 Acknowledgments

· Built with ❤️ by the BalanceHeat Hub Team
· Powered by the open-source community
· Inspired by the need for genuine human connection

---

📞 Support

· Issues: GitHub Issues
· Email: famibdala45@gmail.com
· Website: balanceheat.com

---

Built with ❤️ by the BalanceHeat Hub Team

"The mirror economy starts with a single echo."

```
