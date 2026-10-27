const express = require("express");
const router = express.Router();

const API_KEY = process.env.AI_API_KEY || "";
const AI_MODEL = "gemini-1.5-flash"; // fast & supports multimodal audio
const AI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// Audio chunk transcription proxy
router.post("/api/ai/transcribe-chunk", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({ error: "Server AI key is not configured" });
    }

    const { base64Audio, mimeType, systemPrompt } = req.body || {};
    if (!base64Audio) {
      return res.status(400).json({ error: "Missing audio payload" });
    }

    const SEGMENTS_RESPONSE_SCHEMA = {
      type: "object",
      properties: {
        segments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              start: { type: "number" },
              end: { type: "number" },
              text: { type: "string" },
            },
            required: ["start", "end", "text"],
          },
        },
      },
      required: ["segments"],
    };

    const requestBody = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              inline_data: {
                mime_type: mimeType || "audio/wav",
                data: base64Audio,
              },
            },
            {
              text: "Transcribe this audio clip and return the timed segments JSON.",
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: SEGMENTS_RESPONSE_SCHEMA,
        temperature: 0.1,
      },
    };

    const url = `${AI_API_BASE}/${AI_MODEL}:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "AI transcription service failed" });
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return res.status(200).json({ success: true, text: rawText });
  } catch (err) {
    console.error("Transcribe chunk error:", err);
    return res.status(500).json({ error: "Internal server error during audio transcription" });
  }
});

// Generic text generation proxy
router.post("/api/ai/generate", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({ error: "Server AI key is not configured" });
    }

    const { prompt, systemInstruction } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    if (systemInstruction) {
      payload.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const url = `${AI_API_BASE}/${AI_MODEL}:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "AI service request failed" });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return res.status(200).json({ success: true, text });
  } catch (err) {
    console.error("AI service error:", err);
    return res.status(500).json({ error: "Internal server error during generation" });
  }
});

module.exports = router;
