import { spawn } from 'child_process';
import express from 'express';
import cors from 'cors';
import { AccessToken } from 'livekit-server-sdk';
import dotenv from 'dotenv';

dotenv.config();

// 1) Launch the livekit-server binary in dev mode
const sfu = spawn(`${process.env.LIVEKIT_BIN_PATH}`, ['--dev','--bind','0.0.0.0'], { stdio: 'inherit' });
sfu.on('exit', (code) => {
  console.log(`livekit-server exited (${code})`);
  process.exit(code ?? 0);
});

// 2) Express token endpoint
const app = express();
app.use(cors(), express.json());

const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;
if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.error('⚠️ Missing LIVEKIT_API_KEY or LIVEKIT_API_SECRET');
  process.exit(1);
}

app.get('/api/token', async (req, res) => {
  const identity = String(req.query.identity || 'guest');
  const room     = String(req.query.room     || 'default');
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, { identity });
  at.addGrant({ roomJoin: true, room });
  const jwt = await at.toJwt();
  res.json({ token: jwt });
});

app.listen(3000, () => {
  console.log('Backend + SFU launcher listening on port 3000');
});
