import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { AccessToken } from 'livekit-server-sdk';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;
if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.error('⚠️ Missing LIVEKIT_API_KEY or LIVEKIT_API_SECRET in .env');
  process.exit(1);
}

// 1) Make callback async
app.get('/api/token', async (req: Request, res: Response) => {
  const identity = String(req.query.identity || 'guest');
  const room     = String(req.query.room     || 'default');

  // 2) Create token and grant
  const at = new AccessToken(
    LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET,
    { identity }
  );
  at.addGrant({ roomJoin: true, room });

  try {
    // 3) Await the JWT string!
    const jwt = await at.toJwt();
    res.json({ token: jwt });   // now a real string
  } catch (err) {
    console.error('Token generation failed', err);
    res.status(500).json({ error: 'token generation failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
