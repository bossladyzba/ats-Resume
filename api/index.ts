import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "10mb" }));

// API Proxy for Gemini to keep the key secure
app.post("/api/gemini", async (req, res) => {
  const { model, contents, config } = req.body;
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
  }

  try {
    const genAI = new GoogleGenAI(apiKey);
    const genModel = genAI.getGenerativeModel({ 
      model: model || "gemini-1.5-flash",
      systemInstruction: config?.systemInstruction,
    });

    const result = await genModel.generateContent({
      contents: Array.isArray(contents) ? contents : [contents],
      generationConfig: {
          responseMimeType: config?.responseMimeType,
          responseSchema: config?.responseSchema,
      }
    });
    
    const response = await result.response;
    const text = response.text();
    res.json({ text });
  } catch (error: any) {
    console.error("Gemini Server Error:", error);
    res.status(error.status || 500).json({ 
      error: error.message,
      status: error.status
    });
  }
});

// For development only: vite middleware
// In production or on Vercel, this part is skipped or handled by vercel.json
if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  // In production (like when running 'npm start' or on some platforms), serve the dist folder
  // Note: Vercel standard deployment will usually ignore this if vercel.json is set up for SPA
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Only listen if we are not in a serverless environment (Vercel)
// Vercel exports the app, but some environments might need app.listen
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
