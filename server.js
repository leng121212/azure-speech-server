import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

const SPEECH_KEY = process.env.SPEECH_KEY;
const REGION = process.env.SPEECH_REGION;

app.post("/api/tts", async (req, res) => {
  try {
    const { text, voice } = req.body;

    // Get Azure token
    const tokenRes = await fetch(`https://${REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
      method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": SPEECH_KEY }
    });
    const token = await tokenRes.text();

    // Generate speech
    const ssml = `
      <speak version='1.0' xml:lang='km-KH' xmlns='http://www.w3.org/2001/10/synthesis'>
        <voice name='${voice}'>${text}</voice>
      </speak>`;

    const audioRes = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3"
      },
      body: ssml
    });

    if (!audioRes.ok) throw new Error(`TTS Error: ${audioRes.status}`);
    const buf = Buffer.from(await audioRes.arrayBuffer());
    res.set("Content-Type", "audio/mpeg");
    res.send(buf);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/", (req, res) => res.send("✅ Azure Speech Proxy Server Running"));
app.listen(3000, () => console.log("✅ Server running on port 3000"));
