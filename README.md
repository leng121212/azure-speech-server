# Azure Speech Proxy Server

This server acts as a secure proxy for Microsoft Azure AI Speech (Text-to-Speech).

## 🚀 How to Deploy on Render.com

1. Go to [Render.com](https://render.com)
2. Click **New → Web Service**
3. Connect this folder via GitHub or upload ZIP manually.
4. In "Environment Variables", add:

   ```
   SPEECH_KEY=your_azure_key_here
   SPEECH_REGION=eastasia
   ```

5. Build command: `npm install`
6. Start command: `npm start`
7. After deployment, Render will provide a URL like:

   ```
   https://your-app-name.onrender.com/api/tts
   ```

8. Use that URL in your `Combind.html` fetch() call instead of localhost.

Example:

```js
fetch("https://your-app-name.onrender.com/api/tts", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: "សួស្តី", voice: "km-KH-SreymomNeural" })
});
```

✅ Done! Your Khmer voices (Piseth/Sreymom) will now work online.
