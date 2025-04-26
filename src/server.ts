import express from 'express';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import cors from 'cors';
import { AccessToken } from 'livekit-server-sdk';

dotenv.config();

const LIVEKIT_BIN = process.env.LIVEKIT_BIN_PATH || 'C:\\livekit\\livekit-server.exe';
const SFU_ARGS = ['--dev', '--bind', '0.0.0.0'];

const sfu = spawn(LIVEKIT_BIN, SFU_ARGS, { stdio: 'inherit' });
sfu.on('exit', (code, sig) => {
  console.log(`livekit-server exited (code=${code}, signal=${sig})`);
  process.exit(code ?? 0);
});

const app = express();
app.use(cors(), express.json());

const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;
if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.error('Missing LIVEKIT_API_KEY or LIVEKIT_API_SECRET');
  process.exit(1);
}

app.get('/api/token', (req, res) => {
  const identity = String(req.query.identity ?? 'guest');
  const room     = String(req.query.room     ?? 'default');

  const at = new AccessToken(
    LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET,
    { identity },
  );
  at.addGrant({ roomJoin: true, room });
  res.json({ token: at.toJwt() });
});

const PORT = parseInt(process.env.PORT ?? '3000', 10);
app.listen(PORT, () => {
  console.log(`Backend + SFU launcher listening on port ${PORT}`);
});
