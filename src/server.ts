// src/server.ts
import express from 'express';
import cors from 'cors';
import { AccessToken } from 'livekit-server-sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors(), express.json());

const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;
if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.error('⚠️ Missing LIVEKIT_URL, LIVEKIT_API_KEY or LIVEKIT_API_SECRET in .env');
  process.exit(1);
}

app.get('/api/token', async (req, res) => {
  const identity = String(req.query.identity || 'guest');
  const room     = String(req.query.room     || 'default');

  // Create a LiveKit AccessToken
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, { identity });
  at.addGrant({ roomJoin: true, room, canPublish: true,
    canSubscribe: true});
  const jwt = await at.toJwt();

  res.json({ token: jwt, wsUrl: LIVEKIT_URL });
});

app.listen(9500, () => {
  console.log('✅ Token server listening on http://localhost:3000');
  console.log(`   ↳ Using LiveKit Cloud at ${LIVEKIT_URL}`);
});
