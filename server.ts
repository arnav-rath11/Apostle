import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  app.post("/api/apostle-ai", async (req, res) => {
    const { messages } = req.body;
    
    // Prepend system message for guardrails
    const systemMessage = {
      role: "system",
      content: `You are Apostle AI, a knowledge discovery assistant. 
Follow these rules strictly:
1. If the user asks for personal information (like their age, name) or queries that are completely irrelevant to general knowledge or Wikipedia-based topics, respond EXACTLY: "i am sorry , i cant find these details , please ask somthing else .."
2. If the user asks about a person, topic, or fact that you genuinely cannot find, answer, or access, respond EXACTLY: "i cannot generated this , propobaly in future model it will get added"`
    };

    const finalMessages = [systemMessage, ...messages];
    
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.VITE_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://apostle.app", 
          "X-Title": "Apostle"
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.1-8b-instruct",
          messages: finalMessages
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("OpenRouter API Error:", data);
        res.status(response.status).json(data);
        return;
      }
      
      res.json(data);
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
