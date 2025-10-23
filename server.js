import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from 'cors'; // Import cors

dotenv.config();

const app = express();

app.use(cors()); // Enable All CORS Requests (សម្រាប់ testing)
// សម្រាប់ production, អ្នកគួរតែកំណត់ origin ឲ្យជាក់លាក់: app.use(cors({ origin: 'your-frontend-domain.com' })); 
app.use(express.json());

const SPEECH_KEY = process.env.SPEECH_KEY;
const REGION = process.env.SPEECH_REGION;

app.post("/api/tts", async (req, res) => {
  // Check for required environment variables
  if (!SPEECH_KEY || !REGION) {
    console.error('Missing SPEECH_KEY or SPEECH_REGION in environment variables.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const { text, voice } = req.body;

    // Validate input from frontend
    if (!text || !voice) {
        console.warn('Missing text or voice in request body:', req.body);
        return res.status(400).json({ error: 'Missing text or voice in request body.' });
    }
    
    // Validate voice format (basic check)
    if (!/^[a-z]{2}-[A-Z]{2}-\w+Neural$/.test(voice)) {
         console.warn('Invalid voice format received:', voice);
         return res.status(400).json({ error: 'Invalid voice format specified.' });
    }
    
    // --- កែប្រែ៖ ប្រើ Key ដោយ​ផ្ទាល់ មិន​ចាំបាច់​យក Token ទេ​សម្រាប់ REST API ---
    // const tokenRes = await fetch(`https://${REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
    //   method: "POST",
    //   headers: { "Ocp-Apim-Subscription-Key": SPEECH_KEY }
    // });
    // if (!tokenRes.ok) {
    //     const errorText = await tokenRes.text();
    //     console.error(`Failed to get Azure token (${tokenRes.status}): ${errorText}`);
    //     throw new Error(`Failed to authenticate with Azure (${tokenRes.status})`);
    // }
    // const token = await tokenRes.text();

    // Determine language code from voice name (e.g., 'km-KH')
    const langCode = voice.substring(0, 5); // Assumes format like 'km-KH-...'

    // Generate SSML (ensure text is properly escaped if needed, though usually not for plain text)
    const ssml = `
      <speak version='1.0' xml:lang='${langCode}' xmlns='http://www.w3.org/2001/10/synthesis'>
        <voice name='${voice}'>${text}</voice>
      </speak>`;
      
    console.log(`Sending SSML to Azure: ${ssml.substring(0, 150)}...`); // Log snippet

    const audioRes = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST",
      headers: {
        // --- កែប្រែ៖ ប្រើ Ocp-Apim-Subscription-Key សម្រាប់ REST API ---
        "Ocp-Apim-Subscription-Key": SPEECH_KEY, 
        // "Authorization": `Bearer ${token}`, // Not needed when using Subscription Key directly
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "Nodejs-TTS-Proxy" // Optional: Identify your app
      },
      body: ssml
    });

    if (!audioRes.ok) {
        const errorText = await audioRes.text();
        console.error(`Azure TTS Error (${audioRes.status}): ${errorText}`);
        // Send a structured error back to the frontend
        return res.status(audioRes.status).json({ 
            error: `Azure TTS failed (${audioRes.status})`, 
            details: errorText.substring(0, 300) // Limit error detail length
        });
    }

    // Get audio data as a Buffer
    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

    // Send the MP3 data back to the frontend
    res.set("Content-Type", "audio/mpeg");
    res.send(audioBuffer);

  } catch (err) {
    // Catch internal server errors (e.g., failed fetch, JSON parse error)
    console.error("Internal Server Error:", err);
    res.status(500).json({ error: 'Internal server error.', details: err.message });
  }
});

// Root endpoint for health check
app.get("/", (req, res) => res.send("✅ Azure Speech Proxy Server Running"));

// Start the server
const PORT = process.env.PORT || 3000; // Use port provided by Render or default to 3000
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
