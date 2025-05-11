// src/server.ts
import express from 'express';
import cors from 'cors';
import { AccessToken, EgressClient, EncodedFileOutput, AzureBlobUpload} from 'livekit-server-sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors(), express.json());

const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;
if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.error('⚠️ Missing LIVEKIT_URL, LIVEKIT_API_KEY or LIVEKIT_API_SECRET in .env');
  process.exit(1);
}

const egressClient = new EgressClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

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

app.post('/api/start-recording', async (req, res) => {
  const { room, fileName } = req.body;
  console.log('Received request to start recording:'+  room +", FileName:"+ fileName );
  if (!room) {
    return res.status(400).json({ error: 'Missing room name' });
  }

  try {

    const fileOutput = new EncodedFileOutput({
      filepath: 'livekit-demo/'+fileName+'.mp4',
      output: {
        case: 'azure',
        value: new AzureBlobUpload({
          accountName: 'orionlivekitrecordings',
          accountKey: 'NT4Z+OSUFB3JGFAAXTB9vuDJE09Y1WrEDBDGjwClMs/kax7czqiHLqX9K4u06UfBvDbvmK+lhxMF+ASt8LIRtg==',
          containerName: 'orionrecordings',
        }),
      },
    });
    const info = await egressClient.startRoomCompositeEgress(room, { file: fileOutput }, { layout: 'grid' });

    res.status(200).json({
      message: 'Recording started',
      egressId: info.egressId
    });
  } catch (err: any) {
    console.error('Failed to start recording:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

app.post("/api/stop-recording", async (req, res) => {
  const { egressId } = req.body; // Assume room name is sent in the request body

  if (!egressId) {
    return res.status(400).json({ error: "egressId is required" });
  }

  try {
    // Fetch the active recording for the given room
    const recording = await egressClient.stopEgress(egressId);

    // Respond with a success message
    res.status(200).json({ message: "Recording stopped successfully", recording });
  } catch (error) {
    console.error("Error stopping recording:", error);
    res.status(500).json({ error: "Failed to stop recording" });
  }
});


app.listen(9500, () => {
  console.log('✅ Token server listening on http://localhost:3000');
  console.log(`   ↳ Using LiveKit Cloud at ${LIVEKIT_URL}`);
});
